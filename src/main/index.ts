import { app, BrowserWindow, session, Menu } from "electron";
import { join } from "path";
import log from "loglevel";
import { WindowManager } from "./window-manager";
import { DatabaseManager } from "./database/database-manager";
import { SettingsManager } from "./settings/settings-manager";
import { YtDlpManager } from "./downloader/yt-dlp-manager";
import { FFmpegManager } from "./ffmpeg/ffmpeg-manager";
import { DownloadEngine } from "./downloader/download-engine";
import { QueueManager } from "./queue/queue-manager";
import { ConverterManager } from "./converter/converter-manager";
import { SchedulerManager } from "./scheduler/scheduler-manager";
import { UpdaterManager } from "./updater/updater-manager";
import { IpcHandler } from "./ipc/ipc-handler";
import { HistoryManager } from "./database/history-manager";
import { NotificationManager } from "./ipc/notification-manager";
import { ClipboardManager } from "./ipc/clipboard-manager";
import { Logger } from "../shared/logger";

const logger = new Logger("main");

// Hide default Electron menu completely
function setupMenu(): void {
  // Set menu to null to completely hide the menu bar
  Menu.setApplicationMenu(null);
}
let windowManager: WindowManager;
let database: DatabaseManager;
let settings: SettingsManager;
let ytDlp: YtDlpManager;
let ffmpeg: FFmpegManager;
let downloadEngine: DownloadEngine;
let queueManager: QueueManager;
let converter: ConverterManager;
let scheduler: SchedulerManager;
let updater: UpdaterManager;
let historyManager: HistoryManager;

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (windowManager) {
      const win = windowManager.getMainWindow();
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    }
  });
}

app.whenReady().then(async () => {
  try {
    log.info("[Main] Application starting...");

    // Setup minimal menu (hide default menus)
    setupMenu();

    database = new DatabaseManager();
    database.initialize();
    log.info("[Main] Database initialized");

    settings = new SettingsManager();
    await settings.initialize();
    log.info("[Main] Settings loaded");

    ytDlp = new YtDlpManager();
    await ytDlp.initialize();
    log.info("[Main] yt-dlp initialized");

    ffmpeg = new FFmpegManager(settings);
    await ffmpeg.initialize();
    log.info("[Main] FFmpeg initialized");

    historyManager = new HistoryManager(database);
    queueManager = new QueueManager();
    downloadEngine = new DownloadEngine(ytDlp, ffmpeg, settings, queueManager, historyManager);
    converter = new ConverterManager(ffmpeg, settings);
    scheduler = new SchedulerManager(downloadEngine, settings);
    scheduler.start();

    windowManager = new WindowManager(settings);
    const mainWindow = windowManager.createMainWindow();
    log.info("[Main] Main window created");

    const notifications = new NotificationManager();
    const clipboard = new ClipboardManager();

    new IpcHandler(
      mainWindow,
      database,
      settings,
      ytDlp,
      ffmpeg,
      downloadEngine,
      queueManager,
      converter,
      historyManager,
      scheduler,
      notifications,
      clipboard,
    );

    if (settings.get("autoUpdate")) {
      updater = new UpdaterManager(mainWindow);
      updater.checkForUpdates();
    }

    log.info("[Main] Application ready");
  } catch (error) {
    log.error("[Main] Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (windowManager) windowManager.createMainWindow();
  }
});

app.on("before-quit", async () => {
  log.info("[Main] Application shutting down...");
  if (scheduler) scheduler.stop();
  if (downloadEngine) await downloadEngine.stopAll();
  if (database) database.close();
});

process.on("uncaughtException", (error) => {
  log.error("[Main] Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("[Main] Unhandled rejection:", new Error(String(reason)));
});
