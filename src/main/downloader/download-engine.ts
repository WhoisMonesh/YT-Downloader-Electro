import { randomUUID } from "crypto";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { BrowserWindow } from "electron";
import { YtDlpManager } from "./yt-dlp-manager";
import { FFmpegManager } from "../ffmpeg/ffmpeg-manager";
import { SettingsManager } from "../settings/settings-manager";
import { QueueManager } from "../queue/queue-manager";
import { HistoryManager } from "../database/history-manager";
import { Logger } from "../../shared/logger";
import type { DownloadItem, DownloadProgress } from "../../shared/types";
import type { ChildProcess } from "child_process";

const logger = new Logger("download-engine");

function parseBytes(val: string, unit: string): number {
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  const u = unit.trim().toUpperCase();
  if (u.startsWith("K")) return Math.round(num * 1024);
  if (u.startsWith("M")) return Math.round(num * 1024 * 1024);
  if (u.startsWith("G")) return Math.round(num * 1024 * 1024 * 1024);
  if (u.startsWith("T")) return Math.round(num * 1024 * 1024 * 1024 * 1024);
  return Math.round(num);
}

function parseEta(etaStr: string): number {
  const parts = etaStr.trim().split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export class DownloadEngine {
  private ytDlp: YtDlpManager;
  private ffmpeg: FFmpegManager;
  private settings: SettingsManager;
  private queueManager: QueueManager;
  private historyManager: HistoryManager;
  private activeDownloads: Map<string, { pid?: number; process?: ChildProcess; item: DownloadItem; webtorrentClient?: any }> = new Map();
  private maxConcurrent: number = 3;
  private queue: DownloadItem[] = [];
  private lastDownloadStartTime: number = 0;
  private isWaiting: boolean = false;

  constructor(
    ytDlp: YtDlpManager,
    ffmpeg: FFmpegManager,
    settings: SettingsManager,
    queueManager: QueueManager,
    historyManager: HistoryManager,
  ) {
    this.ytDlp = ytDlp;
    this.ffmpeg = ffmpeg;
    this.settings = settings;
    this.queueManager = queueManager;
    this.historyManager = historyManager;
    this.maxConcurrent = settings.get("concurrentDownloads") || 3;
  }

  private applyUrlRules(options: Partial<DownloadItem>): void {
    if (!options.url) return;
    const rules = this.settings.get("urlRules") || [];
    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...rules]
      .filter((r) => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (!rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(options.url)) {
          logger.info(`URL Rule matched: ${rule.name}`);
          if (rule.outputFormat) options.outputFormat = rule.outputFormat;
          if (rule.quality) options.quality = rule.quality;
          if (rule.audioQuality) options.audioQuality = rule.audioQuality;
          break; // Stop after first match (highest priority)
        }
      } catch (e) {
        logger.error(`Invalid regex in URL Rule ${rule.name}: ${e}`);
      }
    }
  }

  startDownload(options: Partial<DownloadItem>): DownloadItem {
    this.applyUrlRules(options);

    // Check concurrent download limit
    if (this.activeDownloads.size >= this.maxConcurrent) {
      // Add to queue instead
      const queuedItem: DownloadItem = {
        id: randomUUID(),
        url: options.url || "",
        title: options.title || "",
        thumbnail: options.thumbnail || "",
        channel: options.channel || "",
        duration: options.duration || 0,
        outputPath: options.outputPath || this.settings.get("downloadFolder"),
        outputFormat: options.outputFormat || this.settings.get("defaultFormat"),
        quality: options.quality || this.settings.get("defaultQuality"),
        audioQuality: options.audioQuality || this.settings.get("defaultAudioQuality"),
        status: "waiting",
        progress: 0,
        speed: 0,
        eta: 0,
        downloadedSize: 0,
        totalSize: 0,
        priority: options.priority || "normal",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlaylist: options.isPlaylist || false,
        playlistId: options.playlistId,
        retries: 0,
        maxRetries: options.maxRetries || 3,
        postAction: options.postAction,
      };
      this.queue.push(queuedItem);
      logger.info("Download queued (concurrent limit reached): " + queuedItem.id);
      return queuedItem;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const item: DownloadItem = {
      id,
      url: options.url || "",
      title: options.title || "",
      thumbnail: options.thumbnail || "",
      channel: options.channel || "",
      duration: options.duration || 0,
      outputPath: options.outputPath || this.settings.get("downloadFolder"),
      outputFormat: options.outputFormat || this.settings.get("defaultFormat"),
      quality: options.quality || this.settings.get("defaultQuality"),
      audioQuality: options.audioQuality || this.settings.get("defaultAudioQuality"),
      status: "downloading",
      progress: 0,
      speed: 0,
      eta: 0,
      downloadedSize: 0,
      totalSize: 0,
      priority: options.priority || "normal",
      createdAt: now,
      updatedAt: now,
      isPlaylist: options.isPlaylist || false,
      playlistId: options.playlistId,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      postAction: options.postAction,
    };

    let proc;
    let pid;

    if (!existsSync(item.outputPath)) {
      mkdirSync(item.outputPath, { recursive: true });
    }

    if (item.url.startsWith("magnet:?")) {
      const WebTorrent = require("webtorrent");
      const client = new WebTorrent();
      
      this.activeDownloads.set(id, { item, webtorrentClient: client });

      const torrent = client.add(item.url, { path: item.outputPath });
      
      torrent.on("download", () => {
        const progress = {
          progress: torrent.progress * 100,
          speed: torrent.downloadSpeed,
          eta: Math.round(torrent.timeRemaining / 1000),
          downloadedSize: torrent.downloaded,
          totalSize: torrent.length
        };
        item.progress = progress.progress;
        item.speed = progress.speed;
        item.eta = progress.eta;
        item.downloadedSize = progress.downloadedSize;
        item.totalSize = progress.totalSize;
        this.broadcastProgress(id, progress);
      });

      torrent.on("done", () => {
        this.activeDownloads.delete(id);
        this.processQueue();
        
        item.status = "completed";
        item.progress = 100;
        this.historyManager.addToHistory({
          id: randomUUID(),
          downloadId: id,
          title: torrent.name || item.title || "Torrent Download",
          url: item.url,
          thumbnail: item.thumbnail,
          channel: item.channel || "P2P",
          duration: item.duration,
          outputPath: item.outputPath,
          outputFormat: item.outputFormat,
          fileSize: item.downloadedSize || torrent.length,
          downloadedAt: new Date().toISOString(),
          type: "video",
        });
        this.broadcastCompleted(item);
        this.checkQueueCompletion();
        client.destroy();
      });

      torrent.on("error", (err: Error) => {
        item.status = "failed";
        item.error = err.message;
        this.activeDownloads.delete(id);
        this.processQueue();
        this.broadcastFailed(item);
        client.destroy();
      });

      logger.info("Torrent Download started: " + id);
      return item;
    } else {
      const args = this.buildArgs(item);
      proc = this.ytDlp.execute(args);
      pid = proc.pid;
      this.activeDownloads.set(id, { pid, process: proc, item });

      proc.stdout?.on("data", (data: Buffer) => {
        const lines = data.toString().split(/[\r\n]+/);
        for (const line of lines) {
          const progress = this.parseProgress(line);
          if (progress) {
            if (progress.progress !== undefined) item.progress = progress.progress;
            if (progress.speed !== undefined) item.speed = progress.speed;
            if (progress.eta !== undefined) item.eta = progress.eta;
            if (progress.downloadedSize !== undefined) item.downloadedSize = progress.downloadedSize;
            if (progress.totalSize !== undefined) item.totalSize = progress.totalSize;
            this.broadcastProgress(id, progress);
          }
        }
      });

      proc.on("close", (code: number | null) => {
        this.activeDownloads.delete(id);
        this.processQueue();

        if (code === 0) {
          item.status = "completed";
          item.progress = 100;
          this.historyManager.addToHistory({
            id: randomUUID(),
            downloadId: id,
            title: item.title,
            url: item.url,
            thumbnail: item.thumbnail,
            channel: item.channel,
            duration: item.duration,
            outputPath: item.outputPath,
            outputFormat: item.outputFormat,
            fileSize: item.downloadedSize,
            downloadedAt: new Date().toISOString(),
            type: "video",
          });
          this.broadcastCompleted(item);
        } else {
          item.status = "failed";
          item.error = "Exit code " + String(code);
          this.broadcastFailed(item);
        }
        this.checkQueueCompletion();
      });

      proc.on("error", (err: Error) => {
        item.status = "failed";
        item.error = err.message;
        this.activeDownloads.delete(id);
        this.processQueue();
        this.broadcastFailed(item);
      });

      logger.info("Download started: " + id);
      return item;
    }
  }

  private processQueue(): void {
    this.maxConcurrent = this.settings.get("concurrentDownloads") || 3;
    if (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
      const delayMs = (this.settings.get("downloadDelay") || 0) * 1000;
      const now = Date.now();
      const timeSinceLast = now - this.lastDownloadStartTime;
      const timeToWait = delayMs - timeSinceLast;

      if (timeToWait > 0) {
        if (!this.isWaiting) {
          this.isWaiting = true;
          setTimeout(() => {
            this.isWaiting = false;
            this.processQueue();
          }, timeToWait);
        }
        return;
      }

      this.lastDownloadStartTime = Date.now();
      const nextItem = this.queue.shift();
      if (nextItem) {
        // Start the queued download
        let proc;
        let pid;

        if (!existsSync(nextItem.outputPath)) {
          mkdirSync(nextItem.outputPath, { recursive: true });
        }

        if (nextItem.url.startsWith("magnet:?")) {
          const aria2cPath = this.settings.get("aria2c")?.path || "aria2c";
          const ariaArgs = [
            "--dir", nextItem.outputPath,
            "--seed-time=0", // Don't seed after download
            "--summary-interval=1",
            nextItem.url
          ];
          proc = require("child_process").spawn(aria2cPath, ariaArgs, { stdio: ["pipe", "pipe", "pipe"] });
          pid = proc.pid;
        } else {
          const args = this.buildArgs(nextItem);
          proc = this.ytDlp.execute(args);
          pid = proc.pid;
        }

        nextItem.status = "downloading";
        nextItem.createdAt = new Date().toISOString();
        nextItem.updatedAt = new Date().toISOString();

        this.activeDownloads.set(nextItem.id, { pid, process: proc, item: nextItem });

        proc.stdout?.on("data", (data: Buffer) => {
          const lines = data.toString().split(/[\r\n]+/);
          for (const line of lines) {
            let progress = null;
            if (nextItem.url.startsWith("magnet:?")) {
              // Parse aria2c output: [#22f08a 0B/0B CN:1 DL:0B] or [#22f08a 1.2MiB/3.4MiB(35%) CN:1 SD:1 DL:1.2MiB ETA:1s]
              const match = line.match(/\((\d+)%\)/);
              if (match) {
                progress = { progress: parseFloat(match[1]) };
              }
            } else {
              progress = this.parseProgress(line);
            }

            if (progress) {
              if (progress.progress !== undefined) nextItem.progress = progress.progress;
              if (progress.speed !== undefined) nextItem.speed = progress.speed;
              if (progress.eta !== undefined) nextItem.eta = progress.eta;
              if (progress.downloadedSize !== undefined) nextItem.downloadedSize = progress.downloadedSize;
              if (progress.totalSize !== undefined) nextItem.totalSize = progress.totalSize;
              this.broadcastProgress(nextItem.id, progress);
            }
          }
        });

        proc.on("close", (code: number | null) => {
          this.activeDownloads.delete(nextItem.id);
          this.processQueue();

          if (code === 0) {
            nextItem.status = "completed";
            nextItem.progress = 100;
            this.historyManager.addToHistory({
              id: randomUUID(),
              downloadId: nextItem.id,
              title: nextItem.title,
              url: nextItem.url,
              thumbnail: nextItem.thumbnail,
              channel: nextItem.channel,
              duration: nextItem.duration,
              outputPath: nextItem.outputPath,
              outputFormat: nextItem.outputFormat,
              fileSize: nextItem.downloadedSize,
              downloadedAt: new Date().toISOString(),
              type: "video",
            });
            this.broadcastCompleted(nextItem);
          } else {
            nextItem.status = "failed";
            nextItem.error = "Exit code " + String(code);
            this.broadcastFailed(nextItem);
          }
          this.checkQueueCompletion(nextItem.postAction);
        });

        proc.on("error", (err: Error) => {
          nextItem.status = "failed";
          nextItem.error = err.message;
          this.activeDownloads.delete(nextItem.id);
          this.processQueue();
          this.broadcastFailed(nextItem);
          this.checkQueueCompletion(nextItem.postAction);
        });

        logger.info("Queued download started: " + nextItem.id);
      }
    }
  }

  private checkQueueCompletion(postAction?: "none" | "shutdown" | "sleep" | "hibernate"): void {
    if (this.queue.length === 0 && this.activeDownloads.size === 0) {
      logger.info("All downloads completed.");
      const sleep = this.settings.get("sleepAfterComplete");
      const shutdown = this.settings.get("shutdownAfterComplete");
      
      const shouldShutdown = postAction === "shutdown" || shutdown;
      const shouldSleep = postAction === "sleep" || sleep;

      if (shouldShutdown) {
         logger.info("Triggering system shutdown (60s timer)...");
         require("child_process").exec("shutdown /s /t 60", (err: Error | null) => {
           if (err) logger.error("Failed to execute shutdown command", err);
         });
      } else if (shouldSleep) {
         logger.info("Triggering system sleep...");
         require("child_process").exec("rundll32.exe powrprof.dll,SetSuspendState 0,1,0", (err: Error | null) => {
           if (err) logger.error("Failed to execute sleep command", err);
         });
      }
    }
  }

  pauseDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      if (download.webtorrentClient) {
        download.webtorrentClient.torrents.forEach((t: any) => t.pause());
        download.item.status = "paused";
        logger.info("WebTorrent download paused: " + id);
      } else if (download.process && download.pid) {
        try {
          process.kill(download.pid, "SIGSTOP");
          download.item.status = "paused";
          logger.info("Download paused: " + id);
        } catch (err) {
          logger.error("Failed to pause download: " + id, err);
        }
      }
    }
  }

  resumeDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      if (download.webtorrentClient) {
        download.webtorrentClient.torrents.forEach((t: any) => t.resume());
        download.item.status = "downloading";
        logger.info("WebTorrent download resumed: " + id);
      } else if (download.process && download.pid) {
        try {
          process.kill(download.pid, "SIGCONT");
          download.item.status = "downloading";
          logger.info("Download resumed: " + id);
        } catch (err) {
          logger.error("Failed to resume download: " + id, err);
        }
      }
    }
  }

  cancelDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      if (download.webtorrentClient) {
        download.webtorrentClient.destroy();
        logger.info("WebTorrent download destroyed: " + id);
      } else if (download.process && download.pid) {
        try {
          process.kill(download.pid, "SIGTERM");
          setTimeout(() => {
            try {
              process.kill(download.pid!, "SIGKILL");
            } catch { /* ignore if already dead */ }
          }, 1000);
        } catch { /* ignore if already dead */ }
      }
      download.item.status = "cancelled";
      this.activeDownloads.delete(id);
      // Remove from queue if present
      this.queue = this.queue.filter(item => item.id !== id);
      // Process next in queue
      this.processQueue();
      logger.info("Download cancelled: " + id);
    }
  }

  removeFromQueue(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
    logger.info("Download removed from queue: " + id);
  }

  getQueuedDownloads(): DownloadItem[] {
    return [...this.queue];
  }

  retryDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      download.item.retries++;
      download.item.status = "downloading";
      download.item.error = undefined;
      this.startDownload(download.item);
    }
  }

  getDownloadProgress(id: string): DownloadProgress | null {
    const download = this.activeDownloads.get(id);
    if (!download) return null;
    return {
      downloadId: id,
      status: download.item.status,
      progress: download.item.progress,
      speed: download.item.speed,
      eta: download.item.eta,
      downloadedSize: download.item.downloadedSize,
      totalSize: download.item.totalSize,
    };
  }

  async stopAll(): Promise<void> {
    // Cancel all active downloads
    for (const [id] of this.activeDownloads) {
      this.cancelDownload(id);
    }
    // Clear the queue
    this.queue = [];
    logger.info("All downloads stopped");
  }

  getActiveDownloads(): DownloadItem[] {
    return Array.from(this.activeDownloads.values()).map((d) => d.item);
  }

  getAllDownloads(): DownloadItem[] {
    return [...Array.from(this.activeDownloads.values()).map((d) => d.item), ...this.queue];
  }

  getQueueCount(): number {
    return this.queue.length;
  }

  getActiveCount(): number {
    return this.activeDownloads.size;
  }

  private buildArgs(item: DownloadItem): string[] {
    const args = [
      "--no-warnings",
      "--no-check-certificates",
      "--encoding", "utf-8",
      "--newline",
      "--progress",
      "--no-continue", // Start fresh each time
    ];

    // Apply format selection
    const format = item.outputFormat?.toLowerCase() || "mp4";
    const quality = item.quality || "best";

    // Build format selector based on quality preference
    if (quality === "best") {
      args.push("-f", "bestvideo+bestaudio/best");
    } else if (quality === "worst") {
      args.push("-f", "worstvideo+worstaudio/worst");
    } else {
      // Specific quality (e.g., 1080p, 720p)
      args.push("-f", `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`);
    }

    // Apply output format for merging
    if (format === "mp3" || format === "aac" || format === "flac" || format === "ogg" || format === "wav" || format === "m4a" || format === "opus") {
      // Audio-only extraction
      args.push("-x", "--audio-format", format);
    } else if (format === "mp4" || format === "mkv" || format === "webm" || format === "avi" || format === "mov" || format === "flv") {
      // Video format - use specific container
      args.push("--merge-output-format", format === "webm" ? "webm" : "mp4");
    }

    const proxy = this.settings.get("proxy") as { type: string; host: string; port: number };
    if (proxy && proxy.type && proxy.type !== "none" && proxy.host) {
      args.push("--proxy", `${proxy.type}://${proxy.host}:${proxy.port}`);
    }

    const ua = this.settings.get("customUserAgent");
    if (ua) args.push("--user-agent", ua);

    const referer = this.settings.get("referer");
    if (referer) args.push("--referer", referer);

    // Provide FFmpeg location so yt-dlp can merge video+audio
    const ffmpegPath = this.ffmpeg.getFfmpegPath();
    if (ffmpegPath) {
      args.push("--ffmpeg-location", ffmpegPath);
    }

    // Phase 5: SponsorBlock Integration
    const sponsorBlockEnabled = this.settings.get("sponsorBlockEnabled");
    if (sponsorBlockEnabled) {
      const categories = this.settings.get("sponsorBlockCategories") as string[];
      if (categories && categories.length > 0) {
        args.push("--sponsorblock-remove", categories.join(","));
      }
    }

    // 1. Time-Range Trimming (Clip Downloader)
    if (item.startTime && item.endTime) {
      // yt-dlp uses regex for download sections: *start-end
      args.push("--download-sections", `*${item.startTime}-${item.endTime}`);
    }

    // 5. Advanced Subtitle Options (Embed)
    // We check the active profile for subtitle preferences, assuming settings-manager holds them or we check global toggle
    const embedSubs = this.settings.get("embedMetadata"); // We can use this as a proxy for now or check profile
    if (embedSubs) {
      args.push("--write-subs", "--embed-subs");
    }

    // 8. Network Speed Limiter
    const maxSpeed = this.settings.get("maxSpeed");
    if (maxSpeed && maxSpeed > 0) {
      args.push("--limit-rate", `${maxSpeed}K`); // assuming maxSpeed is in KB/s
    }

    // 9. Automatic Thumbnail & Cover Art Embedding
    const embedThumb = this.settings.get("embedThumbnail");
    if (embedThumb) {
      args.push("--embed-thumbnail");
    }

    // 7. Audio Volume Normalization
    if (item.normalizeAudio) {
      args.push("--postprocessor-args", "-af loudnorm=I=-16:TP=-1.5:LRA=11");
    }

    // 13. Audio Metadata Tag Editor
    if (item.metadata) {
      args.push("--parse-metadata", "NA:%(title)s");
      if (item.metadata.title) args.push("--replace-in-metadata", "title", ".*", item.metadata.title);
      if (item.metadata.artist) args.push("--replace-in-metadata", "artist", ".*", item.metadata.artist);
      if (item.metadata.album) args.push("--replace-in-metadata", "album", ".*", item.metadata.album);
      if (item.metadata.year) args.push("--replace-in-metadata", "date", ".*", item.metadata.year);
    }

    // Phase 3: YouTube Authenticator (Cookies)
    const browserCookies = this.settings.get("useBrowserCookies");
    if (browserCookies && browserCookies !== "none") {
      args.push("--cookies-from-browser", browserCookies);
    }

    // Phase 3: Aria2c Multi-Threaded Acceleration
    const useAria2c = this.settings.get("useAria2c");
    if (useAria2c) {
      args.push("--downloader", "aria2c", "--downloader-args", "aria2c:-x 16 -s 16");
    }

    // 6. Per-Download Custom Filename
    let rawTemplate = item.customFilename || this.settings.get("filenameTemplate") || "{title}";
    const outputTemplate = this.convertTemplateToYtDlp(rawTemplate);
    args.push("-o", join(item.outputPath, outputTemplate));

    args.push(item.url);
    return args;
  }

  private convertTemplateToYtDlp(tmpl: string): string {
    let converted = (tmpl || "{title}").trim();
    // Strip out {ext} first so it doesn't leave trailing dots behind later
    converted = converted.replace(/\.?\{ext\}/gi, "");
    
    // Convert friendly placeholders to yt-dlp syntax
    converted = converted
      .replace(/\{title\}/gi, "%(title)s")
      .replace(/\{quality\}/gi, "%(height)s")
      .replace(/\{height\}/gi, "%(height)s")
      .replace(/\{id\}/gi, "%(id)s")
      .replace(/\{channel\}/gi, "%(uploader)s")
      .replace(/\{uploader\}/gi, "%(uploader)s")
      .replace(/\[\s*%\(format_id\)s\s*\]/gi, "")
      .replace(/%\(format_id\)s/gi, "");

    // Strip trailing .%(ext)s or .ext if present
    converted = converted.replace(/\.%\(ext\)s$/i, "").replace(/\.ext$/i, "").trim();

    // Clean up empty brackets
    converted = converted.replace(/\[\s*\]/g, "").replace(/\(\s*\)/g, "").trim();
    
    // Clean up trailing dots, spaces, dashes
    converted = converted.replace(/[\.\-\s]+$/, "").trim();

    if (!converted) converted = "%(title)s";

    return `${converted}.%(ext)s`;
  }

  private parseProgress(line: string): Partial<DownloadProgress> | null {
    const trimmed = line.trim();
    if (!trimmed.includes("%")) return null;

    const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/);
    if (!percentMatch) return null;

    const result: Partial<DownloadProgress> = {
      progress: parseFloat(percentMatch[1]),
    };

    // Size match: e.g. "12.34MiB of ~50.00MiB" or "12.34MiB of 50.00MiB"
    const dualSizeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*([KMGTP]?i?B)\s+of\s+~?(\d+(?:\.\d+)?)\s*([KMGTP]?i?B)/i);
    if (dualSizeMatch) {
      result.downloadedSize = parseBytes(dualSizeMatch[1], dualSizeMatch[2]);
      result.totalSize = parseBytes(dualSizeMatch[3], dualSizeMatch[4]);
    } else {
      const totalOnlyMatch = trimmed.match(/of\s+~?(\d+(?:\.\d+)?)\s*([KMGTP]?i?B)/i);
      if (totalOnlyMatch) {
        result.totalSize = parseBytes(totalOnlyMatch[1], totalOnlyMatch[2]);
        result.downloadedSize = Math.round(((result.progress || 0) / 100) * result.totalSize);
      }
    }

    // Speed match: e.g. "at 1.25MiB/s" or "at 500.00KiB/s" or "at 100B/s"
    const speedMatch = trimmed.match(/at\s+(\d+(?:\.\d+)?)\s*([KMGTP]?i?B\/s)/i);
    if (speedMatch) {
      result.speed = parseBytes(speedMatch[1], speedMatch[2].replace(/\/s$/i, ""));
    }

    // ETA match: e.g. "ETA 01:32" or "ETA 00:05:30"
    const etaMatch = trimmed.match(/ETA\s+(\d{1,2}:\d{2}(?::\d{2})?)/i);
    if (etaMatch) {
      result.eta = parseEta(etaMatch[1]);
    }

    return result;
  }

  private broadcastProgress(id: string, progress: Partial<DownloadProgress>): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("download-progress", { downloadId: id, ...progress });
    }
  }

  private broadcastCompleted(item: DownloadItem): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("download-completed", item);
    }
  }

  private broadcastFailed(item: DownloadItem): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("download-failed", item);
    }
  }
}
