export const IPC_CHANNELS = {
  // Analyzer
  ANALYZE_URL: "analyze-url",
  ANALYZE_PLAYLIST: "analyze-playlist",

  // Downloads
  START_DOWNLOAD: "start-download",
  PAUSE_DOWNLOAD: "pause-download",
  RESUME_DOWNLOAD: "resume-download",
  CANCEL_DOWNLOAD: "cancel-download",
  RETRY_DOWNLOAD: "retry-download",
  GET_DOWNLOADS: "get-downloads",
  MOVE_DOWNLOAD_UP: "move-download-up",
  MOVE_DOWNLOAD_DOWN: "move-download-down",
  CLEAR_COMPLETED: "clear-completed",
  CLEAR_FAILED: "clear-failed",

  // Queue
  REORDER_QUEUE: "reorder-queue",
  GET_QUEUE_STATUS: "get-queue-status",
  CLEAR_QUEUE: "clear-queue",

  // Converter
  CONVERT_FILE: "convert-file",
  GET_CONVERSIONS: "get-conversions",
  CANCEL_CONVERSION: "cancel-conversion",

  // History
  GET_HISTORY: "get-history",
  DELETE_HISTORY: "delete-history",
  CLEAR_HISTORY: "clear-history",
  EXPORT_HISTORY: "export-history",
  REDOWNLOAD: "redownload",

  // Settings
  GET_SETTINGS: "get-settings",
  UPDATE_SETTINGS: "update-settings",
  ON_SETTINGS_CHANGED: "settings-changed",

  // FFmpeg
  GET_FFMPEG_STATUS: "get-ffmpeg-status",
  SET_FFMPEG_PATH: "set-ffmpeg-path",
  DOWNLOAD_FFMPEG: "download-ffmpeg",
  PROBE_FFMPEG_HW: "probe-ffmpeg-hw",

  // Network
  GET_NETWORK_STATUS: "get-network-status",
  RUN_SPEED_TEST: "run-speed-test",

  // App
  GET_VERSION: "get-version",
  QUIT_APP: "quit-app",
  HIDE_TO_TRAY: "hide-to-tray",

  // Updater
  CHECK_FOR_UPDATES: "check-for-updates",
  INSTALL_UPDATE: "install-update",

  // Analytics
  GET_ANALYTICS: "get-analytics",

  // Shell
  OPEN_FOLDER: "open-folder",
  OPEN_FILE: "open-file",
  REVEAL_IN_EXPLORER: "reveal-in-explorer",
  GET_DISK_SPACE: "get-disk-space",
  SELECT_DIRECTORY: "select-directory",
  SELECT_FILE: "select-file",

  // Scheduler
  GET_SCHEDULED_TASKS: "get-scheduled-tasks",
  ADD_SCHEDULED_TASK: "add-scheduled-task",
  UPDATE_SCHEDULED_TASK: "update-scheduled-task",
  DELETE_SCHEDULED_TASK: "delete-scheduled-task",
  RUN_SCHEDULED_TASK_NOW: "run-scheduled-task-now",

  // Logs
  GET_LOGS: "get-logs",
  EXPORT_LOGS: "export-logs",
  CLEAR_LOGS: "clear-logs",

  // Batch
  BATCH_IMPORT: "batch-import",
  BATCH_EXPORT: "batch-export",

  // Subscriptions
  GET_SUBSCRIPTIONS: "get-subscriptions",
  ADD_SUBSCRIPTION: "add-subscription",
  REMOVE_SUBSCRIPTION: "remove-subscription",
  CHECK_SUBSCRIPTIONS: "check-subscriptions",

  // Conversion presets
  GET_CONVERSION_PRESETS: "get-conversion-presets",
  SAVE_CONVERSION_PRESET: "save-conversion-preset",
  DELETE_CONVERSION_PRESET: "delete-conversion-preset",

  // Backup
  EXPORT_BACKUP: "export-backup",
  IMPORT_BACKUP: "import-backup",

  // Hotkeys
  GET_HOTKEYS: "get-hotkeys",
  SET_HOTKEY: "set-hotkey",

  // Plugins
  GET_PLUGINS: "get-plugins",
  TOGGLE_PLUGIN: "toggle-plugin",

  // Window
  MINIMIZE_WINDOW: "minimize-window",
  MAXIMIZE_WINDOW: "maximize-window",
  CLOSE_WINDOW: "close-window",
  IS_MAXIMIZED: "is-maximized",

  // Events (ipcRenderer.on)
  DOWNLOAD_PROGRESS: "download-progress",
  DOWNLOAD_COMPLETED: "download-completed",
  DOWNLOAD_FAILED: "download-failed",
  CONVERSION_PROGRESS: "conversion-progress",
  CONVERSION_COMPLETED: "conversion-completed",
  CONVERSION_FAILED: "conversion-failed",
  CLIPBOARD_URL: "clipboard-url",
  NOTIFICATION_CLICKED: "notification-clicked",
  UPDATE_AVAILABLE: "update-available",
  UPDATE_DOWNLOAD_PROGRESS: "update-download-progress",
  UPDATE_DOWNLOADED: "update-downloaded",
  WINDOW_MAXIMIZED: "window-maximized",
  WINDOW_UNMAXIMIZED: "window-unmaximized",
  SCHEDULE_FIRED: "schedule-fired",
  TOAST: "toast",
} as const;

export const VIDEO_FORMATS: readonly string[] = [
  "mp4",
  "mkv",
  "webm",
  "avi",
  "mov",
  "flv",
];

export const AUDIO_FORMATS: readonly string[] = [
  "mp3",
  "flac",
  "aac",
  "ogg",
  "wav",
  "opus",
  "m4a",
];

export const ALL_OUTPUT_FORMATS: readonly string[] = [
  ...VIDEO_FORMATS,
  ...AUDIO_FORMATS,
];

export const VIDEO_QUALITIES: readonly { value: string; label: string }[] = [
  { value: "best", label: "Best Quality" },
  { value: "4320p", label: "8K (4320p)" },
  { value: "2160p", label: "4K (2160p)" },
  { value: "1440p", label: "2K (1440p)" },
  { value: "1080p", label: "Full HD (1080p)" },
  { value: "720p", label: "HD (720p)" },
  { value: "480p", label: "SD (480p)" },
  { value: "360p", label: "Low (360p)" },
  { value: "240p", label: "Very Low (240p)" },
  { value: "144p", label: "Lowest (144p)" },
  { value: "worst", label: "Worst Quality" },
];

export const LANGUAGES: readonly { code: string; label: string; rtl?: boolean }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية", rtl: true },
];

export const SPONSOR_BLOCK_CATEGORIES = [
  { value: "sponsor", label: "Sponsor" },
  { value: "intro", label: "Intro" },
  { value: "outro", label: "Outro" },
  { value: "selfpromo", label: "Self Promotion" },
  { value: "preview", label: "Preview" },
  { value: "filler", label: "Filler" },
  { value: "interaction", label: "Interaction" },
  { value: "music_offtopic", label: "Music Off-Topic" },
  { value: "poi_highlight", label: "Point of Interest" },
] as const;

export const THEMES = [
  { id: "dark", name: "Default Dark", builtin: true },
  { id: "light", name: "Default Light", builtin: true },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", builtin: true },
  { id: "catppuccin-latte", name: "Catppuccin Latte", builtin: true },
  { id: "nord", name: "Nord", builtin: true },
  { id: "dracula", name: "Dracula", builtin: true },
  { id: "solarized-dark", name: "Solarized Dark", builtin: true },
  { id: "tokyo-night", name: "Tokyo Night", builtin: true },
] as const;
