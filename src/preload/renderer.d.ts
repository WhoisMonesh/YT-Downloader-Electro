import type { ElectronAPI } from '@electron-toolkit/preload';
import type {
  MediaInfo,
  DownloadItem,
  DownloadProgress,
  ConversionTask,
  HistoryEntry,
  SchedulerTask,
  AppSettings,
  Analytics,
  LogEntry,
  NetworkStatus,
} from '../shared/types';

export interface Api {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  analyzeUrl: (url: string) => Promise<MediaInfo>;
  analyzePlaylist: (url: string) => Promise<MediaInfo>;
  startDownload: (item: Partial<DownloadItem>) => Promise<DownloadItem>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  getDownloads: () => Promise<DownloadItem[]>;
  moveDownloadUp: (id: string) => Promise<{ success: boolean }>;
  moveDownloadDown: (id: string) => Promise<{ success: boolean }>;
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
  toggleSchedule: (id: string) => Promise<void>;
  runScheduledTaskNow: (id: string) => Promise<void>;

  getLogs: (category?: string, level?: string) => Promise<LogEntry[]>;
  exportLogs: () => Promise<string>;
  batchImport: (urls: string[]) => Promise<void>;
  batchExport: (ids: string[]) => Promise<string>;

  // Queue info
  getQueueInfo: () => Promise<{
    queued: DownloadItem[];
    queueCount: number;
    activeCount: number;
  }>;

  // Theme
  getTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<void>;

  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  onDownloadCompleted: (callback: (item: DownloadItem) => void) => () => void;
  onDownloadFailed: (callback: (item: DownloadItem) => void) => () => void;
  onConversionProgress: (callback: (progress: { id: string; progress: number }) => void) => () => void;
  onConversionCompleted: (callback: (data: { id: string; outputPath: string }) => void) => () => void;
  onConversionFailed: (callback: (data: { id: string; error: string }) => void) => () => void;
  onClipboardUrl: (callback: (url: string) => void) => () => void;
  onBatchImportUrls: (callback: (urls: string[]) => void) => () => void;

  selectDirectory: () => Promise<string | null>;
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;

  // Premium features
  downloadWithOptions: (options: Record<string, unknown>) => Promise<DownloadItem>;
  pauseAllDownloads: () => Promise<{ success: boolean }>;
  resumeAllDownloads: () => Promise<{ success: boolean }>;
  getAllDownloads: () => Promise<DownloadItem[]>;
  retryFailedDownloads: () => Promise<{ success: boolean }>;
  openDownloadsFolder: () => Promise<void>;
  forceSync: () => Promise<{ success: boolean }>;
  restoreSync: () => Promise<{ success: boolean }>;
  isMaximized: () => Promise<boolean>;

  // Menu events
  onMenuNewDownload: (callback: () => void) => () => void;
  onMenuOpenSettings: (callback: () => void) => () => void;
  onMenuNavigate: (callback: (path: string) => void) => () => void;
  onMenuPauseAll: (callback: () => void) => () => void;
  onMenuResumeAll: (callback: () => void) => () => void;
  onMenuClearCompleted: (callback: () => void) => () => void;
  onMenuToggleClipboard: (callback: (enabled: boolean) => void) => () => void;
  onMenuCheckUpdates: (callback: () => void) => () => void;
  showAppMenu: () => Promise<void>;
  getAppPath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: Api;
    api: Api;
    electron: ElectronAPI;
  }
}

export {};