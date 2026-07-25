import { BrowserWindow } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { SettingsManager } from "./settings/settings-manager";
import { Logger } from "../shared/logger";

const logger = new Logger("window-manager");

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settings: SettingsManager;

  constructor(settings: SettingsManager) {
    this.settings = settings;
  }

  createMainWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      frame: false,
      backgroundColor: "#0f0f0f",
      show: false,
      icon: join(__dirname, "../../resources/icon.png"),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      const url = process.env["ELECTRON_RENDERER_URL"];
      this.mainWindow.loadURL(url);
    } else {
      this.mainWindow.loadFile(join(__dirname, "../../dist/renderer/index.html"));
    }

    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    logger.info("Main window created");
    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}
