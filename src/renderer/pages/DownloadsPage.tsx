import { useState, useEffect, useCallback } from "react";
import type { DownloadItem, DownloadProgress } from "../../shared/types";

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [progress, setProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(() => window.electronAPI.getDownloads().then(setDownloads), []);

  useEffect(() => {
    refresh();
    const un1 = window.electronAPI.onDownloadProgress((p) => {
      setProgress((prev) => { const n = new Map(prev); n.set(p.downloadId, p); return n; });
    });
    const un2 = window.electronAPI.onDownloadCompleted(() => refresh());
    const un3 = window.electronAPI.onDownloadFailed(() => refresh());
    return () => { un1(); un2(); un3(); };
  }, [refresh]);

  const filtered = downloads.filter((d) => filter === "all" || d.status === filter);

  const fmtSpeed = (b: number) => {
    if (b <= 0) return "---";
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB/s`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB/s`;
    return `${b.toFixed(0)} B/s`;
  };
  const fmtEta = (s: number) => {
    if (s <= 0) return "---";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };
  const fmtSize = (b: number) => {
    if (b <= 0) return "---";
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  };
  const statusColor: Record<string, string> = {
    waiting: "bg-accent-900/50 text-accent-400", downloading: "bg-blue/20 text-blue",
    completed: "bg-green/20 text-green", failed: "bg-red/20 text-red",
    paused: "bg-yellow/20 text-yellow", cancelled: "bg-accent-900/50 text-accent-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-100">Downloads</h1>
        <div className="flex gap-2">
          {["all", "downloading", "completed", "failed", "paused"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`btn-ghost text-xs ${filter === f ? "bg-accent-900/50 text-accent-100" : ""}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-panel p-12 text-center"><p className="text-accent-500">No downloads</p></div>
        ) : filtered.map((item) => {
          const p = progress.get(item.id);
          const prog = p?.progress ?? item.progress;
          return (
            <div key={item.id} className="card">
              <div className="flex gap-4">
                {item.thumbnail && <img src={item.thumbnail} alt="" className="w-32 h-20 object-cover rounded-lg shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-accent-100 truncate">{item.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status] || ""}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-accent-500 mt-1">{item.channel}</p>
                  {item.status === "downloading" && (
                    <div className="mt-3">
                      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${prog}%` }} /></div>
                      <div className="flex justify-between mt-1 text-xs text-accent-500">
                        <span>{prog.toFixed(1)}%</span>
                        <span>{fmtSpeed(p?.speed ?? item.speed)}</span>
                        <span>ETA {fmtEta(p?.eta ?? item.eta)}</span>
                        <span>{fmtSize(item.downloadedSize)} / {fmtSize(item.totalSize)}</span>
                      </div>
                    </div>
                  )}
                  {item.error && <p className="text-xs text-red mt-2">{item.error}</p>}
                  <div className="flex gap-2 mt-3">
                    {(item.status === "waiting" || item.status === "downloading") && <button onClick={() => window.electronAPI.pauseDownload(item.id).then(refresh)} className="btn-ghost text-xs">Pause</button>}
                    {item.status === "paused" && <button onClick={() => window.electronAPI.resumeDownload(item.id).then(refresh)} className="btn-ghost text-xs">Resume</button>}
                    {item.status === "failed" && <button onClick={() => window.electronAPI.retryDownload(item.id).then(refresh)} className="btn-ghost text-xs">Retry</button>}
                    {item.status === "completed" && <button onClick={() => window.electronAPI.revealInExplorer(item.outputPath)} className="btn-ghost text-xs">Open Folder</button>}
                    <button onClick={() => window.electronAPI.cancelDownload(item.id).then(refresh)} className="btn-ghost text-xs text-red">Cancel</button>
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
