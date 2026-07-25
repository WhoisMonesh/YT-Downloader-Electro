import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("updater");

export class UpdaterManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    autoUpdater.autoDownload = false;
  }

  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdates();
      logger.info("Update check completed");
    } catch (error) {
      logger.error("Update check failed:", error as Error);
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
      logger.info("Update downloaded");
    } catch (error) {
      logger.error("Update download failed:", error as Error);
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall(false, true);
  }
}
