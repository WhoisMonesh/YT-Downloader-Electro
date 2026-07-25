export type DownloadStatus =
  | "waiting"
  | "downloading"
  | "merging"
  | "converting"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused"
  | "checking"
  | "hashing";

export type MediaType = "video" | "audio" | "playlist" | "channel" | "shorts" | "live";

export type OutputFormat =
  | "mp4" | "mkv" | "avi" | "mov" | "webm" | "flv" | "mpeg" | "ts" | "m4v"
  | "mp3" | "aac" | "flac" | "ogg" | "m4a" | "wav" | "opus" | "alac";

export type VideoQuality =
  | "best" | "worst" | "4320p" | "2160p" | "1440p" | "1080p"
  | "720p" | "480p" | "360p" | "240p" | "144p";

export type AudioQuality =
  | "320kbps" | "256kbps" | "192kbps" | "160kbps"
  | "128kbps" | "96kbps" | "64kbps";

export type Priority = "high" | "normal" | "low";

export type ProxyType = "socks5" | "http" | "https" | "none";

export type Theme = "dark" | "light" | "auto";

export type Language =
  | "en" | "es" | "fr" | "de" | "ja" | "ko" | "zh" | "pt" | "ru" | "ar";

export type NotificationType =
  | "download_started"
  | "download_completed"
  | "download_failed"
  | "playlist_completed"
  | "conversion_completed"
  | "update_available";

export type SchedulerAction = "shutdown" | "sleep" | "hibernate" | "none";

export type SpeedLimitMode = "off" | "schedule" | "constant" | "unlimited";

export type SpeedLimitSchedule = {
  enabled: boolean;
  rules: {
    days: number[];
    startTime: string;
    endTime: string;
    maxSpeedBytes: number;
  }[];
};

export type SponsorBlockCategory =
  | "sponsor"
  | "intro"
  | "outro"
  | "selfpromo"
  | "preview"
  | "filler"
  | "interaction"
  | "music_offtopic"
  | "poi_highlight"
  | "all";

export type DownloadProfile = {
  id: string;
  name: string;
  outputFormat: OutputFormat;
  quality: VideoQuality;
  audioQuality: AudioQuality;
  includeSubtitles: boolean;
  subtitleLanguages: string[];
  includeThumbnail: boolean;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  embedChapters: boolean;
  sponsorBlockRemove: SponsorBlockCategory[];
  postProcessors: string[];
  ffmpegArgs?: string;
  filenameTemplate?: string;
  videoCodec?: string;
  audioCodec?: string;
  createdAt: string;
  updatedAt: string;
};

export type UrlPatternRule = {
  id: string;
  name: string;
  pattern: string;
  priority: number;
  enabled: boolean;
  outputFormat?: OutputFormat;
  quality?: VideoQuality;
  audioQuality?: AudioQuality;
  includeSubtitles?: boolean;
  subtitleLanguages?: string[];
  proxy?: { type: ProxyType; host: string; port: number };
  profileId?: string;
};

export type WatchFolderConfig = {
  id: string;
  path: string;
  recursive: boolean;
  enabled: boolean;
  filePatterns: string[];
  defaultProfileId?: string;
  autoStart: boolean;
};

export type RssFeedConfig = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  checkIntervalMinutes: number;
  profileId?: string;
  maxItemsPerCheck: number;
  filters: RssFilter[];
  lastChecked?: string;
  lastItemGuid?: string;
};

export type RssFilter = {
  field: "title" | "description" | "author" | "category";
  operator: "contains" | "regex" | "equals" | "startsWith" | "endsWith";
  value: string;
  exclude: boolean;
};

export type CloudSyncConfig = {
  provider: "webdav" | "s3" | "rclone" | "nextcloud";
  enabled: boolean;
  syncIntervalMinutes: number;
  syncDownloads: boolean;
  syncHistory: boolean;
  syncSettings: boolean;
  webdav?: { url: string; username: string; password: string };
  s3?: { endpoint: string; bucket: string; region: string; accessKey: string; secretKey: string };
  rclone?: { remote: string; configPath: string };
};

export type BotConfig = {
  discord?: { token: string; channelId: string; enabled: boolean };
  telegram?: { token: string; chatId: string; enabled: boolean };
};

export type PortableConfig = {
  enabled: boolean;
  dataPath?: string;
};

export type Aria2cConfig = {
  enabled: boolean;
  path: string;
  maxConnections: number;
  split: number;
  minSplitSize: string;
};

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  existingEntry?: HistoryEntry;
  hashMatch?: boolean;
  filenameMatch?: boolean;
};

export type HealthCheckResult = {
  downloadId: string;
  healthy: boolean;
  issues: string[];
  canResume: boolean;
  resumeOffset?: number;
};

export type ThemeConfig = {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: number;
  borderRadius: number;
  fontFamily: string;
  compactMode: boolean;
  animationsEnabled: boolean;
};

export type AnalyticsData = {
  totalDownloads: number;
  downloadedSize: number;
  averageSpeed: number;
  mostUsedFormat: string;
  mostDownloadedChannel: string;
  downloadsByFormat: Record<string, number>;
  downloadsByQuality: Record<string, number>;
  downloadsByChannel: Record<string, number>;
  speedHistory: { timestamp: string; speed: number }[];
  dailyDownloads: { date: string; count: number; size: number }[];
};

export interface MediaFormat {
  formatId: string;
  extension: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  fileSize?: number;
  bitrate?: number;
  quality?: string;
  type: "video" | "audio" | "video+audio";
}

export interface MediaInfo {
  url: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  channel: string;
  channelId?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  formats: MediaFormat[];
  chapters?: MediaChapter[];
  tags?: string[];
  type: MediaType;
  isLive?: boolean;
  playlist?: PlaylistInfo;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoCount: number;
  videos: PlaylistVideo[];
  totalDuration?: number;
}

export interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  url: string;
  selected: boolean;
}

export interface MediaChapter {
  title: string;
  startTime: number;
  endTime: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
  outputPath: string;
  outputFormat: OutputFormat;
  quality: VideoQuality;
  audioQuality: AudioQuality;
  status: DownloadStatus;
  progress: number;
  speed: number;
  eta: number;
  downloadedSize: number;
  totalSize: number;
  fileSize?: number;
  peers?: number;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  error?: string;
  isPlaylist: boolean;
  playlistId?: string;
  customFilename?: string;
  startTime?: string;
  endTime?: string;
  normalizeAudio?: boolean;
  retries: number;
  maxRetries: number;
  metadata?: DownloadMetadata;
  postAction?: SchedulerAction;
}

export interface DownloadMetadata {
  title?: string;
  description?: string;
  channel?: string;
  artist?: string;
  album?: string;
  year?: string;
  tags?: string[];
  thumbnail?: string;
  comments?: boolean;
  subtitles?: boolean;
  chapters?: boolean;
  uploadDate?: string;
  duration?: number;
  resolution?: string;
  codec?: string;
  bitrate?: string;
  fps?: number;
}

export interface ConversionTask {
  id: string;
  inputPath: string;
  outputPath: string;
  outputFormat: OutputFormat;
  status: DownloadStatus;
  progress: number;
  createdAt: string;
  options?: ConversionOptions;
}

export interface ConversionOptions {
  inputPath?: string;
  outputPath?: string;
  outputFormat?: OutputFormat;
  videoToAudio?: boolean;
  audioToVideo?: boolean;
  mergeVideoAudio?: boolean;
  extractAudio?: boolean;
  extractThumbnail?: boolean;
  trim?: { start: number; end: number };
  trimStart?: number;
  trimEnd?: number;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  resize?: { width: number; height: number };
  resolution?: string;
  fps?: number;
  compress?: { quality: number };
  watermark?: { path: string; position: string; opacity: number };
  subtitleBurn?: { path: string };
  subtitleExtract?: { format: "srt" | "vtt" | "ass" };
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  burnSubtitles?: boolean;
  subtitlePath?: string;
}

export interface SchedulerTask {
  id: string;
  name: string;
  url: string;
  scheduleType?: "cron" | "once";
  datetime?: string;
  cronExpression: string;
  outputFormat: OutputFormat;
  quality: VideoQuality;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  action: SchedulerAction;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  downloadId: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: string;
  duration: number;
  outputPath: string;
  outputFormat: OutputFormat;
  fileSize: number;
  downloadedAt: string;
  type: MediaType;
}

export type SubtitleFormat = "srt" | "vtt" | "ass" | "ttml";

export interface AppSettings {
  theme: Theme;
  language: Language;
  downloadFolder: string;
  concurrentDownloads: number;
  downloadDelay: number;
  maxSpeed: number;
  useBrowserCookies: string | null;
  useAria2c: boolean;
  watchFolder: string | null;
  proxy: { type: ProxyType; host: string; port: number; username?: string; password?: string };
  proxyType: ProxyType;
  cookieFile: string;
  ffmpegPath: string;
  ytDlpPath: string;
  autoUpdate: boolean;
  hardwareAcceleration: boolean;
  autoResume: boolean;
  defaultFormat: OutputFormat;
  defaultQuality: VideoQuality;
  defaultAudioQuality: AudioQuality;
  filenameTemplate: string;
  customHeaders?: Record<string, string>;
  customUserAgent: string;
  userAgent?: string;
  referer: string;
  clipboardMonitoring: boolean;
  showNotifications: boolean;
  showPopup: boolean;
  oneClickDownload: boolean;
  sleepAfterComplete: boolean;
  shutdownAfterComplete: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  sidebarCollapsed: boolean;
  maxHistoryItems: number;
  autoCleanupTemp: boolean;
  portableMode: boolean;

  // Premium features
  profiles: DownloadProfile[];
  activeProfileId?: string;
  speedLimitMode: SpeedLimitMode;
  speedLimitSchedule: SpeedLimitSchedule;
  sponsorBlockEnabled: boolean;
  sponsorBlockCategories: SponsorBlockCategory[];
  defaultSubtitleLanguages: string[];
  embedThumbnail: boolean;
  embedMetadata: boolean;
  embedChapters: boolean;
  subtitleFormat: SubtitleFormat;
  translationEnabled: boolean;
  translationTargetLang: string;
  watchFolders: WatchFolderConfig[];
  urlRules: UrlPatternRule[];
  rssFeeds: RssFeedConfig[];
  cloudSync: CloudSyncConfig;
  bots: BotConfig;
  portable: PortableConfig;
  duplicateDetection: { enabled: boolean; checkHash: boolean; checkFilename: boolean };
  healthMonitor: { enabled: boolean; checkIntervalMinutes: number; autoRetry: boolean; maxRetries: number };
  themeConfig: ThemeConfig;
  analytics: { enabled: boolean; retentionDays: number };
  aria2c: { enabled: boolean; path: string; maxConnections: number; split: number; minSplitSize: string };
}

export interface DownloadProgress {
  downloadId: string;
  status: DownloadStatus;
  progress: number;
  speed: number;
  eta: number;
  downloadedSize: number;
  totalSize: number;
  currentPhase?: string;
  percent?: number;
  downloaded?: number;
  total?: number;
  stage?: string;
}

export interface NetworkStatus {
  online: boolean;
  speed: number;
}

export interface Analytics {
  totalDownloads: number;
  downloadedSize: number;
  averageSpeed: number;
  mostUsedFormat: string;
  mostDownloadedChannel: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  category: "app" | "download" | "ffmpeg" | "error";
  message: string;
  details?: string;
}

export interface BatchImportItem {
  url: string;
  outputFormat?: OutputFormat;
  quality?: VideoQuality;
}

export interface DownloadOptions {
  url: string;
  formatId?: string;
  audioOnly?: boolean;
  outputFormat?: OutputFormat;
  quality?: VideoQuality;
  audioQuality?: AudioQuality;
  includeSubtitles?: boolean;
  subtitleLanguages?: string[];
  includeThumbnail?: boolean;
  includeMetadata?: boolean;
  cookies?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  mediaInfo?: MediaInfo;
  outputPath?: string;
}

export interface QueueItem {
  id: string;
  downloadOptions: DownloadOptions;
  status: 'waiting' | 'downloading' | 'completed' | 'failed';
  priority: number;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  urls: string[];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string;
  days?: number[];
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

export interface ScheduleOptions {
  name: string;
  urls: string[];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string;
  days?: number[];
  enabled: boolean;
}

export interface ConversionProgress {
  id: string;
  percent: number;
  speed: string;
  time: string;
  fps: number;
  status: string;
}

export interface FfmpegStatus {
  available: boolean;
  path: string;
  version: string;
  hardwareEncoding: {
    nvenc: boolean;
    quicksync: boolean;
    amf: boolean;
    vaapi: boolean;
    cpu: boolean;
  };
}

// --- New types added in the v0.2 overhaul ---

export interface Subscription {
  id: string;
  channelId: string;
  channelName: string;
  channelUrl: string;
  enabled: boolean;
  checkIntervalMinutes: number;
  lastChecked?: string;
  lastVideoId?: string;
  profileId?: string;
  createdAt: string;
}

export interface ConversionPreset {
  id: string;
  name: string;
  outputFormat: OutputFormat;
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  fps?: number;
  trim?: { start: number; end: number };
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  watermark?: { path: string; position: string; opacity: number };
  createdAt: string;
}

export interface Hotkey {
  id: string;
  accelerator: string;
  action: string;
  label: string;
  scope: "global" | "app";
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  path: string;
  manifest: Record<string, unknown>;
}

export interface ToastEvent {
  level: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  durationMs?: number;
  downloadId?: string;
}

export interface ScheduleFiredEvent {
  taskId: string;
  startedAt: string;
}

export interface BackupBundle {
  version: string;
  exportedAt: string;
  settings: AppSettings;
  history: HistoryEntry[];
  schedules: SchedulerTask[];
  conversionPresets: ConversionPreset[];
  subscriptions: Subscription[];
  hotkeys: Hotkey[];
}

export interface DownloadRow {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
  status: DownloadStatus;
  progress_percent: number;
  progress_speed: number;
  progress_eta: number;
  progress_downloaded: number;
  progress_total: number;
  progress_stage: string;
  output_path: string;
  format: string;
  quality: string;
  audio_quality: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  error: string | null;
  retry_count: number;
  priority: number;
  output_format: string;
  is_playlist: number;
  playlist_id: string | null;
}

export interface ConversionRow {
  id: string;
  input_path: string;
  output_path: string;
  output_format: string;
  status: DownloadStatus;
  progress: number;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  options: string; // JSON
}
