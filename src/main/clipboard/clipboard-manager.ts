import { clipboard, BrowserWindow } from "electron";
import { Logger } from "../../shared/logger";
import { SettingsManager } from "../settings/settings-manager";

const logger = new Logger("clipboard-manager");

export class ClipboardManager {
  private interval: NodeJS.Timeout | null = null;
  private lastText: string = "";
  private settings: SettingsManager;
  private mainWindow: BrowserWindow;

  constructor(settings: SettingsManager, mainWindow: BrowserWindow) {
    this.settings = settings;
    this.mainWindow = mainWindow;
  }

  start() {
    if (this.interval) return;
    
    this.lastText = clipboard.readText();
    
    this.interval = setInterval(() => {
      const isEnabled = this.settings.get("clipboardMonitoring");
      if (!isEnabled) return;

      const text = clipboard.readText();
      if (text && text !== this.lastText) {
        this.lastText = text;
        this.checkYouTubeUrl(text);
      }
    }, 2000); // Check every 2 seconds
    
    logger.info("Clipboard monitor started");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info("Clipboard monitor stopped");
    }
  }

  private checkYouTubeUrl(text: string) {
    // Basic youtube url regex
    const ytRegex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    if (ytRegex.test(text.trim())) {
      logger.info("Detected YouTube URL in clipboard: " + text.trim());
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("clipboard-youtube-url", text.trim());
      }
    }
  }
}
