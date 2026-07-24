import type {
  DownloadProgress,
  MediaInfo,
  DownloadItem,
  ConversionTask,
  HistoryEntry,
  SchedulerTask,
  AppSettings,
  Analytics,
  LogEntry,
  NetworkStatus,
} from "./types";

export interface ElectronAPI {
  analyzeUrl: (url: string) => Promise<MediaInfo>;
  analyzePlaylist: (url: string) => Promise<MediaInfo>;
  startDownload: (item: Partial<DownloadItem>) => Promise<DownloadItem>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  getDownloads: () => Promise<DownloadItem[]>;
  moveDownloadUp: (id: string) => Promise<void>;
  moveDownloadDown: (id: string) => Promise<void>;
  reorderQueue: (ids: string[]) => Promise<void>;
  getQueueStatus: () => Promise<{ active: number; waiting: number; paused: number }>;
  clearQueue: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearFailed: () => Promise<void>;
  convertFile: (task: Partial<ConversionTask>) => Promise<ConversionTask>;
  getConversions: () => Promise<ConversionTask[]>;
  cancelConversion: (id: string) => Promise<void>;
  getHistory: (search?: string, filter?: string) => Promise<HistoryEntry[]>;
  deleteHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  exportHistory: () => Promise<string>;
  redownload: (id: string) => Promise<DownloadItem>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getFfmpegStatus: () => Promise<{ available: boolean; path: string; version: string }>;
  setFfmpegPath: (path: string) => Promise<void>;
  downloadFfmpeg: () => Promise<void>;
  getNetworkStatus: () => Promise<NetworkStatus>;
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  getAnalytics: () => Promise<Analytics>;
  openFolder: (path: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  revealInExplorer: (path: string) => Promise<void>;
  getDiskSpace: () => Promise<{ total: number; free: number; used: number }>;
  getScheduledTasks: () => Promise<SchedulerTask[]>;
  addScheduledTask: (task: Partial<SchedulerTask>) => Promise<SchedulerTask>;
  updateScheduledTask: (id: string, task: Partial<SchedulerTask>) => Promise<void>;
  deleteScheduledTask: (id: string) => Promise<void>;
  getLogs: (category?: string, level?: string) => Promise<LogEntry[]>;
  exportLogs: () => Promise<string>;
  batchImport: (urls: string[]) => Promise<void>;
  batchExport: (ids: string[]) => Promise<string>;
  selectDirectory: () => Promise<string | null>;
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  onDownloadCompleted: (callback: (item: DownloadItem) => void) => () => void;
  onDownloadFailed: (callback: (item: DownloadItem) => void) => () => void;
  onConversionProgress: (callback: (progress: ConversionTask) => void) => () => void;
  onClipboardUrl: (callback: (url: string) => void) => () => void;
  onNotificationClicked: (callback: (data: { downloadId: string }) => void) => () => void;
}
