import * as fs from "fs";
import { join } from "path";
import { BrowserWindow } from "electron";
import { Logger } from "../../shared/logger";
import { SettingsManager } from "../settings/settings-manager";

const logger = new Logger("watch-folder");

export class WatchFolderManager {
  private watcher: fs.FSWatcher | null = null;
  private settings: SettingsManager;
  private window: BrowserWindow;
  private watchPath: string | null = null;
  private processedFiles: Set<string> = new Set();

  constructor(settings: SettingsManager, window: BrowserWindow) {
    this.settings = settings;
    this.window = window;
  }

  start() {
    this.watchPath = this.settings.get("watchFolder") || null;
    if (!this.watchPath) return;

    if (!fs.existsSync(this.watchPath)) {
      try {
        fs.mkdirSync(this.watchPath, { recursive: true });
      } catch (err) {
        logger.error("Failed to create watch folder", err);
        return;
      }
    }

    try {
      this.watcher = fs.watch(this.watchPath, (eventType, filename) => {
        if (eventType === "rename" && filename && filename.endsWith(".txt")) {
          this.handleFile(filename);
        }
      });
      logger.info(`Started watching folder: ${this.watchPath}`);
    } catch (err) {
      logger.error("Failed to start watch folder", err);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      logger.info("Stopped watching folder");
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  private handleFile(filename: string) {
    if (!this.watchPath) return;
    const filePath = join(this.watchPath, filename);

    // Give the file a moment to finish writing
    setTimeout(() => {
      if (!fs.existsSync(filePath)) return;
      if (this.processedFiles.has(filePath)) return;

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const urls = content
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.startsWith("http://") || line.startsWith("https://"));

        if (urls.length > 0) {
          logger.info(`Found ${urls.length} URLs in ${filename}`);
          this.window.webContents.send("batch-import-urls", urls);
          this.processedFiles.add(filePath);
        }
      } catch (err) {
        logger.error(`Error reading watched file: ${filename}`, err);
      }
    }, 1000); // 1s delay
  }
}
