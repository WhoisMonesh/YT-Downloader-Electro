import { DownloadEngine } from "../downloader/download-engine";
import { SettingsManager } from "../settings/settings-manager";
import { Logger } from "../../shared/logger";
import type { SchedulerTask } from "../../shared/types";

const logger = new Logger("scheduler");

export class SchedulerManager {
  private downloadEngine: DownloadEngine;
  private settings: SettingsManager;
  private schedules: Map<string, SchedulerTask> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private running = false;

  constructor(downloadEngine: DownloadEngine, settings: SettingsManager) {
    this.downloadEngine = downloadEngine;
    this.settings = settings;
  }

  start(): void {
    this.running = true;
    logger.info("Scheduler started");
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    logger.info("Scheduler stopped");
  }

  getSchedules(): SchedulerTask[] {
    return Array.from(this.schedules.values());
  }

  addSchedule(options: Partial<SchedulerTask>): SchedulerTask {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const task: SchedulerTask = {
      id,
      name: options.name || "",
      url: options.url || "",
      cronExpression: options.cronExpression || "",
      outputFormat: options.outputFormat || "mp4",
      quality: options.quality || "best",
      enabled: options.enabled ?? true,
      action: options.action || "none",
      createdAt: now,
    };

    this.schedules.set(id, task);
    logger.info("Schedule added: " + id);
    return task;
  }

  updateSchedule(id: string, options: Partial<SchedulerTask>): void {
    const existing = this.schedules.get(id);
    if (existing) {
      this.schedules.set(id, { ...existing, ...options });
      logger.info("Schedule updated: " + id);
    }
  }

  deleteSchedule(id: string): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.schedules.delete(id);
    logger.info("Schedule deleted: " + id);
  }
}
