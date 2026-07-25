import { Notification } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("notification");

export class NotificationManager {
  show(title: string, body: string, onClick?: () => void): void {
    const notification = new Notification({ title, body });
    if (onClick) {
      notification.on("click", onClick);
    }
    notification.show();
    logger.debug("Notification shown: " + title);
  }

  showDownloadComplete(title: string): void {
    this.show("Download Complete", `"${title}" has been downloaded successfully.`);
  }

  showDownloadFailed(title: string, error: string): void {
    this.show("Download Failed", `"${title}" failed: ${error}`);
  }

  showUpdateAvailable(version: string): void {
    this.show("Update Available", `Version ${version} is available for download.`);
  }
}
