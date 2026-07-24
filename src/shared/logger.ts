import log from "loglevel";
import { join } from "path";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import { app } from "electron";

const LEVELS = ["trace", "debug", "info", "warn", "error", "silent"] as const;
type Level = (typeof LEVELS)[number];

let logFilePath: string | null = null;
let fileLoggingEnabled = false;

function getLogDir(): string {
  return join(app.getPath("userData"), "logs");
}

function ensureLogFile(): string {
  if (logFilePath) return logFilePath;
  const dir = getLogDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  logFilePath = join(dir, `app-${date}.log`);
  return logFilePath;
}

function formatLine(level: string, prefix: string, args: unknown[]): string {
  const ts = new Date().toISOString();
  const msg = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  return `${ts} [${level.toUpperCase()}] ${prefix} ${msg}`;
}

export class Logger {
  private logger: log.Logger;
  private prefix: string;
  private writeToFile: boolean;

  constructor(category: string, opts: { file?: boolean } = {}) {
    this.prefix = `[${category}]`;
    this.logger = log.getLogger(category);
    this.logger.setLevel(log.levels.INFO, false);
    this.writeToFile = fileLoggingEnabled && opts.file !== false;
  }

  info(...args: unknown[]): void {
    this.logger.info(this.prefix, ...args);
    this.write("info", args);
  }
  warn(...args: unknown[]): void {
    this.logger.warn(this.prefix, ...args);
    this.write("warn", args);
  }
  error(...args: unknown[]): void {
    this.logger.error(this.prefix, ...args);
    this.write("error", args);
  }
  debug(...args: unknown[]): void {
    this.logger.debug(this.prefix, ...args);
    this.write("debug", args);
  }
  trace(...args: unknown[]): void {
    this.logger.trace(this.prefix, ...args);
    this.write("trace", args);
  }

  private write(level: string, args: unknown[]): void {
    if (!this.writeToFile) return;
    try {
      appendFileSync(ensureLogFile(), formatLine(level, this.prefix, args) + "\n");
    } catch {
      // Never let logging crash the app.
    }
  }
}

export function configureLogging(level: Level = "info", file = true): void {
  log.setLevel(level as log.LogLevelDesc, false);
  fileLoggingEnabled = file;
  // Catch uncaught errors and write them to the log.
  process.on("uncaughtException", (err) => {
    try {
      appendFileSync(
        ensureLogFile(),
        formatLine("error", "[uncaught]", [err.message, err.stack]) + "\n",
      );
    } catch {
      /* noop */
    }
  });
}
