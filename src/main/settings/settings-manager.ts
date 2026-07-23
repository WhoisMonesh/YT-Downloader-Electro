import Store from "electron-store";
import { app } from "electron";
import { join } from "path";
import { Logger } from "../../shared/logger";
import type { AppSettings, DownloadProfile, WatchFolderConfig, UrlPatternRule, RssFeedConfig, CloudSyncConfig, BotConfig, PortableConfig, ThemeConfig } from "../../shared/types";

const logger = new Logger("settings");

const DEFAULT_PROFILES: DownloadProfile[] = [
  {
    id: "default",
    name: "Default (Best Video)",
    outputFormat: "mp4",
    quality: "best",
    audioQuality: "320kbps",
    includeSubtitles: false,
    subtitleLanguages: ["en"],
    includeThumbnail: true,
    embedThumbnail: true,
    embedMetadata: true,
    embedChapters: true,
    sponsorBlockRemove: ["sponsor", "intro", "outro", "selfpromo"],
    videoCodec: "h264",
    audioCodec: "aac",
    filenameTemplate: "{title} [{quality}].{ext}",
    postProcessors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "audio-only",
    name: "Audio Only (MP3 320k)",
    outputFormat: "mp3",
    quality: "worst",
    audioQuality: "320kbps",
    includeSubtitles: false,
    subtitleLanguages: [],
    includeThumbnail: true,
    embedThumbnail: true,
    embedMetadata: true,
    embedChapters: false,
    sponsorBlockRemove: ["sponsor"],
    videoCodec: "",
    audioCodec: "libmp3lame",
    filenameTemplate: "{title}.{ext}",
    postProcessors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "archive",
    name: "Archive Quality (4K MKV)",
    outputFormat: "mkv",
    quality: "4320p",
    audioQuality: "320kbps",
    includeSubtitles: true,
    subtitleLanguages: ["en"],
    includeThumbnail: true,
    embedThumbnail: true,
    embedMetadata: true,
    embedChapters: true,
    sponsorBlockRemove: ["sponsor", "intro", "outro", "selfpromo", "filler"],
    videoCodec: "h265",
    audioCodec: "flac",
    filenameTemplate: "{title} [{quality}][{format}].{ext}",
    postProcessors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SPEED_LIMIT_SCHEDULE = {
  enabled: false,
  rules: [],
};

const DEFAULT_WATCH_FOLDERS: WatchFolderConfig[] = [];

const DEFAULT_URL_RULES: UrlPatternRule[] = [];

const DEFAULT_RSS_FEEDS: RssFeedConfig[] = [];

const DEFAULT_CLOUD_SYNC: CloudSyncConfig = {
  provider: "webdav",
  enabled: false,
  syncIntervalMinutes: 60,
  syncDownloads: true,
  syncHistory: true,
  syncSettings: false,
};

const DEFAULT_BOTS: BotConfig = {};

const DEFAULT_PORTABLE: PortableConfig = {
  enabled: false,
};

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  name: "Default Dark",
  colors: {
    primary: "#0ea5e9",
    secondary: "#1e293b",
    accent: "#22d3ee",
    background: "#0f0f1a",
    surface: "#181825",
    text: "#cdd6f4",
    textSecondary: "#a6adc8",
    border: "#313244",
    success: "#a6e3a1",
    warning: "#f9e2af",
    error: "#f38ba8",
  },
  spacing: 8,
  borderRadius: 12,
  fontFamily: "Inter, system-ui, sans-serif",
  compactMode: false,
  animationsEnabled: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "en",
  downloadFolder: join(app.getPath("downloads"), "UniversalMediaDownloader"),
  concurrentDownloads: 3,
  maxSpeed: 0,
  proxy: {
    type: "none",
    host: "",
    port: 0,
  },
  proxyType: "none",
  cookieFile: "",
  ffmpegPath: "",
  ytDlpPath: "",
  autoUpdate: true,
  hardwareAcceleration: true,
  autoResume: true,
  defaultFormat: "mp4",
  defaultQuality: "best",
  defaultAudioQuality: "320kbps",
  filenameTemplate: "{title} [{quality}].{ext}",
  customUserAgent: "",
  referer: "",
  clipboardMonitoring: false,
  showNotifications: true,
  showPopup: true,
  oneClickDownload: false,
  sleepAfterComplete: false,
  shutdownAfterComplete: false,
  compactMode: false,
  animationsEnabled: true,
  sidebarCollapsed: false,
  maxHistoryItems: 1000,
  autoCleanupTemp: true,
  portableMode: false,

  // Premium features
  profiles: DEFAULT_PROFILES,
  activeProfileId: "default",
  speedLimitMode: "unlimited",
  speedLimitSchedule: DEFAULT_SPEED_LIMIT_SCHEDULE,
  sponsorBlockEnabled: true,
  sponsorBlockCategories: ["sponsor", "intro", "outro", "selfpromo"],
  defaultSubtitleLanguages: ["en"],
  embedThumbnail: true,
  embedMetadata: true,
  embedChapters: true,
  subtitleFormat: "srt",
  translationEnabled: false,
  translationTargetLang: "en",
  watchFolders: DEFAULT_WATCH_FOLDERS,
  urlRules: DEFAULT_URL_RULES,
  rssFeeds: DEFAULT_RSS_FEEDS,
  cloudSync: DEFAULT_CLOUD_SYNC,
  bots: DEFAULT_BOTS,
  portable: DEFAULT_PORTABLE,
  duplicateDetection: { enabled: true, checkHash: true, checkFilename: true },
  healthMonitor: { enabled: true, checkIntervalMinutes: 5, autoRetry: true, maxRetries: 3 },
  themeConfig: DEFAULT_THEME_CONFIG,
  analytics: { enabled: true, retentionDays: 90 },
  aria2c: { enabled: false, path: "aria2c", maxConnections: 16, split: 16, minSplitSize: "1M" },
};

export class SettingsManager {
  private store: Store<AppSettings> | null = null;

  async initialize(): Promise<void> {
    this.store = new Store<AppSettings>({
      name: "settings",
      defaults: DEFAULT_SETTINGS,
      cwd: app.getPath("userData"),
    });
    logger.info("Settings loaded");
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    if (!this.store) throw new Error("Settings not initialized");
    return this.store.get(key);
  }

  getAll(): AppSettings {
    if (!this.store) throw new Error("Settings not initialized");
    return this.store.store;
  }

  update(partial: Partial<AppSettings>): void {
    if (!this.store) throw new Error("Settings not initialized");
    for (const [key, value] of Object.entries(partial)) {
      this.store.set(key as keyof AppSettings, value as never);
    }
    logger.info("Settings updated");
  }
}