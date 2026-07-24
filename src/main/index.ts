import { app, BrowserWindow, session, Menu, Tray, nativeImage, shell } from "electron";
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

let tray: Tray | null = null;

// Create custom application menu
function setupMenu(mainWindow: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "New Download",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow.webContents.send("menu-new-download"),
        },
        {
          label: "Open Folder",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await require("electron").dialog.showOpenDialog(mainWindow, {
              properties: ["openDirectory"],
            });
            if (!result.canceled && result.filePaths[0]) {
              shell.openPath(result.filePaths[0]);
            }
          },
        },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => mainWindow.webContents.send("menu-open-settings"),
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Downloads",
      submenu: [
        {
          label: "Pause All",
          click: () => mainWindow.webContents.send("menu-pause-all"),
        },
        {
          label: "Resume All",
          click: () => mainWindow.webContents.send("menu-resume-all"),
        },
        {
          label: "Clear Completed",
          click: () => mainWindow.webContents.send("menu-clear-completed"),
        },
        { type: "separator" },
        {
          label: "Open Downloads Folder",
          click: () => {
            const settings = require("./settings/settings-manager");
            // Will be handled via IPC
            mainWindow.webContents.send("menu-open-downloads-folder");
          },
        },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Converter",
          click: () => mainWindow.webContents.send("menu-navigate", "/converter"),
        },
        {
          label: "Scheduler",
          click: () => mainWindow.webContents.send("menu-navigate", "/scheduler"),
        },
        { type: "separator" },
        {
          label: "Clipboard Monitor",
          type: "checkbox",
          checked: true,
          click: (menuItem) => {
            mainWindow.webContents.send("menu-toggle-clipboard", menuItem.checked);
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Universal Media Downloader",
              message: "Universal Media Downloader",
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode: ${process.versions.node}`,
            });
          },
        },
        {
          label: "Check for Updates",
          click: () => mainWindow.webContents.send("menu-check-updates"),
        },
        { type: "separator" },
        {
          label: "View Logs",
          click: () => mainWindow.webContents.send("menu-navigate", "/logs"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create system tray
function setupTray(mainWindow: BrowserWindow): void {
  try {
    // Create a simple 16x16 tray icon programmatically
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    // Fill with a simple blue color (RGBA)
    for (let i = 0; i < size * size; i++) {
      canvas[i * 4] = 14;     // R
      canvas[i * 4 + 1] = 165; // G
      canvas[i * 4 + 2] = 229; // B
      canvas[i * 4 + 3] = 255; // A
    }
    const trayIcon = nativeImage.createFromBuffer(canvas, { width: size, height: size });

    tray = new Tray(trayIcon);
    tray.setToolTip("Universal Media Downloader");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show Window",
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      { type: "separator" },
      {
        label: "Pause All Downloads",
        click: () => mainWindow.webContents.send("menu-pause-all"),
      },
      {
        label: "Resume All Downloads",
        click: () => mainWindow.webContents.send("menu-resume-all"),
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => app.quit(),
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      mainWindow.show();
      mainWindow.focus();
    });

    logger.info("System tray created");
  } catch (err) {
    logger.error("Failed to create system tray:", err);
    // Continue without tray - not critical
  }
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

    // Setup custom application menu
    // Note: Menu will be set up after window is created

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

    // Disable standard application top menu bar
    Menu.setApplicationMenu(null);
    setupTray(mainWindow);

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

    if (settings.get("autoUpdate") && app.isPackaged) {
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
