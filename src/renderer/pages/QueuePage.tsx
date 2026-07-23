import { useEffect, useState } from "react";
import type { DownloadItem } from "../../shared/types";

export default function QueuePage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const api = window.electronAPI;

  const fetchQueue = async () => {
    try {
      const downloads = await api.getDownloads();
      setItems(downloads.filter((d) => d.status === "waiting" || d.status === "downloading" || d.status === "paused" || d.status === "merging"));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-50">Download Queue</h1>
        <div className="flex gap-2">
          <button onClick={() => api.clearQueue()} className="px-3 py-1.5 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-300 text-sm hover:bg-accent-800/50 transition-colors">Clear All</button>
          <button onClick={() => api.clearFailed()} className="px-3 py-1.5 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-300 text-sm hover:bg-accent-800/50 transition-colors">Retry Failed</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-accent-700">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h3 className="text-lg font-semibold text-accent-400 mb-1">Queue is empty</h3>
          <p className="text-accent-500">Start a download from the Home page</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-accent-900 flex items-center justify-center text-sm font-bold text-accent-500">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-accent-50 truncate text-sm">{item.title || item.url}</h3>
                <div className="flex items-center gap-3 text-xs text-accent-500 mt-1">
                  <span className={`px-1.5 py-0.5 rounded ${
                    item.status === "downloading" ? "bg-blue/20 text-blue" :
                    item.status === "paused" ? "bg-yellow/20 text-yellow" :
                    item.status === "merging" ? "bg-purple/20 text-purple" :
                    "bg-accent-800 text-accent-400"
                  }`}>{item.status}</span>
                  <span>{item.quality}</span>
                  <span>{item.outputFormat}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => api.moveDownloadUp(item.id)} className="text-xs text-accent-400 hover:text-accent-200 p-1 rounded hover:bg-accent-800/50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button onClick={() => api.moveDownloadDown(item.id)} className="text-xs text-accent-400 hover:text-accent-200 p-1 rounded hover:bg-accent-800/50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {item.status === "downloading" && (
                  <button onClick={() => api.pauseDownload(item.id)} className="text-xs text-yellow hover:text-yellow-light p-1 rounded hover:bg-yellow/10 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  </button>
                )}
                {item.status === "paused" && (
                  <button onClick={() => api.resumeDownload(item.id)} className="text-xs text-green hover:text-green-light p-1 rounded hover:bg-green/10 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </button>
                )}
                <button onClick={() => api.cancelDownload(item.id)} className="text-xs text-red hover:text-red-light p-1 rounded hover:bg-red/10 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
