import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import { FFmpegManager } from "../ffmpeg/ffmpeg-manager";
import { SettingsManager } from "../settings/settings-manager";
import { Logger } from "../../shared/logger";
import type { ConversionTask, ConversionOptions } from "../../shared/types";
import { BrowserWindow } from "electron";
import { basename, dirname, extname, join } from "path";

const logger = new Logger("converter");

export class ConverterManager {
  private ffmpegManager: FFmpegManager;
  private settings: SettingsManager;
  private activeConversions: Map<string, ffmpeg.FfmpegCommand> = new Map();
  private conversions: Map<string, ConversionTask> = new Map();

  constructor(ffmpegManager: FFmpegManager, settings: SettingsManager) {
    this.ffmpegManager = ffmpegManager;
    this.settings = settings;
  }

  async convertFile(options: Partial<ConversionTask>): Promise<ConversionTask> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const inputPath = options.inputPath || "";
    const outputFormat = options.outputFormat || "mp4";

    // Generate output path based on input
    const inputDir = dirname(inputPath);
    const inputBase = basename(inputPath, extname(inputPath));
    const outputPath = options.outputPath || join(inputDir, `${inputBase}_converted.${outputFormat}`);

    const task: ConversionTask = {
      id,
      inputPath,
      outputPath,
      outputFormat,
      status: "downloading",
      progress: 0,
      createdAt: now,
      options: options.options as ConversionOptions | undefined,
    };

    this.conversions.set(id, task);

    // Start the conversion
    this.startConversion(id, inputPath, outputPath, outputFormat, options.options as ConversionOptions | undefined);

    logger.info("Conversion started: " + id);
    return task;
  }

  private startConversion(id: string, inputPath: string, outputPath: string, outputFormat: string, options?: ConversionOptions): void {
    const command = ffmpeg(inputPath);

    // Set FFmpeg path
    const ffmpegPath = this.ffmpegManager.getFfmpegPath();
    if (ffmpegPath) {
      command.setFfmpegPath(ffmpegPath);
    }

    // Apply conversion options
    if (options) {
      // Video to audio conversion
      if (options.videoToAudio || options.extractAudio) {
        command.noVideo();
        const audioBitrate = options.audioBitrate || "192k";
        command.audioBitrate(audioBitrate);

        if (outputFormat === "mp3") {
          command.audioCodec("libmp3lame");
        } else if (outputFormat === "aac") {
          command.audioCodec("aac");
        } else if (outputFormat === "flac") {
          command.audioCodec("flac");
        } else if (outputFormat === "ogg") {
          command.audioCodec("libvorbis");
        } else if (outputFormat === "wav") {
          command.audioCodec("pcm_s16le");
        }
      }
      // Audio to video (add static image)
      else if (options.audioToVideo) {
        // Would need a background image - simplified for now
        command.videoCodec("libx264");
        command.audioCodec("aac");
      }
      // Video conversion
      else {
        // Video codec
        if (options.videoCodec) {
          command.videoCodec(options.videoCodec);
        } else if (outputFormat === "mp4" || outputFormat === "m4v") {
          command.videoCodec("libx264");
        } else if (outputFormat === "webm") {
          command.videoCodec("libvpx-vp9");
        } else if (outputFormat === "mkv") {
          command.videoCodec("libx264");
        }

        // Audio codec
        if (options.audioCodec) {
          command.audioCodec(options.audioCodec);
        } else {
          command.audioCodec("aac");
        }

        // Resolution scaling
        if (options.resize) {
          command.size(`${options.resize.width}x${options.resize.height}`);
        } else if (options.resolution) {
          command.size(options.resolution);
        }

        // FPS
        if (options.fps) {
          command.fps(options.fps);
        }

        // Video bitrate
        if (options.videoBitrate) {
          command.videoBitrate(options.videoBitrate);
        }

        // Audio bitrate
        if (options.audioBitrate) {
          command.audioBitrate(options.audioBitrate);
        }

        // Compression
        if (options.compress) {
          const crf = Math.round((1 - options.compress.quality / 100) * 51);
          command.outputOptions([`-crf ${crf}`, "-preset fast"]);
        }

        // Trim
        if (options.trim || (options.trimStart !== undefined && options.trimEnd !== undefined)) {
          const start = options.trim?.start ?? options.trimStart ?? 0;
          const end = options.trim?.end ?? options.trimEnd;
          if (end) {
            command.setStartTime(start).setDuration(end - start);
          } else {
            command.setStartTime(start);
          }
        }

        // Rotate
        if (options.rotate) {
          const rotations = { 90: "transpose=1", 180: "transpose=2,transpose=2", 270: "transpose=2" };
          command.videoFilters(rotations[options.rotate as keyof typeof rotations] || "");
        }
      }

      // Burn subtitles
      if (options.burnSubtitles && options.subtitlePath) {
        command.videoFilters(`subtitles='${options.subtitlePath}'`);
      }
    } else {
      // Default conversion settings
      if (outputFormat === "mp3") {
        command.noVideo().audioCodec("libmp3lame").audioBitrate("192k");
      } else {
        command.videoCodec("libx264").audioCodec("aac");
      }
    }

    // Progress handler
    command.on("progress", (progress) => {
      const task = this.conversions.get(id);
      if (task) {
        task.progress = progress.percent || 0;
        this.broadcastProgress(id, task.progress);
      }
    });

    // Error handler
    command.on("error", (err, stdout, stderr) => {
      const task = this.conversions.get(id);
      if (task) {
        task.status = "failed";
        task.progress = 0;
        logger.error(`Conversion failed: ${id}`, err.message);
        this.broadcastFailed(id, err.message);
      }
      this.activeConversions.delete(id);
    });

    // Complete handler
    command.on("end", () => {
      const task = this.conversions.get(id);
      if (task) {
        task.status = "completed";
        task.progress = 100;
        logger.info(`Conversion completed: ${id}`);
        this.broadcastCompleted(id, outputPath);
      }
      this.activeConversions.delete(id);
    });

    // Save command reference and start
    this.activeConversions.set(id, command);
    command.save(outputPath);
  }

  private broadcastProgress(id: string, progress: number): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("conversion-progress", { id, progress });
    }
  }

  private broadcastCompleted(id: string, outputPath: string): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("conversion-completed", { id, outputPath });
    }
  }

  private broadcastFailed(id: string, error: string): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send("conversion-failed", { id, error });
    }
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

  getConversion(id: string): ConversionTask | undefined {
    return this.conversions.get(id);
  }
}
