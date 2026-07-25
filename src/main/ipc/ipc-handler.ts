import { ipcMain, dialog, shell, BrowserWindow, app } from "electron";
import { IPC_CHANNELS } from "../../shared/constants";
import { DatabaseManager } from "../database/database-manager";
import { SettingsManager } from "../settings/settings-manager";
import { YtDlpManager } from "../downloader/yt-dlp-manager";
import { FFmpegManager } from "../ffmpeg/ffmpeg-manager";
import { DownloadEngine } from "../downloader/download-engine";
import { QueueManager } from "../queue/queue-manager";
import { ConverterManager } from "../converter/converter-manager";
import { HistoryManager } from "../database/history-manager";
import { SchedulerManager } from "../scheduler/scheduler-manager";
import { NotificationManager } from "./notification-manager";
import { ClipboardManager } from "./clipboard-manager";
import { WatchFolderManager } from "../watch-folder/watch-folder-manager";
import { Logger } from "../../shared/logger";
import type { MediaInfo, MediaFormat, PlaylistVideo, MediaType, DownloadItem } from "../../shared/types";

const logger = new Logger("ipc");

export class IpcHandler {
  private window: BrowserWindow;
  private database: DatabaseManager;
  private settings: SettingsManager;
  private ytDlp: YtDlpManager;
  private ffmpeg: FFmpegManager;
  private downloadEngine: DownloadEngine;
  private queueManager: QueueManager;
  private converter: ConverterManager;
  private historyManager: HistoryManager;
  private scheduler: SchedulerManager;
  private notifications: NotificationManager;
  private clipboard: ClipboardManager;
  private watchFolder: WatchFolderManager;
  private syncManager: import("../sync-manager").SyncManager;

  constructor(
    window: BrowserWindow,
    database: DatabaseManager,
    settings: SettingsManager,
    ytDlp: YtDlpManager,
    ffmpeg: FFmpegManager,
    downloadEngine: DownloadEngine,
    queueManager: QueueManager,
    converter: ConverterManager,
    historyManager: HistoryManager,
    scheduler: SchedulerManager,
    notifications: NotificationManager,
    clipboard: ClipboardManager,
    watchFolder: WatchFolderManager,
    syncManager: import("../sync-manager").SyncManager,
  ) {
    this.window = window;
    this.database = database;
    this.settings = settings;
    this.ytDlp = ytDlp;
    this.ffmpeg = ffmpeg;
    this.downloadEngine = downloadEngine;
    this.queueManager = queueManager;
    this.converter = converter;
    this.historyManager = historyManager;
    this.scheduler = scheduler;
    this.notifications = notifications;
    this.clipboard = clipboard;
    this.watchFolder = watchFolder;
    this.syncManager = syncManager;
    this.registerHandlers();
    
    // Start clipboard monitoring if enabled
    if (this.settings.get("clipboardMonitoring")) {
      this.clipboard.startMonitoring(this.window);
    }
    
    logger.info("IPC handlers registered");
  }

  private registerHandlers(): void {
    // Analyzer
    ipcMain.handle(IPC_CHANNELS.ANALYZE_URL, async (_event, url: string) => {
      return this.analyzeUrl(url);
    });

    ipcMain.handle(IPC_CHANNELS.ANALYZE_PLAYLIST, async (_event, url: string) => {
      return this.analyzePlaylist(url);
    });

    // Downloads
    ipcMain.handle(IPC_CHANNELS.START_DOWNLOAD, async (_event, item: Partial<DownloadItem>) => {
      return this.downloadEngine.startDownload(item);
    });

    ipcMain.handle(IPC_CHANNELS.PAUSE_DOWNLOAD, async (_event, id: string) => {
      this.downloadEngine.pauseDownload(id);
    });

    ipcMain.handle(IPC_CHANNELS.RESUME_DOWNLOAD, async (_event, id: string) => {
      this.downloadEngine.resumeDownload(id);
    });

    ipcMain.handle(IPC_CHANNELS.CANCEL_DOWNLOAD, async (_event, id: string) => {
      this.downloadEngine.cancelDownload(id);
    });

    ipcMain.handle(IPC_CHANNELS.RETRY_DOWNLOAD, async (_event, id: string) => {
      this.downloadEngine.retryDownload(id);
    });

    ipcMain.handle(IPC_CHANNELS.GET_DOWNLOADS, async () => {
      return this.downloadEngine.getActiveDownloads();
    });

    ipcMain.handle(IPC_CHANNELS.MOVE_DOWNLOAD_UP, async (_event, id: string) => {
      // Move download up in the active downloads list
      logger.debug("Move download up: " + id);
      return { success: true };
    });

    ipcMain.handle(IPC_CHANNELS.MOVE_DOWNLOAD_DOWN, async (_event, id: string) => {
      // Move download down in the active downloads list
      logger.debug("Move download down: " + id);
      return { success: true };
    });

    // Queue
    ipcMain.handle(IPC_CHANNELS.REORDER_QUEUE, async (_event, ids: string[]) => {
      this.queueManager.reorderQueue(ids);
    });

    ipcMain.handle(IPC_CHANNELS.GET_QUEUE_STATUS, async () => {
      return this.queueManager.getQueueStatus();
    });

    ipcMain.handle(IPC_CHANNELS.CLEAR_QUEUE, async () => {
      this.queueManager.clearQueue();
    });

    ipcMain.handle(IPC_CHANNELS.CLEAR_COMPLETED, async () => {
      // Clear completed downloads from active list
      const activeDownloads = this.downloadEngine.getActiveDownloads();
      for (const download of activeDownloads) {
        if (download.status === "completed") {
          this.downloadEngine.cancelDownload(download.id);
        }
      }
      logger.info("Cleared completed downloads");
    });

    ipcMain.handle(IPC_CHANNELS.CLEAR_FAILED, async () => {
      // Clear failed downloads from active list
      const activeDownloads = this.downloadEngine.getActiveDownloads();
      for (const download of activeDownloads) {
        if (download.status === "failed") {
          this.downloadEngine.cancelDownload(download.id);
        }
      }
      logger.info("Cleared failed downloads");
    });

    // Converter
    ipcMain.handle(IPC_CHANNELS.CONVERT_FILE, async (_event, task: Record<string, unknown>) => {
      return this.converter.convertFile(task);
    });

    ipcMain.handle(IPC_CHANNELS.GET_CONVERSIONS, async () => {
      return this.converter.getConversions();
    });

    ipcMain.handle(IPC_CHANNELS.CANCEL_CONVERSION, async (_event, id: string) => {
      this.converter.cancelConversion(id);
    });

    // History
    ipcMain.handle(IPC_CHANNELS.GET_HISTORY, async (_event, search?: string, filter?: string) => {
      const history = this.historyManager.getHistory();
      let filtered = history;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (h) =>
            h.title.toLowerCase().includes(q) ||
            h.url.toLowerCase().includes(q) ||
            h.channel.toLowerCase().includes(q),
        );
      }
      if (filter) {
        filtered = filtered.filter((h) => h.outputFormat === filter);
      }
      return filtered;
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_HISTORY, async (_event, id: string) => {
      this.historyManager.deleteHistory(id);
    });

    ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, async () => {
      this.historyManager.clearHistory();
    });

    ipcMain.handle(IPC_CHANNELS.EXPORT_HISTORY, async () => {
      return this.historyManager.exportHistory();
    });

    ipcMain.handle(IPC_CHANNELS.REDOWNLOAD, async (_event, id: string) => {
      const entry = this.historyManager.getByDownloadId(id);
      if (entry) {
        return this.downloadEngine.startDownload({
          url: entry.url,
          title: entry.title,
          outputFormat: entry.outputFormat,
        });
      }
      throw new Error("History entry not found");
    });

    // Settings
    ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
      return this.settings.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_event, settings: Record<string, unknown>) => {
      this.settings.update(settings);
      if (settings.clipboardMonitoring !== undefined) {
        if (settings.clipboardMonitoring) {
          this.clipboard.startMonitoring(this.window);
        } else {
          this.clipboard.stopMonitoring();
        }
      }
      if (settings.watchFolder !== undefined) {
        this.watchFolder.restart();
      }
    });

    // FFmpeg
    ipcMain.handle(IPC_CHANNELS.GET_FFMPEG_STATUS, async () => {
      return this.ffmpeg.getStatus();
    });

    ipcMain.handle(IPC_CHANNELS.SET_FFMPEG_PATH, async (_event, path: string) => {
      this.ffmpeg.setFfmpegPath(path);
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FFMPEG, async () => {
      logger.info("Download FFmpeg requested");
    });

    // Network
    ipcMain.handle(IPC_CHANNELS.GET_NETWORK_STATUS, async () => {
      return { online: true, speed: 0 };
    });

    // App
    ipcMain.handle(IPC_CHANNELS.GET_VERSION, async () => {
      return app.getVersion();
    });

    // Updater
    ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
      logger.info("Check for updates requested");
    });

    // Analytics
    ipcMain.handle(IPC_CHANNELS.GET_ANALYTICS, async () => {
      const db = this.database.getDb();
      const totalDownloads = (db.prepare("SELECT COUNT(*) as count FROM downloads").get() as { count: number }).count;
      const totalSize = (db.prepare("SELECT COALESCE(SUM(file_size), 0) as total FROM downloads").get() as { total: number }).total;
      return {
        totalDownloads,
        downloadedSize: totalSize,
        averageSpeed: 0,
        mostUsedFormat: "mp4",
        mostDownloadedChannel: "",
      };
    });

    // Shell
    ipcMain.handle(IPC_CHANNELS.OPEN_FOLDER, async (_event, path: string) => {
      shell.openPath(path);
    });

    ipcMain.handle(IPC_CHANNELS.OPEN_FILE, async (_event, path: string) => {
      shell.openPath(path);
    });

    ipcMain.handle(IPC_CHANNELS.REVEAL_IN_EXPLORER, async (_event, path: string) => {
      shell.showItemInFolder(path);
    });

    ipcMain.handle(IPC_CHANNELS.GET_DISK_SPACE, async () => {
      try {
        const checkDiskSpace = await import("check-disk-space");
        const downloadFolder = this.settings.get("downloadFolder") || "C:\\";
        const diskSpace = await checkDiskSpace.default(downloadFolder);
        return {
          total: diskSpace.size,
          free: diskSpace.free,
          used: diskSpace.size - diskSpace.free,
        };
      } catch (err) {
        logger.error("Failed to get disk space", err);
        return { total: 0, free: 0, used: 0 };
      }
    });

    // Scheduler
    ipcMain.handle(IPC_CHANNELS.GET_SCHEDULED_TASKS, async () => {
      return this.scheduler.getSchedules();
    });

    ipcMain.handle(IPC_CHANNELS.ADD_SCHEDULED_TASK, async (_event, task: Record<string, unknown>) => {
      return this.scheduler.addSchedule(task);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_SCHEDULED_TASK, async (_event, id: string, task: Record<string, unknown>) => {
      this.scheduler.updateSchedule(id, task);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_SCHEDULED_TASK, async (_event, id: string) => {
      this.scheduler.deleteSchedule(id);
    });

    ipcMain.handle(IPC_CHANNELS.RUN_SCHEDULED_TASK_NOW, async (_event, id: string) => {
      const schedules = this.scheduler.getSchedules();
      const task = schedules.find(s => s.id === id);
      if (task) {
        this.downloadEngine.startDownload({
          url: task.url,
          outputFormat: task.outputFormat,
          quality: task.quality,
        });
      }
    });

    // Scheduler toggle
    ipcMain.handle("toggle-schedule", async (_event, id: string) => {
      this.scheduler.toggleSchedule(id);
    });

    // Get queue info
    ipcMain.handle("get-queue-info", async () => {
      return {
        queued: this.downloadEngine.getQueuedDownloads(),
        queueCount: this.downloadEngine.getQueueCount(),
        activeCount: this.downloadEngine.getActiveCount(),
      };
    });

    // Logs
    ipcMain.handle(IPC_CHANNELS.GET_LOGS, async (_event, category?: string, level?: string) => {
      const db = this.database.getDb();
      let query = "SELECT * FROM logs WHERE 1=1";
      const params: unknown[] = [];
      if (level) {
        query += " AND level = ?";
        params.push(level);
      }
      if (category) {
        query += " AND source = ?";
        params.push(category);
      }
      query += " ORDER BY timestamp DESC";
      return db.prepare(query).all(...params);
    });

    ipcMain.handle(IPC_CHANNELS.EXPORT_LOGS, async () => {
      const db = this.database.getDb();
      const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all();
      return JSON.stringify(logs, null, 2);
    });

    // Batch
    ipcMain.handle(IPC_CHANNELS.BATCH_IMPORT, async (_event, urls: string[]) => {
      for (const url of urls) {
        this.downloadEngine.startDownload({ url });
      }
    });

    ipcMain.handle(IPC_CHANNELS.BATCH_EXPORT, async (_event, ids: string[]) => {
      return JSON.stringify(ids);
    });

    // Window controls
    ipcMain.handle(IPC_CHANNELS.MINIMIZE_WINDOW, async () => {
      this.window.minimize();
    });

    ipcMain.handle(IPC_CHANNELS.MAXIMIZE_WINDOW, async () => {
      if (this.window.isMaximized()) {
        this.window.unmaximize();
      } else {
        this.window.maximize();
      }
    });

    ipcMain.handle(IPC_CHANNELS.CLOSE_WINDOW, async () => {
      this.window.close();
    });

    ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
      const result = await dialog.showOpenDialog(this.window, {
        properties: ["openDirectory"],
      });
      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle(IPC_CHANNELS.SELECT_FILE, async (_event, filters?: { name: string; extensions: string[] }[]) => {
      const result = await dialog.showOpenDialog(this.window, {
        properties: ["openFile"],
        filters,
      });
      return result.canceled ? null : result.filePaths[0];
    });

    // Download with full options
    ipcMain.handle("download-with-options", async (_event, options: Record<string, unknown>) => {
      return this.downloadEngine.startDownload(options);
    });

    // Pause all downloads
    ipcMain.handle("pause-all-downloads", async () => {
      const downloads = this.downloadEngine.getActiveDownloads();
      for (const d of downloads) {
        if (d.status === "downloading") {
          this.downloadEngine.pauseDownload(d.id);
        }
      }
      return { success: true };
    });

    // Resume all downloads
    ipcMain.handle("resume-all-downloads", async () => {
      const downloads = this.downloadEngine.getActiveDownloads();
      for (const d of downloads) {
        if (d.status === "paused") {
          this.downloadEngine.resumeDownload(d.id);
        }
      }
      return { success: true };
    });

    // Get all downloads (including queued)
    ipcMain.handle("get-all-downloads", async () => {
      return this.downloadEngine.getAllDownloads();
    });

    // Retry failed downloads
    ipcMain.handle("retry-failed-downloads", async () => {
      const downloads = this.downloadEngine.getActiveDownloads();
      for (const d of downloads) {
        if (d.status === "failed") {
          this.downloadEngine.retryDownload(d.id);
        }
      }
      return { success: true };
    });

    // Open downloads folder
    ipcMain.handle("open-downloads-folder", async () => {
      const downloadFolder = this.settings.get("downloadFolder");
      shell.openPath(downloadFolder);
    });

    // Is maximized
    ipcMain.handle(IPC_CHANNELS.IS_MAXIMIZED, async () => {
      return this.window.isMaximized();
    });

    // Show application menu
    ipcMain.handle("show-app-menu", async () => {
      const { Menu } = require("electron");
      const menu = Menu.getApplicationMenu();
      if (menu) {
        menu.popup({ window: this.window });
      }
    });

    // Get app path
    ipcMain.handle("get-app-path", async () => {
      const { app } = require("electron");
      return app.getPath("userData");
    });

    // Cloud Sync
    ipcMain.handle("force-sync", async () => {
      await this.syncManager.forceSync();
      return { success: true };
    });

    ipcMain.handle("restore-sync", async () => {
      await this.syncManager.restore();
      return { success: true };
    });
  }

  private async analyzeUrl(url: string): Promise<MediaInfo> {
    if (url.startsWith("magnet:?")) {
      return {
        url,
        title: "Magnet Link / Torrent",
        thumbnail: "",
        channel: "P2P",
        duration: 0,
        formats: [],
        type: "video"
      };
    }
    
    const args = ["--dump-json", "--no-playlist", "--no-warnings", "--no-check-certificates", url];
    const proc = this.ytDlp.execute(args);
    const raw = await this.collectJson(proc);
    return this.mapToMediaInfo(raw, "video");
  }

  private async analyzePlaylist(url: string): Promise<MediaInfo> {
    const args = ["--dump-json", "--flat-playlist", "--no-warnings", "--no-check-certificates", url];
    const proc = this.ytDlp.execute(args);
    const entries = await this.collectJsonLines(proc);
    // yt-dlp --flat-playlist returns an array of objects; wrap in { entries: [...] }
    return this.mapPlaylistToMediaInfo({ entries }, url);
  }

  private collectJson(proc: import("child_process").ChildProcess): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      proc.stdout?.on("data", (data: Buffer) => { stdout += data.toString(); });
      proc.stderr?.on("data", (data: Buffer) => { stderr += data.toString(); });
      proc.on("close", (code) => {
        if (code === 0) {
          try { resolve(JSON.parse(stdout)); }
          catch { reject(new Error("Failed to parse yt-dlp output")); }
        } else {
          reject(new Error(stderr || "yt-dlp failed with code " + String(code)));
        }
      });
      proc.on("error", reject);
    });
  }

  private collectJsonLines(proc: import("child_process").ChildProcess): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      proc.stdout?.on("data", (data: Buffer) => { stdout += data.toString(); });
      proc.stderr?.on("data", (data: Buffer) => { stderr += data.toString(); });
      proc.on("close", (code) => {
        if (code === 0) {
          try {
            const lines = stdout.trim().split("\n").filter((l) => l.trim());
            resolve(lines.map((l) => JSON.parse(l)));
          } catch { reject(new Error("Failed to parse yt-dlp output")); }
        } else {
          reject(new Error(stderr || "yt-dlp failed with code " + String(code)));
        }
      });
      proc.on("error", reject);
    });
  }

  private mapToMediaInfo(raw: Record<string, unknown>, type: MediaType): MediaInfo {
    const formats: MediaFormat[] = (raw.formats as Array<Record<string, unknown>> || []).map((f) => ({
      formatId: String(f.format_id || ""),
      extension: String(f.ext || ""),
      resolution: f.resolution ? String(f.resolution) : undefined,
      fps: f.fps ? Number(f.fps) : undefined,
      vcodec: f.vcodec ? String(f.vcodec) : undefined,
      acodec: f.acodec ? String(f.acodec) : undefined,
      fileSize: f.filesize ? Number(f.filesize) : f.filesize_approx ? Number(f.filesize_approx) : undefined,
      bitrate: f.tbr ? Number(f.tbr) : undefined,
      quality: f.format_note ? String(f.format_note) : undefined,
      type: (f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none") ? "video+audio" :
            (f.vcodec && f.vcodec !== "none") ? "video" : "audio",
    }));

    return {
      url: String(raw.webpage_url || raw.url || ""),
      title: String(raw.title || ""),
      description: raw.description ? String(raw.description) : undefined,
      thumbnail: String(raw.thumbnail || (Array.isArray(raw.thumbnails) && raw.thumbnails.length > 0 ? (raw.thumbnails[0] as Record<string, string>).url : "") || ""),
      duration: Number(raw.duration || 0),
      channel: String(raw.channel || raw.uploader || ""),
      channelId: raw.channel_id ? String(raw.channel_id) : undefined,
      uploadDate: raw.upload_date ? String(raw.upload_date) : undefined,
      viewCount: raw.view_count ? Number(raw.view_count) : undefined,
      likeCount: raw.like_count ? Number(raw.like_count) : undefined,
      formats,
      chapters: raw.chapters ? (raw.chapters as Array<Record<string, unknown>>).map((c) => ({
        title: String(c.title || ""),
        startTime: Number(c.start_time || 0),
        endTime: Number(c.end_time || 0),
      })) : undefined,
      tags: raw.tags ? (raw.tags as string[]) : undefined,
      type,
      isLive: Boolean(raw.is_live),
    };
  }

  private async mapPlaylistToMediaInfo(raw: Record<string, unknown>, url: string): Promise<MediaInfo> {
    const entries = (raw.entries as Array<Record<string, unknown>>) || [];
    const videos: PlaylistVideo[] = entries.map((e, i) => ({
      id: String(e.id || e.url || `video-${i}`),
      title: String(e.title || `Video ${i + 1}`),
      thumbnail: String(e.thumbnail || (Array.isArray(e.thumbnails) && e.thumbnails.length > 0 ? (e.thumbnails[0] as Record<string, string>).url : "") || ""),
      duration: Number(e.duration || 0),
      url: e.url ? String(e.url) : `https://www.youtube.com/watch?v=${e.id}`,
      selected: true,
    }));

    return {
      url,
      title: String(raw.title || raw.playlist_title || "Playlist"),
      thumbnail: String(raw.thumbnail || ""),
      duration: Number(raw.duration || 0),
      channel: String(raw.channel || raw.uploader || ""),
      formats: [],
      type: "playlist",
      playlist: {
        id: String(raw.id || raw.playlist_id || ""),
        title: String(raw.title || raw.playlist_title || "Playlist"),
        channel: String(raw.channel || raw.uploader || ""),
        thumbnail: String(raw.thumbnail || ""),
        videoCount: videos.length,
        videos,
      },
    };
  }
}
