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
  private activeDownloads: Map<string, { pid?: number; process?: ChildProcess; item: DownloadItem }> = new Map();
  private maxConcurrent: number = 3;
  private queue: DownloadItem[] = [];

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

  startDownload(options: Partial<DownloadItem>): DownloadItem {
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
    };

    const args = this.buildArgs(item);
    if (!existsSync(item.outputPath)) {
      mkdirSync(item.outputPath, { recursive: true });
    }
    const proc = this.ytDlp.execute(args);
    const pid = proc.pid;

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

    proc.on("close", (code) => {
      this.activeDownloads.delete(id);
      // Process next in queue
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
    });

    proc.on("error", (err) => {
      item.status = "failed";
      item.error = err.message;
      this.activeDownloads.delete(id);
      // Process next in queue
      this.processQueue();
      this.broadcastFailed(item);
    });

    logger.info("Download started: " + id);
    return item;
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
      const nextItem = this.queue.shift();
      if (nextItem) {
        // Start the queued download
        const args = this.buildArgs(nextItem);
        if (!existsSync(nextItem.outputPath)) {
          mkdirSync(nextItem.outputPath, { recursive: true });
        }
        const proc = this.ytDlp.execute(args);
        const pid = proc.pid;

        nextItem.status = "downloading";
        nextItem.createdAt = new Date().toISOString();
        nextItem.updatedAt = new Date().toISOString();

        this.activeDownloads.set(nextItem.id, { pid, process: proc, item: nextItem });

        proc.stdout?.on("data", (data: Buffer) => {
          const lines = data.toString().split(/[\r\n]+/);
          for (const line of lines) {
            const progress = this.parseProgress(line);
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

        proc.on("close", (code) => {
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
        });

        proc.on("error", (err) => {
          nextItem.status = "failed";
          nextItem.error = err.message;
          this.activeDownloads.delete(nextItem.id);
          this.processQueue();
          this.broadcastFailed(nextItem);
        });

        logger.info("Queued download started: " + nextItem.id);
      }
    }
  }

  pauseDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download && download.process && download.pid) {
      try {
        process.kill(download.pid, "SIGSTOP");
        download.item.status = "paused";
        logger.info("Download paused: " + id);
      } catch (err) {
        logger.error("Failed to pause download: " + id, err);
      }
    }
  }

  resumeDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download && download.process && download.pid) {
      try {
        process.kill(download.pid, "SIGCONT");
        download.item.status = "downloading";
        logger.info("Download resumed: " + id);
      } catch (err) {
        logger.error("Failed to resume download: " + id, err);
      }
    }
  }

  cancelDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      // Kill the process if still running
      if (download.process && download.pid) {
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
