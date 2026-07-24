import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
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
} from "../shared/types";

const electronAPI = {
  analyzeUrl: (url: string): Promise<MediaInfo> =>
    ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_URL, url),

  analyzePlaylist: (url: string): Promise<MediaInfo> =>
    ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_PLAYLIST, url),

  startDownload: (item: Partial<DownloadItem>): Promise<DownloadItem> =>
    ipcRenderer.invoke(IPC_CHANNELS.START_DOWNLOAD, item),

  pauseDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.PAUSE_DOWNLOAD, id),

  resumeDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RESUME_DOWNLOAD, id),

  cancelDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CANCEL_DOWNLOAD, id),

  retryDownload: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RETRY_DOWNLOAD, id),

  getDownloads: (): Promise<DownloadItem[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DOWNLOADS),

  moveDownloadUp: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.MOVE_DOWNLOAD_UP, id),

  moveDownloadDown: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.MOVE_DOWNLOAD_DOWN, id),

  reorderQueue: (ids: string[]): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.REORDER_QUEUE, ids),

  getQueueStatus: (): Promise<{ active: number; waiting: number; paused: number }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_QUEUE_STATUS),

  clearQueue: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_QUEUE),

  clearCompleted: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_COMPLETED),

  clearFailed: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_FAILED),

  convertFile: (task: Partial<ConversionTask>): Promise<ConversionTask> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONVERT_FILE, task),

  getConversions: (): Promise<ConversionTask[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CONVERSIONS),

  cancelConversion: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CANCEL_CONVERSION, id),

  getHistory: (search?: string, filter?: string): Promise<HistoryEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY, search, filter),

  deleteHistory: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_HISTORY, id),

  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),

  exportHistory: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_HISTORY),

  redownload: (id: string): Promise<DownloadItem> =>
    ipcRenderer.invoke(IPC_CHANNELS.REDOWNLOAD, id),

  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  updateSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, settings),

  getFfmpegStatus: (): Promise<{ available: boolean; path: string; version: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_FFMPEG_STATUS),

  setFfmpegPath: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_FFMPEG_PATH, path),

  downloadFfmpeg: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_FFMPEG),

  getNetworkStatus: (): Promise<NetworkStatus> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_NETWORK_STATUS),

  getVersion: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_VERSION),

  checkForUpdates: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECK_FOR_UPDATES),

  getAnalytics: (): Promise<Analytics> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_ANALYTICS),

  openFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_FOLDER, path),

  openFile: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE, path),

  revealInExplorer: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.REVEAL_IN_EXPLORER, path),

  getDiskSpace: (): Promise<{ total: number; free: number; used: number }> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DISK_SPACE),

  getScheduledTasks: (): Promise<SchedulerTask[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SCHEDULED_TASKS),

  addScheduledTask: (task: Partial<SchedulerTask>): Promise<SchedulerTask> =>
    ipcRenderer.invoke(IPC_CHANNELS.ADD_SCHEDULED_TASK, task),

  updateScheduledTask: (id: string, task: Partial<SchedulerTask>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SCHEDULED_TASK, id, task),

  deleteScheduledTask: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_SCHEDULED_TASK, id),

  toggleSchedule: (id: string): Promise<void> =>
    ipcRenderer.invoke("toggle-schedule", id),

  runScheduledTaskNow: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RUN_SCHEDULED_TASK_NOW, id),

  getQueueInfo: (): Promise<{ queued: DownloadItem[]; queueCount: number; activeCount: number }> =>
    ipcRenderer.invoke("get-queue-info"),

  getLogs: (category?: string, level?: string): Promise<LogEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_LOGS, category, level),

  exportLogs: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_LOGS),

  batchImport: (urls: string[]): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.BATCH_IMPORT, urls),

  batchExport: (ids: string[]): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.BATCH_EXPORT, ids),

  minimizeWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.MINIMIZE_WINDOW),

  maximizeWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.MAXIMIZE_WINDOW),

  closeWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLOSE_WINDOW),

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),

  selectFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_FILE, filters),

  onDownloadProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) =>
      callback(progress);
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, handler);
  },

  onDownloadCompleted: (callback: (item: DownloadItem) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, item: DownloadItem) => callback(item);
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_COMPLETED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_COMPLETED, handler);
  },

  onDownloadFailed: (callback: (item: DownloadItem) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, item: DownloadItem) => callback(item);
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_FAILED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_FAILED, handler);
  },

  onConversionProgress: (callback: (progress: { id: string; progress: number }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: { id: string; progress: number }) =>
      callback(progress);
    ipcRenderer.on(IPC_CHANNELS.CONVERSION_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_PROGRESS, handler);
  },

  onConversionCompleted: (callback: (data: { id: string; outputPath: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { id: string; outputPath: string }) =>
      callback(data);
    ipcRenderer.on(IPC_CHANNELS.CONVERSION_COMPLETED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_COMPLETED, handler);
  },

  onConversionFailed: (callback: (data: { id: string; error: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { id: string; error: string }) =>
      callback(data);
    ipcRenderer.on(IPC_CHANNELS.CONVERSION_FAILED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_FAILED, handler);
  },

  onClipboardUrl: (callback: (url: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) => callback(url);
    ipcRenderer.on(IPC_CHANNELS.CLIPBOARD_URL, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CLIPBOARD_URL, handler);
  },

  onNotificationClicked: (callback: (data: { downloadId: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { downloadId: string }) =>
      callback(data);
    ipcRenderer.on(IPC_CHANNELS.NOTIFICATION_CLICKED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION_CLICKED, handler);
  },

  // Additional methods for premium features
  downloadWithOptions: (options: Record<string, unknown>): Promise<DownloadItem> =>
    ipcRenderer.invoke("download-with-options", options),

  pauseAllDownloads: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("pause-all-downloads"),

  resumeAllDownloads: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("resume-all-downloads"),

  getAllDownloads: (): Promise<DownloadItem[]> =>
    ipcRenderer.invoke("get-all-downloads"),

  retryFailedDownloads: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("retry-failed-downloads"),

  openDownloadsFolder: (): Promise<void> =>
    ipcRenderer.invoke("open-downloads-folder"),

  isMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.IS_MAXIMIZED),

  onMenuNewDownload: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-new-download", handler);
    return () => ipcRenderer.removeListener("menu-new-download", handler);
  },

  onMenuOpenSettings: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-open-settings", handler);
    return () => ipcRenderer.removeListener("menu-open-settings", handler);
  },

  onMenuNavigate: (callback: (path: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on("menu-navigate", handler);
    return () => ipcRenderer.removeListener("menu-navigate", handler);
  },

  onMenuPauseAll: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-pause-all", handler);
    return () => ipcRenderer.removeListener("menu-pause-all", handler);
  },

  onMenuResumeAll: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-resume-all", handler);
    return () => ipcRenderer.removeListener("menu-resume-all", handler);
  },

  onMenuClearCompleted: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-clear-completed", handler);
    return () => ipcRenderer.removeListener("menu-clear-completed", handler);
  },

  onMenuToggleClipboard: (callback: (enabled: boolean) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, enabled: boolean) => callback(enabled);
    ipcRenderer.on("menu-toggle-clipboard", handler);
    return () => ipcRenderer.removeListener("menu-toggle-clipboard", handler);
  },

  onMenuCheckUpdates: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on("menu-check-updates", handler);
    return () => ipcRenderer.removeListener("menu-check-updates", handler);
  },

  showAppMenu: (): Promise<void> =>
    ipcRenderer.invoke("show-app-menu"),

  getAppPath: (): Promise<string> =>
    ipcRenderer.invoke("get-app-path"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
