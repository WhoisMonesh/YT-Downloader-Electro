import { useState, useEffect, useCallback } from "react";
import type { DownloadItem, DownloadProgress } from "../../shared/types";

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [progress, setProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refresh = useCallback(() => {
    window.electronAPI.getDownloads().then((items) => {
      setDownloads(items);
    });
  }, []);

  useEffect(() => {
    refresh();
    const un1 = window.electronAPI.onDownloadProgress((p) => {
      setProgress((prev) => {
        const n = new Map(prev);
        n.set(p.downloadId, {
          ...(prev.get(p.downloadId) || { downloadId: p.downloadId, status: "downloading", progress: 0, speed: 0, eta: 0, downloadedSize: 0, totalSize: 0 }),
          ...p,
        });
        return n;
      });
    });
    const un2 = window.electronAPI.onDownloadCompleted(() => refresh());
    const un3 = window.electronAPI.onDownloadFailed(() => refresh());
    return () => { un1(); un2(); un3(); };
  }, [refresh]);

  const filtered = downloads.filter((d) => filter === "all" || d.status === filter);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  }, [filtered, selectedIds]);

  const clearCompleted = useCallback(async () => {
    const completed = downloads.filter((d) => d.status === "completed");
    for (const item of completed) {
      await window.electronAPI.cancelDownload(item.id);
    }
    refresh();
    setShowClearConfirm(false);
  }, [downloads, refresh]);

  const cancelSelected = useCallback(async () => {
    for (const id of selectedIds) {
      await window.electronAPI.cancelDownload(id);
    }
    setSelectedIds(new Set());
    refresh();
  }, [selectedIds, refresh]);

  const handlePauseAll = useCallback(async () => {
    if (window.electronAPI.pauseAllDownloads) {
      await window.electronAPI.pauseAllDownloads();
      refresh();
    }
  }, [refresh]);

  const handleResumeAll = useCallback(async () => {
    if (window.electronAPI.resumeAllDownloads) {
      await window.electronAPI.resumeAllDownloads();
      refresh();
    }
  }, [refresh]);

  const fmtSpeed = (b?: number) => {
    if (!b || b <= 0) return "0.0 B/s";
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB/s`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB/s`;
    return `${b.toFixed(0)} B/s`;
  };

  const fmtEta = (s?: number) => {
    if (!s || s <= 0) return "--:--";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const fmtSize = (b?: number) => {
    if (!b || b <= 0) return "---";
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  };

  const statusColor: Record<string, string> = {
    waiting: "bg-yellow/10 text-yellow border border-yellow/30",
    downloading: "bg-blue/10 text-blue border border-blue/30 animate-pulse",
    completed: "bg-green/10 text-green border border-green/30",
    failed: "bg-red/10 text-red border border-red/30",
    paused: "bg-yellow/10 text-yellow border border-yellow/30",
    cancelled: "bg-accent-900/50 text-accent-500 border border-accent-800",
  };

  const statusIcon: Record<string, JSX.Element> = {
    waiting: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    downloading: <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>,
    completed: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    failed: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    paused: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
    cancelled: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  };

  const filterCounts = {
    all: downloads.length,
    downloading: downloads.filter((d) => d.status === "downloading" || d.status === "waiting").length,
    completed: downloads.filter((d) => d.status === "completed").length,
    failed: downloads.filter((d) => d.status === "failed").length,
    paused: downloads.filter((d) => d.status === "paused").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-accent-100">Downloads</h1>
          <p className="text-sm text-accent-400 mt-1">Manage all your active and completed media downloads</p>
        </div>
        <div className="flex items-center gap-2">
          {filterCounts.downloading > 0 && (
            <button onClick={handlePauseAll} className="btn-secondary flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              Pause All
            </button>
          )}
          {filterCounts.paused > 0 && (
            <button onClick={handleResumeAll} className="btn-secondary flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Resume All
            </button>
          )}
          <button onClick={() => window.electronAPI.openDownloadsFolder?.()} className="btn-secondary flex items-center gap-1.5" title="Open Downloads Folder">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            Downloads Folder
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-accent-900/30 pb-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "downloading", "completed", "failed", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                filter === f ? "bg-blue text-white shadow-lg shadow-blue/20" : "bg-surface-200/50 text-accent-400 hover:text-accent-200 hover:bg-surface-200"
              }`}
            >
              {statusIcon[f] || null}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === f ? "bg-white/20 text-white" : "bg-accent-900/50 text-accent-500"}`}>
                {filterCounts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {filterCounts.completed > 0 && filter === "completed" && (
            <button onClick={() => setShowClearConfirm(true)} className="btn-ghost text-xs text-accent-400 hover:text-red">
              Clear Completed
            </button>
          )}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-accent-900/40 px-3 py-1 rounded-lg">
              <span className="text-xs text-accent-300">{selectedIds.size} selected</span>
              <button onClick={cancelSelected} className="btn-ghost text-xs text-red">Cancel Selected</button>
              <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs">Clear Selection</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowClearConfirm(false)}>
          <div className="glass-panel p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-accent-100 mb-2">Clear Completed Downloads?</h3>
            <p className="text-sm text-accent-400 mb-4">This will remove {filterCounts.completed} completed download(s) from the list. Files will not be deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={clearCompleted} className="btn-danger">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Download Items */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <p className="text-accent-400 font-medium mb-1">No downloads found</p>
            <p className="text-xs text-accent-600">Paste a video or playlist URL on the Home page to start downloading</p>
          </div>
        ) : (
          <div className="flex justify-end mb-2">
            <button onClick={selectAll} className="btn-ghost text-xs">
              {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {filtered.map((item) => {
          const p = progress.get(item.id);
          const prog = p?.progress ?? item.progress ?? 0;
          const currentSpeed = p?.speed ?? item.speed ?? 0;
          const currentEta = p?.eta ?? item.eta ?? 0;
          const currentDownloaded = p?.downloadedSize ?? item.downloadedSize ?? 0;
          const currentTotal = p?.totalSize ?? item.totalSize ?? 0;
          const isSelected = selectedIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`card transition-all duration-200 ${isSelected ? "ring-2 ring-blue border-blue/40 bg-surface-200/80" : "hover:border-accent-700"}`}
            >
              <div className="flex gap-4 items-start">
                <button
                  onClick={() => toggleSelect(item.id)}
                  className={`shrink-0 w-5 h-5 mt-2 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? "bg-blue border-blue" : "border-accent-700 hover:border-accent-500"
                  }`}
                >
                  {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>

                {/* Thumbnail */}
                {item.thumbnail ? (
                  <div className="relative shrink-0 overflow-hidden rounded-lg">
                    <img src={item.thumbnail} alt="" className="w-36 h-20 object-cover" />
                    {item.outputFormat && (
                      <span className="absolute top-1 left-1 bg-black/80 text-blue font-bold text-[10px] px-1.5 py-0.5 rounded uppercase">
                        {item.outputFormat}
                      </span>
                    )}
                    {item.status === "downloading" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-base font-bold text-white">{prog.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-36 h-20 rounded-lg bg-accent-900/40 flex items-center justify-center text-accent-600 shrink-0">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-accent-100 truncate line-clamp-1 text-sm">{item.title || item.url}</h3>
                      <p className="text-xs text-accent-500 mt-0.5">{item.channel || "YouTube"}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusColor[item.status] || ""}`}>
                      {statusIcon[item.status] || null}
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar & Realtime Metrics */}
                  {item.status === "downloading" && (
                    <div className="mt-3 space-y-1.5">
                      <div className="progress-bar h-2">
                        <div className="progress-bar-fill" style={{ width: `${prog}%` }} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-accent-300">
                          <svg className="w-3.5 h-3.5 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          <span>Speed: <strong className="text-accent-100">{fmtSpeed(currentSpeed)}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-accent-300 justify-center">
                          <svg className="w-3.5 h-3.5 text-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>ETA: <strong className="text-accent-100">{fmtEta(currentEta)}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-accent-300 justify-end">
                          <svg className="w-3.5 h-3.5 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{fmtSize(currentDownloaded)} / {fmtSize(currentTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {item.error && (
                    <div className="mt-2 p-2 rounded-lg bg-red/10 border border-red/20 text-xs text-red flex items-start gap-1.5">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <span className="truncate">{item.error}</span>
                    </div>
                  )}

                  {/* Item Action Bar */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-accent-900/20">
                    <div className="flex items-center gap-3 text-xs text-accent-500">
                      <span>Format: <strong className="text-accent-300 uppercase">{item.outputFormat || "MP4"}</strong></span>
                      {item.quality && <span>Quality: <strong className="text-accent-300">{item.quality}</strong></span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {(item.status === "waiting" || item.status === "downloading") && (
                        <>
                          <button onClick={() => window.electronAPI.pauseDownload(item.id).then(refresh)} className="btn-ghost text-xs flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                            Pause
                          </button>
                          <button onClick={() => window.electronAPI.cancelDownload(item.id).then(refresh)} className="btn-ghost text-xs text-red flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Cancel
                          </button>
                        </>
                      )}
                      {item.status === "paused" && (
                        <button onClick={() => window.electronAPI.resumeDownload(item.id).then(refresh)} className="btn-ghost text-xs text-blue flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          Resume
                        </button>
                      )}
                      {item.status === "failed" && (
                        <>
                          <button onClick={() => window.electronAPI.retryDownload(item.id).then(refresh)} className="btn-ghost text-xs text-yellow flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
                            Retry
                          </button>
                          <button onClick={() => window.electronAPI.cancelDownload(item.id).then(refresh)} className="btn-ghost text-xs text-red flex items-center gap-1">
                            Remove
                          </button>
                        </>
                      )}
                      {item.status === "completed" && (
                          <button 
                            onClick={() => {
                              // We can open it natively if electron API supports opening files directly, 
                              // or we can invoke the media player modal. We'll invoke native system player for now.
                              window.electronAPI.openFile?.(item.outputPath);
                            }} 
                            className="btn-ghost text-xs text-green flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Play
                          </button>
                          <button onClick={() => window.electronAPI.revealInExplorer(item.outputPath)} className="btn-ghost text-xs text-accent-300 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            Folder
                          </button>
                          <button onClick={() => window.electronAPI.cancelDownload(item.id).then(refresh)} className="btn-ghost text-xs text-red flex items-center gap-1">
                            Remove
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
