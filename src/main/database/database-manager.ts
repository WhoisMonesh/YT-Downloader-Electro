import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { app } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("database");

export class DatabaseManager {
  private db: Database.Database | null = null;

  initialize(): void {
    const dbDir = join(app.getPath("userData"), "database");
    if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
    const dbPath = join(dbDir, "app.db");
    this.db = new Database(dbPath);

    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        thumbnail TEXT NOT NULL DEFAULT '',
        channel TEXT NOT NULL DEFAULT '',
        duration INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'waiting',
        progress_percent REAL NOT NULL DEFAULT 0,
        progress_speed REAL NOT NULL DEFAULT 0,
        progress_eta INTEGER NOT NULL DEFAULT 0,
        progress_downloaded INTEGER NOT NULL DEFAULT 0,
        progress_total INTEGER NOT NULL DEFAULT 0,
        progress_stage TEXT NOT NULL DEFAULT 'downloading',
        output_path TEXT NOT NULL DEFAULT '',
        format TEXT NOT NULL DEFAULT '',
        quality TEXT NOT NULL DEFAULT '',
        file_size INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        error TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        download_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        thumbnail TEXT NOT NULL DEFAULT '',
        channel TEXT NOT NULL DEFAULT '',
        duration INTEGER NOT NULL DEFAULT 0,
        output_path TEXT NOT NULL,
        format TEXT NOT NULL,
        quality TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        downloaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        urls TEXT NOT NULL DEFAULT '[]',
        frequency TEXT NOT NULL DEFAULT 'once',
        time TEXT NOT NULL,
        days TEXT DEFAULT '[]',
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_run TEXT,
        next_run TEXT
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'app',
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        meta TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
      CREATE INDEX IF NOT EXISTS idx_history_downloaded_at ON history(downloaded_at);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    `);

    logger.info("Database initialized");
  }

  getDb(): Database.Database {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info("Database closed");
    }
  }
}
