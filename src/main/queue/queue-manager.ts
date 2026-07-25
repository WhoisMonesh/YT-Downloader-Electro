import { randomUUID } from "crypto";
import { Logger } from "../../shared/logger";

const logger = new Logger("queue");

interface QueueItem {
  id: string;
  options: Record<string, unknown>;
  status: "waiting" | "downloading" | "paused" | "completed" | "failed";
  priority: number;
  createdAt: string;
}

export class QueueManager {
  private queue: QueueItem[] = [];
  private paused = false;

  addToQueue(options: Record<string, unknown>): string {
    const item: QueueItem = {
      id: randomUUID(),
      options,
      status: "waiting",
      priority: 0,
      createdAt: new Date().toISOString(),
    };
    this.queue.push(item);
    logger.debug("Added to queue: " + item.id);
    return item.id;
  }

  removeFromQueue(id: string): void {
    this.queue = this.queue.filter((item) => item.id !== id);
  }

  clearQueue(): void {
    this.queue = [];
    logger.info("Queue cleared");
  }

  getQueue(): QueueItem[] {
    return [...this.queue].sort((a, b) => b.priority - a.priority);
  }

  getQueueStatus(): { active: number; waiting: number; paused: number } {
    return {
      active: this.queue.filter((i) => i.status === "downloading").length,
      waiting: this.queue.filter((i) => i.status === "waiting").length,
      paused: this.queue.filter((i) => i.status === "paused").length,
    };
  }

  pauseQueue(): void {
    this.paused = true;
    this.queue
      .filter((i) => i.status === "downloading")
      .forEach((i) => (i.status = "paused"));
    logger.info("Queue paused");
  }

  resumeQueue(): void {
    this.paused = false;
    this.queue
      .filter((i) => i.status === "paused")
      .forEach((i) => (i.status = "waiting"));
    logger.info("Queue resumed");
  }

  reorderQueue(ids: string[]): void {
    const reordered: QueueItem[] = [];
    for (const id of ids) {
      const item = this.queue.find((q) => q.id === id);
      if (item) reordered.push(item);
    }
    this.queue = reordered;
  }

  isPaused(): boolean {
    return this.paused;
  }

  updateItemStatus(id: string, status: QueueItem["status"]): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) item.status = status;
  }
}
