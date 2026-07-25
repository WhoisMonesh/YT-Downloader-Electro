import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { app } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("yt-dlp");

export class YtDlpManager {
  private ytDlpPath: string = "";

  async initialize(): Promise<void> {
    this.ytDlpPath = this.findYtDlp();
    logger.info("yt-dlp initialized at: " + this.ytDlpPath);
  }

  private findYtDlp(): string {
    const ext = process.platform === "win32" ? ".exe" : "";
    const name = "yt-dlp" + ext;

    // Check bundled resource
    const bundled = join(process.resourcesPath, "yt-dlp", name);
    if (existsSync(bundled)) return bundled;

    // Check project root
    const local = join(process.cwd(), "yt-dlp", name);
    if (existsSync(local)) return local;

    // Fallback to PATH
    return name;
  }

  getYtDlpPath(): string {
    return this.ytDlpPath;
  }

  execute(args: string[]): ChildProcess {
    logger.debug("Executing yt-dlp with args: " + args.join(" "));
    return spawn(this.ytDlpPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });
  }
}
