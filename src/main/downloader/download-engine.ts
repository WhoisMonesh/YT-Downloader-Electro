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

const logger = new Logger("download-engine");

export class DownloadEngine {
  private ytDlp: YtDlpManager;
  private ffmpeg: FFmpegManager;
  private settings: SettingsManager;
  private queueManager: QueueManager;
  private historyManager: HistoryManager;
  private activeDownloads: Map<string, { pid?: number; item: DownloadItem }> = new Map();

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
  }

  startDownload(options: Partial<DownloadItem>): DownloadItem {
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

    this.activeDownloads.set(id, { item });

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
      this.activeDownloads.delete(id);
    });

    proc.on("error", (err) => {
      item.status = "failed";
      item.error = err.message;
      this.activeDownloads.delete(id);
      this.broadcastFailed(item);
    });

    logger.info("Download started: " + id);
    return item;
  }

  pauseDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      download.item.status = "paused";
      logger.info("Download paused: " + id);
    }
  }

  resumeDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      download.item.status = "downloading";
      logger.info("Download resumed: " + id);
    }
  }

  cancelDownload(id: string): void {
    const download = this.activeDownloads.get(id);
    if (download) {
      download.item.status = "cancelled";
      this.activeDownloads.delete(id);
      logger.info("Download cancelled: " + id);
    }
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
    for (const [id] of this.activeDownloads) {
      this.cancelDownload(id);
    }
    logger.info("All downloads stopped");
  }

  getActiveDownloads(): DownloadItem[] {
    return Array.from(this.activeDownloads.values()).map((d) => d.item);
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
