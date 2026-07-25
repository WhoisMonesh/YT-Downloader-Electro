import { useCallback, useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import toast from "react-hot-toast";

const navItems = [
  { path: "/", label: "Home", icon: "home" },
  { path: "/torrent", label: "Torrent", icon: "torrent" },
  { path: "/downloads", label: "Downloads", icon: "download" },
  { path: "/playlist", label: "Playlist", icon: "playlist" },
  { path: "/queue", label: "Queue", icon: "queue" },
  { path: "/converter", label: "Converter", icon: "converter" },
  { path: "/scheduler", label: "Scheduler", icon: "scheduler" },
  { path: "/history", label: "History", icon: "history" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

interface FfmpegStatus {
  available: boolean;
  path: string;
  version: string;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [ffmpegStatus, setFfmpegStatus] = useState<FfmpegStatus>({ available: false, path: "", version: "" });
  const [diskSpace, setDiskSpace] = useState({ total: 0, free: 0, used: 0 });
  const [queueInfo, setQueueInfo] = useState({ activeCount: 0, queueCount: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    console.log("Layout mounted, electronAPI:", typeof window.electronAPI !== "undefined");
  }, []);

  useEffect(() => {

    // Get FFmpeg status
    if (window.electronAPI?.getFfmpegStatus) {
      window.electronAPI.getFfmpegStatus().then(setFfmpegStatus).catch(() => {});
    }

    // Get disk space
    if (window.electronAPI?.getDiskSpace) {
      window.electronAPI.getDiskSpace().then(setDiskSpace).catch(() => {});
    }

    // Get queue info
    if (window.electronAPI?.getQueueInfo) {
      window.electronAPI.getQueueInfo().then(setQueueInfo).catch(() => {});
    }

    // Set up live clock timer (1s)
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up disk & queue polling interval (10s)
    const pollInterval = setInterval(() => {
      if (window.electronAPI?.getDiskSpace) {
        window.electronAPI.getDiskSpace().then(setDiskSpace).catch(() => {});
      }
      if (window.electronAPI?.getQueueInfo) {
        window.electronAPI.getQueueInfo().then(setQueueInfo).catch(() => {});
      }
    }, 10000);

    // Setup menu event listeners
    let cleanupNewDownload: (() => void) | undefined;
    let cleanupOpenSettings: (() => void) | undefined;
    let cleanupNavigate: (() => void) | undefined;
    let cleanupPauseAll: (() => void) | undefined;
    let cleanupResumeAll: (() => void) | undefined;
    let cleanupClearCompleted: (() => void) | undefined;
    let cleanupCheckUpdates: (() => void) | undefined;
    let cleanupOpenDownloadsFolder: (() => void) | undefined;

    if (window.electronAPI?.onMenuNewDownload) {
      cleanupNewDownload = window.electronAPI.onMenuNewDownload(() => {
        navigate("/");
      });
    }

    if (window.electronAPI?.onMenuOpenSettings) {
      cleanupOpenSettings = window.electronAPI.onMenuOpenSettings(() => {
        navigate("/settings");
      });
    }

    if (window.electronAPI?.onMenuNavigate) {
      cleanupNavigate = window.electronAPI.onMenuNavigate((path) => {
        navigate(path);
      });
    }

    if (window.electronAPI?.onMenuPauseAll) {
      cleanupPauseAll = window.electronAPI.onMenuPauseAll(async () => {
        if (window.electronAPI?.pauseAllDownloads) {
          await window.electronAPI.pauseAllDownloads();
          toast.success("All downloads paused");
        }
      });
    }

    if (window.electronAPI?.onMenuResumeAll) {
      cleanupResumeAll = window.electronAPI.onMenuResumeAll(async () => {
        if (window.electronAPI?.resumeAllDownloads) {
          await window.electronAPI.resumeAllDownloads();
          toast.success("All downloads resumed");
        }
      });
    }

    if (window.electronAPI?.onMenuClearCompleted) {
      cleanupClearCompleted = window.electronAPI.onMenuClearCompleted(async () => {
        if (window.electronAPI?.clearCompleted) {
          await window.electronAPI.clearCompleted();
          toast.success("Completed downloads cleared");
        }
      });
    }

    if (window.electronAPI?.onMenuCheckUpdates) {
      cleanupCheckUpdates = window.electronAPI.onMenuCheckUpdates(async () => {
        if (window.electronAPI?.checkForUpdates) {
          await window.electronAPI.checkForUpdates();
          toast.success("Checking for updates...");
        }
      });
    }

    if (window.electronAPI?.onMenuNavigate) {
      cleanupOpenDownloadsFolder = window.electronAPI.onMenuNavigate((path) => {
        if (path === "/open-downloads-folder" && window.electronAPI?.openDownloadsFolder) {
          window.electronAPI.openDownloadsFolder();
        }
      });
    }

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      cleanupNewDownload?.();
      cleanupOpenSettings?.();
      cleanupNavigate?.();
      cleanupPauseAll?.();
      cleanupResumeAll?.();
      cleanupClearCompleted?.();
      cleanupCheckUpdates?.();
      cleanupOpenDownloadsFolder?.();
    };
  }, [navigate]);

  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = useCallback(() => window.electronAPI?.minimizeWindow?.(), []);
  const handleMaximize = useCallback(async () => {
    await window.electronAPI?.maximizeWindow?.();
    const maximized = await window.electronAPI?.isMaximized?.();
    setIsMaximized(maximized || false);
  }, []);
  const handleClose = useCallback(() => window.electronAPI?.closeWindow?.(), []);
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Calculate disk usage percentage
  const diskUsagePercent = diskSpace.total > 0
    ? ((diskSpace.total - diskSpace.free) / diskSpace.total) * 100
    : 0;

  return (
    <div className="h-screen flex flex-col bg-surface-100">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="flex items-center gap-2 no-drag">
          <button
            className="w-3 h-3 rounded-full bg-red hover:bg-red-400 transition-colors"
            onClick={handleClose}
            title="Close"
          />
          <button
            className="w-3 h-3 rounded-full bg-yellow hover:bg-yellow-400 transition-colors"
            onClick={handleMinimize}
            title="Minimize"
          />
          <button
            className="w-3 h-3 rounded-full bg-green hover:bg-green-400 transition-colors"
            onClick={handleMaximize}
            title="Maximize"
          />
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="text-xs text-accent-500 font-medium">Universal Media Downloader</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? "w-16" : "w-56"
          } flex flex-col bg-surface-200/50 border-r border-accent-900/30 transition-all duration-300 shrink-0`}
        >
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    console.log("Sidebar click:", item.path);
                    navigate(item.path);
                  }}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <NavIcon name={item.icon} size={18} />
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-accent-900/30">
            <button onClick={toggleSidebar} className="sidebar-item w-full justify-center" title={sidebarCollapsed ? "Expand" : "Collapse"}>
              <ChevronIcon collapsed={sidebarCollapsed} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <div className="h-8 flex items-center justify-between px-4 bg-surface-200/50 border-t border-accent-900/30 text-xs text-accent-500 shrink-0">
        <div className="flex items-center gap-4">
          {/* FFmpeg Status */}
          <div className="flex items-center gap-1.5" title={ffmpegStatus.path || "FFmpeg not found"}>
            <span className={`w-1.5 h-1.5 rounded-full ${ffmpegStatus.available ? "bg-green" : "bg-red"}`} />
            <span>FFmpeg: <span className={ffmpegStatus.available ? "text-green" : "text-red"}>{ffmpegStatus.available ? `Ready (v${ffmpegStatus.version})` : "Not Found"}</span></span>
          </div>

          {/* Network Status */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            <span>Online</span>
          </div>

          {/* Download Status */}
          {queueInfo.activeCount > 0 && (
            <div className="flex items-center gap-1.5 text-blue">
              <svg className="w-3 h-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{queueInfo.activeCount} active</span>
            </div>
          )}
          {queueInfo.queueCount > 0 && (
            <div className="flex items-center gap-1.5 text-yellow">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{queueInfo.queueCount} queued</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Disk Space */}
          <div className="flex items-center gap-2" title={`${formatBytes(diskSpace.free)} free of ${formatBytes(diskSpace.total)}`}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <div className="w-16 h-1.5 bg-accent-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  diskUsagePercent > 90 ? "bg-red" : diskUsagePercent > 70 ? "bg-yellow" : "bg-blue"
                }`}
                style={{ width: `${diskUsagePercent}%` }}
              />
            </div>
            <span>{formatBytes(diskSpace.free)} free</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(currentTime)}</span>
          </div>

          {/* Version */}
          <span className="opacity-50">v0.2.0</span>
        </div>
      </div>
    </div>
  );
}

function NavIcon({ name, size }: { name: string; size: number }) {
  const s = size;
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    torrent: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M12 3v16" />
        <path d="M8 15l4 4 4-4" />
        <path d="M4 4h16" />
      </svg>
    ),
    download: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    playlist: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    queue: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    converter: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
    scheduler: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    history: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
    settings: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  };
  return icons[name] || null;
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
