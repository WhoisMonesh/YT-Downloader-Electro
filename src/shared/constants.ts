export const IPC_CHANNELS = {
  // Analyzer
  ANALYZE_URL: 'analyze-url',
  ANALYZE_PLAYLIST: 'analyze-playlist',

  // Downloads
  START_DOWNLOAD: 'start-download',
  PAUSE_DOWNLOAD: 'pause-download',
  RESUME_DOWNLOAD: 'resume-download',
  CANCEL_DOWNLOAD: 'cancel-download',
  RETRY_DOWNLOAD: 'retry-download',
  GET_DOWNLOADS: 'get-downloads',
  MOVE_DOWNLOAD_UP: 'move-download-up',
  MOVE_DOWNLOAD_DOWN: 'move-download-down',

  // Queue
  REORDER_QUEUE: 'reorder-queue',
  GET_QUEUE_STATUS: 'get-queue-status',
  CLEAR_QUEUE: 'clear-queue',
  CLEAR_COMPLETED: 'clear-completed',
  CLEAR_FAILED: 'clear-failed',

  // Converter
  CONVERT_FILE: 'convert-file',
  GET_CONVERSIONS: 'get-conversions',
  CANCEL_CONVERSION: 'cancel-conversion',

  // History
  GET_HISTORY: 'get-history',
  DELETE_HISTORY: 'delete-history',
  CLEAR_HISTORY: 'clear-history',
  EXPORT_HISTORY: 'export-history',
  REDOWNLOAD: 'redownload',

  // Settings
  GET_SETTINGS: 'get-settings',
  UPDATE_SETTINGS: 'update-settings',

  // FFmpeg
  GET_FFMPEG_STATUS: 'get-ffmpeg-status',
  SET_FFMPEG_PATH: 'set-ffmpeg-path',
  DOWNLOAD_FFMPEG: 'download-ffmpeg',

  // Network
  GET_NETWORK_STATUS: 'get-network-status',

  // App
  GET_VERSION: 'get-version',

  // Updater
  CHECK_FOR_UPDATES: 'check-for-updates',

  // Analytics
  GET_ANALYTICS: 'get-analytics',

  // Shell
  OPEN_FOLDER: 'open-folder',
  OPEN_FILE: 'open-file',
  REVEAL_IN_EXPLORER: 'reveal-in-explorer',
  GET_DISK_SPACE: 'get-disk-space',
  SELECT_DIRECTORY: 'select-directory',
  SELECT_FILE: 'select-file',

  // Scheduler
  GET_SCHEDULED_TASKS: 'get-scheduled-tasks',
  ADD_SCHEDULED_TASK: 'add-scheduled-task',
  UPDATE_SCHEDULED_TASK: 'update-scheduled-task',
  DELETE_SCHEDULED_TASK: 'delete-scheduled-task',

  // Logs
  GET_LOGS: 'get-logs',
  EXPORT_LOGS: 'export-logs',

  // Batch
  BATCH_IMPORT: 'batch-import',
  BATCH_EXPORT: 'batch-export',

  // Window
  MINIMIZE_WINDOW: 'minimize-window',
  MAXIMIZE_WINDOW: 'maximize-window',
  CLOSE_WINDOW: 'close-window',

  // Events (ipcRenderer.on)
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETED: 'download-completed',
  DOWNLOAD_FAILED: 'download-failed',
  CONVERSION_PROGRESS: 'conversion-progress',
  CLIPBOARD_URL: 'clipboard-url',
  NOTIFICATION_CLICKED: 'notification-clicked',
} as const;

export const VIDEO_FORMATS: readonly string[] = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv'];

export const AUDIO_FORMATS: readonly string[] = ['mp3', 'flac', 'aac', 'ogg', 'wav', 'opus'];

export const VIDEO_QUALITIES: readonly { value: string; label: string }[] = [
  { value: 'best', label: 'Best Quality' },
  { value: '4320p', label: '8K (4320p)' },
  { value: '2160p', label: '4K (2160p)' },
  { value: '1440p', label: '2K (1440p)' },
  { value: '1080p', label: 'Full HD (1080p)' },
  { value: '720p', label: 'HD (720p)' },
  { value: '480p', label: 'SD (480p)' },
  { value: '360p', label: 'Low (360p)' },
  { value: 'worst', label: 'Worst Quality' },
];
