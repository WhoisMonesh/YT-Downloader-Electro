import { useState, useEffect } from "react";
import type { HistoryEntry } from "../../shared/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [previewFile, setPreviewFile] = useState<HistoryEntry | null>(null);
  const api = window.electronAPI;

  const fetchHistory = async () => {
    try { setHistory(await api.getHistory(search || undefined)); } catch { /* ignore */ }
  };

  useEffect(() => { fetchHistory(); }, [search]);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-50">History</h1>
        <div className="flex gap-2">
          <button onClick={() => api.exportHistory()} className="px-3 py-1.5 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-300 text-sm hover:bg-accent-800/50 transition-colors">Export</button>
          <button onClick={async () => { if (confirm("Clear all download history?")) { await api.clearHistory(); fetchHistory(); } }} className="px-3 py-1.5 rounded-lg bg-red/10 border border-red/30 text-red text-sm hover:bg-red/20 transition-colors">Clear All</button>
        </div>
      </div>

      <div className="glass-panel p-4 flex gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-border text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50 text-sm shadow-inner transition-all duration-200" />
        </div>
        <div className="flex bg-surface rounded-lg p-1 border border-border">
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-accent-800 text-white shadow" : "text-accent-500 hover:text-accent-300"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-accent-800 text-white shadow" : "text-accent-500 hover:text-accent-300"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-accent-700">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 className="text-lg font-semibold text-accent-400 mb-1">No history</h3>
          <p className="text-accent-500">Completed downloads will appear here</p>
        </div>
      ) : (
        <div className={viewMode === "list" ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
          {history.map((item) => (
            <div key={item.id} className={`card group relative overflow-hidden ${viewMode === "list" ? "flex items-center gap-4 p-4" : "flex flex-col p-0 pb-3"}`}>
              <div className={`relative overflow-hidden shrink-0 ${viewMode === "list" ? "w-28 h-16 rounded-lg" : "w-full aspect-video rounded-t-lg"}`}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-surface flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-700"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <button onClick={() => setPreviewFile(item)} className="p-2 rounded-full bg-blue/90 text-white transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl hover:bg-blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                </div>
              </div>

              <div className={`flex-1 min-w-0 ${viewMode === "list" ? "" : "px-4 pt-3"}`}>
                <h3 className="font-medium text-accent-50 text-sm truncate group-hover:text-blue-light transition-colors">{item.title}</h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-accent-500 mt-1.5 font-medium">
                  <span className="truncate max-w-[100px]">{item.channel}</span>
                  <span className="w-1 h-1 rounded-full bg-accent-700"></span>
                  <span className="bg-surface px-1.5 py-0.5 rounded text-accent-400 border border-border/50">{item.outputFormat?.toUpperCase()}</span>
                  <span className="w-1 h-1 rounded-full bg-accent-700"></span>
                  {item.duration > 0 && <span className="font-mono">{formatDuration(item.duration)}</span>}
                  {item.duration > 0 && <span className="w-1 h-1 rounded-full bg-accent-700"></span>}
                  <span className="font-mono text-accent-600">{formatBytes(item.fileSize)}</span>
                </div>
              </div>
              
              <div className={`flex items-center gap-1 ${viewMode === "list" ? "" : "px-4 pt-3 mt-auto justify-between"}`}>
                <div className="flex gap-1">
                  <button onClick={() => api.openFile(item.outputPath)} className="text-xs text-accent-400 hover:text-white p-1.5 rounded-lg hover:bg-accent-700 transition-all active:scale-95" title="Open file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </button>
                  <button onClick={() => api.revealInExplorer(item.outputPath)} className="text-xs text-accent-400 hover:text-white p-1.5 rounded-lg hover:bg-accent-700 transition-all active:scale-95" title="Show in explorer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  </button>
                  <button onClick={() => api.redownload(item.downloadId)} className="text-xs text-accent-400 hover:text-white p-1.5 rounded-lg hover:bg-accent-700 transition-all active:scale-95" title="Re-download">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  </button>
                </div>
                <button onClick={async () => { await api.deleteHistory(item.id); fetchHistory(); }} className="text-xs text-red hover:text-red-light p-1.5 rounded-lg hover:bg-red/10 transition-all active:scale-95" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 animate-fade-in">
          <div className="bg-surface-500 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative border border-accent-800">
            <div className="flex items-center justify-between p-4 border-b border-accent-900/30 bg-surface-400">
              <h3 className="font-semibold text-accent-50 truncate pr-8">{previewFile.title}</h3>
              <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 text-accent-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="bg-black flex-1 flex items-center justify-center relative min-h-[400px]">
              {["mp3", "aac", "flac", "ogg", "wav", "m4a", "opus"].includes(previewFile.outputFormat?.toLowerCase() || "") ? (
                <div className="flex flex-col items-center justify-center p-12 w-full">
                  {previewFile.thumbnail ? (
                    <img src={previewFile.thumbnail} alt="" className="w-48 h-48 object-cover rounded-lg shadow-xl mb-8" />
                  ) : (
                    <div className="w-48 h-48 bg-accent-900 rounded-lg shadow-xl mb-8 flex items-center justify-center text-accent-500">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                    </div>
                  )}
                  <audio controls autoPlay src={`media://${encodeURIComponent(previewFile.outputPath)}`} className="w-full max-w-md" />
                </div>
              ) : (
                <video controls autoPlay src={`media://${encodeURIComponent(previewFile.outputPath)}`} className="w-full max-h-[70vh]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
