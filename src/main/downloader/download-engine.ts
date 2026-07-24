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
      const lines = data.toString().split("\n");
      for (const line of lines) {
        const progress = this.parseProgress(line);
        if (progress) {
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
          const lines = data.toString().split("\n");
          for (const line of lines) {
            const progress = this.parseProgress(line);
            if (progress) {
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
    ];

    const proxy = this.settings.get("proxy");
    if (proxy.type !== "none" && proxy.host) {
      args.push("--proxy", `${proxy.type}://${proxy.host}:${proxy.port}`);
    }

    const ua = this.settings.get("customUserAgent");
    if (ua) args.push("--user-agent", ua);

    const referer = this.settings.get("referer");
    if (referer) args.push("--referer", referer);

    args.push("-o", join(item.outputPath, "%(title)s [%(format_id)s].%(ext)s"));
    args.push(item.url);
    return args;
  }

  private parseProgress(line: string): Partial<DownloadProgress> | null {
    const match = line.match(/(\d+\.?\d*)%/);
    if (!match) return null;
    return { progress: parseFloat(match[1]) };
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
