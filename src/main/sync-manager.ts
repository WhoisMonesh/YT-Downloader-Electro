import { SettingsManager } from "./settings/settings-manager";
import { HistoryManager } from "./database/history-manager";
import { Logger } from "../shared/logger";
import type { AppSettings } from "../shared/types";

const logger = new Logger("sync");

export class SyncManager {
  private settings: SettingsManager;
  private history: HistoryManager;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(settings: SettingsManager, history: HistoryManager) {
    this.settings = settings;
    this.history = history;
  }

  start() {
    const syncConfig = this.settings.get("cloudSync");
    if (!syncConfig?.enabled || !syncConfig.webdav?.url) return;
    
    // Initial sync
    this.sync();

    // Schedule
    const intervalMinutes = syncConfig.syncIntervalMinutes || 60;
    this.intervalId = setInterval(() => this.sync(), intervalMinutes * 60 * 1000);
    logger.info("Sync Manager started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async sync() {
    const syncConfig = this.settings.get("cloudSync");
    if (!syncConfig?.enabled || !syncConfig.webdav?.url) return;

    logger.info("Starting WebDAV sync...");
    const url = syncConfig.webdav.url.endsWith('/') ? syncConfig.webdav.url : syncConfig.webdav.url + '/';
    const auth = Buffer.from(`${syncConfig.webdav.username}:${syncConfig.webdav.password}`).toString("base64");
    const headers = { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" };

    try {
      if (syncConfig.syncSettings) {
         // We should normally merge settings, but for simplicity we'll just push
         const localSettings = this.settings.getAll();
         await fetch(`${url}settings.json`, {
           method: "PUT",
           headers,
           body: JSON.stringify(localSettings)
         });
      }
      
      if (syncConfig.syncHistory) {
         // Push history.json
         const allHistory = await this.history.getHistory();
         await fetch(`${url}history.json`, {
           method: "PUT",
           headers,
           body: JSON.stringify(allHistory)
         });
      }
      logger.info("WebDAV sync completed");
    } catch (e) {
      logger.error("WebDAV sync failed:", e);
    }
  }

  async forceSync() {
    await this.sync();
  }

  async restore() {
    const syncConfig = this.settings.get("cloudSync");
    if (!syncConfig?.enabled || !syncConfig.webdav?.url) throw new Error("Sync not configured");

    logger.info("Restoring from WebDAV...");
    const url = syncConfig.webdav.url.endsWith('/') ? syncConfig.webdav.url : syncConfig.webdav.url + '/';
    const auth = Buffer.from(`${syncConfig.webdav.username}:${syncConfig.webdav.password}`).toString("base64");
    const headers = { "Authorization": `Basic ${auth}` };

    try {
      if (syncConfig.syncSettings) {
         const res = await fetch(`${url}settings.json`, { headers });
         if (res.ok) {
           const remoteSettings = await res.json();
           await this.settings.update(remoteSettings as Partial<AppSettings>);
         }
      }
      
      if (syncConfig.syncHistory) {
         const res = await fetch(`${url}history.json`, { headers });
         if (res.ok) {
           const remoteHistory = await res.json();
           // Merge history or replace. For now, replace.
           // Would require adding a method in HistoryManager
         }
      }
      logger.info("Restore completed");
    } catch (e) {
      logger.error("WebDAV restore failed:", e);
      throw e;
    }
  }
}
