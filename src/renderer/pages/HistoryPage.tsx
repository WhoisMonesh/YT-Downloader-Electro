import { useState, useEffect } from "react";
import type { HistoryEntry } from "../../shared/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
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

      <div className="glass rounded-2xl p-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history..."
          className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50 text-sm" />
      </div>

      {history.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-accent-700">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 className="text-lg font-semibold text-accent-400 mb-1">No history</h3>
          <p className="text-accent-500">Completed downloads will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-20 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-20 h-12 bg-accent-900 rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-accent-50 text-sm truncate">{item.title}</h3>
                <div className="flex items-center gap-3 text-xs text-accent-500 mt-1">
                  <span>{item.channel}</span>
                  <span>{item.outputFormat?.toUpperCase()}</span>
                  {item.duration > 0 && <span>{formatDuration(item.duration)}</span>}
                  <span>{formatBytes(item.fileSize)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => api.openFile(item.outputPath)} className="text-xs text-accent-400 hover:text-accent-200 px-2 py-1 rounded hover:bg-accent-800/50 transition-colors" title="Open file">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </button>
                <button onClick={() => api.revealInExplorer(item.outputPath)} className="text-xs text-accent-400 hover:text-accent-200 px-2 py-1 rounded hover:bg-accent-800/50 transition-colors" title="Show in explorer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                </button>
                <button onClick={() => api.redownload(item.downloadId)} className="text-xs text-accent-400 hover:text-accent-200 px-2 py-1 rounded hover:bg-accent-800/50 transition-colors" title="Re-download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                </button>
                <button onClick={async () => { await api.deleteHistory(item.id); fetchHistory(); }} className="text-xs text-red hover:text-red-light px-2 py-1 rounded hover:bg-red/10 transition-colors" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
