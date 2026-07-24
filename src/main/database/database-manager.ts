import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { app } from "electron";
import { Logger } from "../../shared/logger";

const logger = new Logger("database");

const SCHEMA_VERSION = 4;

export class DatabaseManager {
  private db: Database.Database | null = null;

  initialize(): void {
    const dbDir = join(app.getPath("userData"), "database");
    if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
    const dbPath = join(dbDir, "app.db");
    this.db = new Database(dbPath);

    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("synchronous = NORMAL");

    this.runMigrations();
    logger.info("Database initialized");
  }

  private runMigrations(): void {
    if (!this.db) throw new Error("Database not initialized");

    // Migrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const currentVersion = (this.db.prepare("SELECT MAX(version) as v FROM schema_migrations").get() as { v: number | null })?.v ?? 0;

    if (currentVersion < 1) {
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
      this.db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(1);
    }

    if (currentVersion < 2) {
      this.db.exec(`
        ALTER TABLE downloads ADD COLUMN audio_quality TEXT NOT NULL DEFAULT '128kbps';
        ALTER TABLE downloads ADD COLUMN output_format TEXT NOT NULL DEFAULT 'mp4';
        ALTER TABLE downloads ADD COLUMN is_playlist INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE downloads ADD COLUMN playlist_id TEXT;
        CREATE TABLE IF NOT EXISTS conversions (
          id TEXT PRIMARY KEY,
          input_path TEXT NOT NULL,
          output_path TEXT NOT NULL,
          output_format TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          progress REAL NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          completed_at TEXT,
          error TEXT,
          options TEXT NOT NULL DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
      `);
      this.db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(2);
    }

    if (currentVersion < 3) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS download_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          download_id TEXT NOT NULL,
          type TEXT NOT NULL,
          payload TEXT NOT NULL DEFAULT '{}',
          timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_download_events_download ON download_events(download_id);
        CREATE INDEX IF NOT EXISTS idx_download_events_type ON download_events(type);
      `);
      this.db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(3);
    }

    if (currentVersion < 4) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          channel_id TEXT NOT NULL,
          channel_name TEXT NOT NULL DEFAULT '',
          channel_url TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          check_interval_minutes INTEGER NOT NULL DEFAULT 60,
          last_checked TEXT,
          last_video_id TEXT,
          profile_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS conversion_presets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          output_format TEXT NOT NULL,
          video_codec TEXT,
          audio_codec TEXT,
          video_bitrate TEXT,
          audio_bitrate TEXT,
          resolution TEXT,
          fps INTEGER,
          trim_start REAL,
          trim_end REAL,
          crop_x INTEGER,
          crop_y INTEGER,
          crop_w INTEGER,
          crop_h INTEGER,
          rotate INTEGER,
          watermark_path TEXT,
          watermark_position TEXT,
          watermark_opacity REAL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS hotkeys (
          id TEXT PRIMARY KEY,
          accelerator TEXT NOT NULL,
          action TEXT NOT NULL,
          label TEXT NOT NULL,
          scope TEXT NOT NULL DEFAULT 'app'
        );
        CREATE TABLE IF NOT EXISTS plugins (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL DEFAULT '0.0.0',
          author TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          enabled INTEGER NOT NULL DEFAULT 1,
          path TEXT NOT NULL,
          manifest TEXT NOT NULL DEFAULT '{}',
          installed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      this.db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(4);
    }

    logger.info("Migrations complete (version " + SCHEMA_VERSION + ")");
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
