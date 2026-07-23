import { create } from "zustand";
import type { DownloadItem, AppSettings, DownloadProgress, MediaInfo } from "@shared/types";

interface AppStore {
  downloads: DownloadItem[];
  progress: Map<string, DownloadProgress>;
  settings: AppSettings | null;
  isAnalyzing: boolean;
  analyzedMedia: MediaInfo | null;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  status: string;
  isOnline: boolean;

  setDownloads: (downloads: DownloadItem[]) => void;
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  setProgress: (id: string, progress: DownloadProgress) => void;
  setSettings: (settings: AppSettings) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalyzedMedia: (media: MediaInfo | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setStatus: (status: string) => void;
  setOnline: (online: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  downloads: [],
  progress: new Map(),
  settings: null,
  isAnalyzing: false,
  analyzedMedia: null,
  sidebarCollapsed: false,
  theme: "dark",
  status: "Ready",
  isOnline: navigator.onLine,

  setDownloads: (downloads) => set({ downloads }),
  addDownload: (item) =>
    set((state) => ({ downloads: [...state.downloads, item] })),
  updateDownload: (id, updates) =>
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    })),
  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    })),
  setProgress: (id, progress) =>
    set((state) => {
      const newProgress = new Map(state.progress);
      newProgress.set(id, progress);
      return { progress: newProgress };
    }),
  setSettings: (settings) => set({ settings }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalyzedMedia: (analyzedMedia) => set({ analyzedMedia }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setStatus: (status) => set({ status }),
  setOnline: (isOnline) => set({ isOnline }),
}));
