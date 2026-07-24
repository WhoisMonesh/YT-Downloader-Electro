import { DownloadEngine } from "../downloader/download-engine";
import { SettingsManager } from "../settings/settings-manager";
import { Logger } from "../../shared/logger";
import type { SchedulerTask } from "../../shared/types";
import cronParser from "cron-parser";

const logger = new Logger("scheduler");

export class SchedulerManager {
  private downloadEngine: DownloadEngine;
  private settings: SettingsManager;
  private schedules: Map<string, SchedulerTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(downloadEngine: DownloadEngine, settings: SettingsManager) {
    this.downloadEngine = downloadEngine;
    this.settings = settings;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("Scheduler started");

    // Check schedules every minute
    this.checkInterval = setInterval(() => {
      this.checkSchedules();
    }, 60000);

    // Also check immediately
    this.checkSchedules();
  }

  stop(): void {
    this.running = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    logger.info("Scheduler stopped");
  }

  private checkSchedules(): void {
    if (!this.running) return;

    const now = new Date();
    for (const [id, task] of this.schedules) {
      if (!task.enabled) continue;

      try {
        const interval = cronParser.parseExpression(task.cronExpression);
        const nextRun = interval.next().value;

        // Update next run time
        task.nextRun = nextRun.toISOString();

        // Check if we should run now
        const shouldRun = this.shouldRunTask(task, now);
        if (shouldRun) {
          this.executeTask(task);
          task.lastRun = now.toISOString();
        }
      } catch (err) {
        logger.error(`Invalid cron expression for schedule ${id}: ${task.cronExpression}`);
      }
    }
  }

  private shouldRunTask(task: SchedulerTask, now: Date): boolean {
    if (!task.cronExpression) return false;

    try {
      const interval = cronParser.parseExpression(task.cronExpression, { currentDate: now });
      const prevRun = interval.prev().value;
      const nextRun = interval.next().value;

      // Check if current time is close to the scheduled time (within 1 minute)
      const timeDiff = Math.abs(now.getTime() - nextRun.getTime());
      return timeDiff < 60000 && task.enabled;
    } catch {
      return false;
    }
  }

  private executeTask(task: SchedulerTask): void {
    logger.info(`Executing scheduled task: ${task.name} (${task.id})`);

    // Start the download
    this.downloadEngine.startDownload({
      url: task.url,
      outputFormat: task.outputFormat,
      quality: task.quality,
    });

    // Handle post-download action
    if (task.action && task.action !== "none") {
      // For now, just log - implementing system actions would require additional setup
      logger.info(`Task ${task.name} will trigger action: ${task.action} after completion`);
    }
  }

  getSchedules(): SchedulerTask[] {
    return Array.from(this.schedules.values());
  }

  addSchedule(options: Partial<SchedulerTask>): SchedulerTask {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Calculate next run time
    let nextRun = "";
    try {
      if (options.cronExpression) {
        const interval = cronParser.parseExpression(options.cronExpression);
        nextRun = interval.next().value.toISOString();
      }
    } catch {
      logger.warn("Invalid cron expression for new schedule");
    }

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
      nextRun,
    };

    this.schedules.set(id, task);

    // Schedule the next run if scheduler is running
    if (this.running) {
      this.scheduleNextRun(task);
    }

    logger.info("Schedule added: " + id);
    return task;
  }

  private scheduleNextRun(task: SchedulerTask): void {
    if (!task.cronExpression || !task.enabled) return;

    try {
      const interval = cronParser.parseExpression(task.cronExpression);
      const nextRun = interval.next().value;
      const now = new Date();
      const delay = nextRun.getTime() - now.getTime();

      if (delay > 0) {
        const timer = setTimeout(() => {
          this.executeTask(task);
          task.lastRun = new Date().toISOString();
          // Schedule next run
          this.scheduleNextRun(task);
        }, delay);

        this.timers.set(task.id, timer);
      }
    } catch (err) {
      logger.error(`Failed to schedule next run for task ${task.id}`);
    }
  }

  updateSchedule(id: string, options: Partial<SchedulerTask>): void {
    const existing = this.schedules.get(id);
    if (existing) {
      // Clear existing timer
      const existingTimer = this.timers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.timers.delete(id);
      }

      const updated = { ...existing, ...options };
      this.schedules.set(id, updated);

      // Reschedule if enabled
      if (this.running && updated.enabled) {
        this.scheduleNextRun(updated);
      }

      logger.info("Schedule updated: " + id);
    }
  }

  deleteSchedule(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.schedules.delete(id);
    logger.info("Schedule deleted: " + id);
  }

  toggleSchedule(id: string): void {
    const task = this.schedules.get(id);
    if (task) {
      task.enabled = !task.enabled;
      if (task.enabled && this.running) {
        this.scheduleNextRun(task);
      } else {
        const timer = this.timers.get(id);
        if (timer) {
          clearTimeout(timer);
          this.timers.delete(id);
        }
      }
      logger.info(`Schedule ${id} ${task.enabled ? "enabled" : "disabled"}`);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
