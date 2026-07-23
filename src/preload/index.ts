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

  moveDownloadUp: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.MOVE_DOWNLOAD_UP, id),

  moveDownloadDown: (id: string): Promise<void> =>
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

  onConversionProgress: (callback: (progress: ConversionTask) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ConversionTask) =>
      callback(progress);
    ipcRenderer.on(IPC_CHANNELS.CONVERSION_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_PROGRESS, handler);
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
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
