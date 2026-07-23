import { useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const navItems = [
  { path: "/", label: "Home", icon: "home" },
  { path: "/downloads", label: "Downloads", icon: "download" },
  { path: "/playlist", label: "Playlist", icon: "playlist" },
  { path: "/queue", label: "Queue", icon: "queue" },
  { path: "/converter", label: "Converter", icon: "converter" },
  { path: "/scheduler", label: "Scheduler", icon: "scheduler" },
  { path: "/history", label: "History", icon: "history" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const handleMinimize = useCallback(() => window.electronAPI?.minimizeWindow?.(), []);
  const handleMaximize = useCallback(() => window.electronAPI?.maximizeWindow?.(), []);
  const handleClose = useCallback(() => window.electronAPI?.closeWindow?.(), []);

  return (
    <div className="h-screen flex flex-col bg-surface-300">
      <div className="title-bar">
        <div className="flex items-center gap-2 no-drag">
          <button className="w-3 h-3 rounded-full bg-red hover:brightness-110 transition" onClick={handleClose} />
          <button className="w-3 h-3 rounded-full bg-yellow hover:brightness-110 transition" onClick={handleMinimize} />
          <button className="w-3 h-3 rounded-full bg-green hover:brightness-110 transition" onClick={handleMaximize} />
        </div>
        <span className="text-xs text-accent-500 font-medium">Universal Media Downloader</span>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 overflow-hidden">
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
                  onClick={() => navigate(item.path)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}
                >
                  <NavIcon name={item.icon} size={18} />
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-accent-900/30">
            <button onClick={toggleSidebar} className="sidebar-item w-full justify-center">
              <ChevronIcon collapsed={sidebarCollapsed} />
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="h-6 flex items-center justify-between px-4 bg-surface-200/50 border-t border-accent-900/30 text-xs text-accent-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>FFmpeg: <span className="text-green">Ready</span></span>
          <span>Network: <span className="text-green">Online</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>v1.0.0</span>
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
