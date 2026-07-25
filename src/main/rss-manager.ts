import { SettingsManager } from "./settings/settings-manager";
import { DownloadEngine } from "./downloader/download-engine";
import { Logger } from "../shared/logger";

const logger = new Logger("rss");

export class RssManager {
  private settings: SettingsManager;
  private engine: DownloadEngine;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(settings: SettingsManager, engine: DownloadEngine) {
    this.settings = settings;
    this.engine = engine;
  }

  start() {
    this.checkFeeds();
    // Check every 10 minutes
    this.intervalId = setInterval(() => this.checkFeeds(), 10 * 60 * 1000);
    logger.info("RSS Manager started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkFeeds() {
    const feeds = this.settings.get("rssFeeds") || [];
    for (const feed of feeds) {
      if (!feed.enabled) continue;
      
      try {
        const response = await fetch(feed.url);
        const text = await response.text();
        
        // Simple regex-based XML parsing to find <item> or <entry>
        const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
        const linkRegex = /<link(?:[^>]*href="([^"]+)")?[^>]*>([^<]*)<\/link>/i;
        
        let match;
        const urls = [];
        let count = 0;
        
        while ((match = itemRegex.exec(text)) !== null) {
          if (count >= (feed.maxItemsPerCheck || 5)) break;
          const content = match[1] || match[2];
          const linkMatch = content.match(linkRegex);
          let link = "";
          if (linkMatch) {
             link = linkMatch[1] || linkMatch[2]; // href or inner text
          }
          if (link) {
            urls.push(link.trim());
          }
          count++;
        }
        
        // Just download the first new one for simplicity if we don't have lastItemGuid
        // To be robust we should check feed.lastItemGuid.
        if (urls.length > 0 && urls[0] !== feed.lastItemGuid) {
           feed.lastItemGuid = urls[0];
           this.settings.update({ rssFeeds: feeds }); // Save state
           
           for (const url of urls.reverse()) {
             logger.info(`RSS Feed ${feed.name} found new item: ${url}`);
             this.engine.startDownload({ url, outputFormat: "mp4", quality: "best" });
           }
        }
      } catch (err) {
        logger.error(`Failed to check RSS feed ${feed.name}: ${err}`);
      }
    }
  }
}
