import { DatabaseManager } from "./database-manager";
import { Logger } from "../../shared/logger";
import type { HistoryEntry } from "../../shared/types";

const logger = new Logger("history");

export class HistoryManager {
  private database: DatabaseManager;

  constructor(database: DatabaseManager) {
    this.database = database;
  }

  addToHistory(item: HistoryEntry): void {
    const db = this.database.getDb();
    db.prepare(
      "INSERT INTO history (id, download_id, url, title, thumbnail, channel, duration, output_path, format, quality, file_size, downloaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      item.id,
      item.downloadId,
      item.url,
      item.title,
      item.thumbnail,
      item.channel,
      item.duration,
      item.outputPath,
      item.outputFormat,
      "best",
      item.fileSize,
      item.downloadedAt,
    );
    logger.info("History added: " + item.id);
  }

  getHistory(): HistoryEntry[] {
    const db = this.database.getDb();
    const rows = db
      .prepare("SELECT * FROM history ORDER BY downloaded_at DESC")
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: r.id as string,
      downloadId: r.download_id as string,
      title: r.title as string,
      url: r.url as string,
      thumbnail: r.thumbnail as string,
      channel: r.channel as string,
      duration: r.duration as number,
      outputPath: r.output_path as string,
      outputFormat: r.format as HistoryEntry["outputFormat"],
      fileSize: r.file_size as number,
      downloadedAt: r.downloaded_at as string,
      type: "video" as const,
    }));
  }

  deleteHistory(id: string): void {
    const db = this.database.getDb();
    db.prepare("DELETE FROM history WHERE id = ?").run(id);
    logger.info("History deleted: " + id);
  }

  clearHistory(): void {
    const db = this.database.getDb();
    db.prepare("DELETE FROM history").run();
    logger.info("History cleared");
  }

  exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  getByDownloadId(downloadId: string): HistoryEntry | null {
    const db = this.database.getDb();
    const row = db
      .prepare("SELECT * FROM history WHERE download_id = ?")
      .get(downloadId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      downloadId: row.download_id as string,
      title: row.title as string,
      url: row.url as string,
      thumbnail: row.thumbnail as string,
      channel: row.channel as string,
      duration: row.duration as number,
      outputPath: row.output_path as string,
      outputFormat: row.format as HistoryEntry["outputFormat"],
      fileSize: row.file_size as number,
      downloadedAt: row.downloaded_at as string,
      type: "video" as const,
    };
  }
}
