import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import { FFmpegManager } from "../ffmpeg/ffmpeg-manager";
import { SettingsManager } from "../settings/settings-manager";
import { Logger } from "../../shared/logger";
import type { ConversionTask } from "../../shared/types";

const logger = new Logger("converter");

export class ConverterManager {
  private ffmpegManager: FFmpegManager;
  private settings: SettingsManager;
  private activeConversions: Map<string, ReturnType<typeof ffmpeg>> = new Map();
  private conversions: Map<string, ConversionTask> = new Map();

  constructor(ffmpegManager: FFmpegManager, settings: SettingsManager) {
    this.ffmpegManager = ffmpegManager;
    this.settings = settings;
  }

  async convertFile(options: Partial<ConversionTask>): Promise<ConversionTask> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const task: ConversionTask = {
      id,
      inputPath: options.inputPath || "",
      outputPath: options.outputPath || "",
      outputFormat: options.outputFormat || "mp4",
      status: "downloading",
      progress: 0,
      createdAt: now,
    };

    this.conversions.set(id, task);
    logger.info("Conversion started: " + id);
    return task;
  }

  cancelConversion(id: string): void {
    const cmd = this.activeConversions.get(id);
    if (cmd) {
      cmd.kill("SIGKILL");
      this.activeConversions.delete(id);
      const task = this.conversions.get(id);
      if (task) task.status = "cancelled";
      logger.info("Conversion cancelled: " + id);
    }
  }

  async getFfmpegStatus(): Promise<{ available: boolean; path: string; version: string }> {
    return this.ffmpegManager.getStatus();
  }

  setFfmpegPath(path: string): void {
    this.ffmpegManager.setFfmpegPath(path);
  }

  getConversions(): ConversionTask[] {
    return Array.from(this.conversions.values());
  }
}
