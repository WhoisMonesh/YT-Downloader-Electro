import { clipboard, BrowserWindow } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("clipboard");

const URL_REGEX = /https?:\/\/(www\.youtube\.com\/|youtu\.be\/)[^\s]+/g;

export class ClipboardManager {
  private lastText = "";
  private monitoring = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  startMonitoring(window: BrowserWindow): void {
    if (this.monitoring) return;
    this.monitoring = true;
    this.lastText = clipboard.readText();

    this.interval = setInterval(() => {
      const currentText = clipboard.readText();
      if (currentText !== this.lastText) {
        this.lastText = currentText;
        const urls = currentText.match(URL_REGEX);
        if (urls && urls.length > 0) {
          for (const url of urls) {
            window.webContents.send("clipboard-url", url);
          }
        }
      }
    }, 1000);

    logger.info("Clipboard monitoring started");
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.monitoring = false;
    logger.info("Clipboard monitoring stopped");
  }

  checkClipboard(): string | null {
    const text = clipboard.readText();
    const urls = text.match(URL_REGEX);
    return urls && urls.length > 0 ? urls[0] : null;
  }
}
