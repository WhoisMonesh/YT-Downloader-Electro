import { existsSync } from "fs";
import { join } from "path";
import { execFile } from "child_process";
import { app } from "electron";
import { SettingsManager } from "../settings/settings-manager";
import { Logger } from "../../shared/logger";

const logger = new Logger("ffmpeg");

// Try to use ffmpeg-static if available
let ffmpegStaticPath: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ffmpegStaticPath = require("ffmpeg-static");
} catch {
  // ffmpeg-static not available
}

export class FFmpegManager {
  private ffmpegPath: string = "";
  private settings: SettingsManager;

  constructor(settings: SettingsManager) {
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    this.ffmpegPath = this.findFfmpeg();
    logger.info("FFmpeg initialized at: " + this.ffmpegPath);
  }

  private findFfmpeg(): string {
    const customPath = this.settings.get("ffmpegPath");
    if (customPath && existsSync(customPath)) return customPath;

    // Use ffmpeg-static if available (bundled with app)
    if (ffmpegStaticPath && existsSync(ffmpegStaticPath)) {
      return ffmpegStaticPath;
    }

    const ext = process.platform === "win32" ? ".exe" : "";
    const name = "ffmpeg" + ext;

    // Check bundled resource
    const bundled = join(process.resourcesPath, "ffmpeg", name);
    if (existsSync(bundled)) return bundled;

    // Check project root
    const local = join(process.cwd(), "ffmpeg", name);
    if (existsSync(local)) return local;

    // Fallback to PATH
    return name;
  }

  getFfmpegPath(): string {
    return this.ffmpegPath;
  }

  setFfmpegPath(path: string): void {
    if (existsSync(path)) {
      this.ffmpegPath = path;
      this.settings.update({ ffmpegPath: path });
      logger.info("FFmpeg path updated: " + path);
    }
  }

  async getStatus(): Promise<{ available: boolean; path: string; version: string }> {
    return new Promise((resolve) => {
      execFile(this.ffmpegPath, ["-version"], { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve({ available: false, path: this.ffmpegPath, version: "" });
        } else {
          const versionMatch = stdout.match(/ffmpeg version (\S+)/);
          const version = versionMatch ? versionMatch[1] : "unknown";
          resolve({ available: true, path: this.ffmpegPath, version });
        }
      });
    });
  }
}
