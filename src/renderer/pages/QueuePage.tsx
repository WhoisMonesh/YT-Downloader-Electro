import { useEffect, useState, useCallback } from "react";
import type { DownloadItem } from "../../shared/types";

export default function QueuePage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const api = window.electronAPI;

  const fetchQueue = useCallback(async () => {
    try {
      // Get all downloads including queued ones
      const allDownloads = await api.getAllDownloads();
      const filtered = allDownloads.filter((d) =>
        d.status === "waiting" ||
        d.status === "downloading" ||
        d.status === "paused" ||
        d.status === "merging"
      );
      setItems(filtered);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const moveItem = useCallback(async (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap items
    const newItems = [...items];
    [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
    setItems(newItems);

    // Update queue order in backend
    const ids = newItems.map(item => item.id);
    await api.reorderQueue(ids);
  }, [items]);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "---";
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-50">Download Queue</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => { await api.clearQueue(); fetchQueue(); }}
            className="px-3 py-1.5 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-300 text-sm hover:bg-accent-800/50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={async () => { await api.retryFailedDownloads(); fetchQueue(); }}
            className="px-3 py-1.5 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-300 text-sm hover:bg-accent-800/50 transition-colors"
          >
            Retry Failed
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel p-12 text-center">
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
            <div key={item.id} className="glass-panel p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-accent-900 flex items-center justify-center text-sm font-bold text-accent-500">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-accent-50 truncate text-sm">{item.title || item.url}</h3>
                <div className="flex items-center gap-3 text-xs text-accent-500 mt-1">
                  <span className={`px-1.5 py-0.5 rounded ${
                    item.status === "downloading" ? "bg-blue/20 text-blue" :
                    item.status === "paused" ? "bg-yellow/20 text-yellow" :
                    item.status === "merging" ? "bg-purple/20 text-purple" :
                    item.status === "waiting" ? "bg-accent-800 text-accent-400" :
                    "bg-accent-800 text-accent-400"
                  }`}>{item.status}</span>
                  <span>{item.quality || 'best'}</span>
                  <span>{(item.outputFormat || 'mp4').toUpperCase()}</span>
                  {item.totalSize > 0 && (
                    <span className="text-accent-600 font-mono">{formatSize(item.totalSize)}</span>
                  )}
                  {item.eta !== undefined && item.eta > 0 && item.status === "downloading" && (
                    <span className="text-blue/80 font-mono">
                      {item.eta > 60 ? `${Math.floor(item.eta / 60)}m ${item.eta % 60}s` : `${item.eta}s`}
                    </span>
                  )}
                  {item.peers !== undefined && (
                    <span className="text-green/80 flex items-center gap-1 font-mono">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      {item.peers}
                    </span>
                  )}
                </div>
                {item.status === "downloading" && item.progress > 0 && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(item.id, 'up')}
                  disabled={index === 0}
                  className="text-xs text-accent-400 hover:text-accent-200 p-1 rounded hover:bg-accent-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button
                  onClick={() => moveItem(item.id, 'down')}
                  disabled={index === items.length - 1}
                  className="text-xs text-accent-400 hover:text-accent-200 p-1 rounded hover:bg-accent-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {item.status === "downloading" && (
                  <button
                    onClick={async () => { await api.pauseDownload(item.id); fetchQueue(); }}
                    className="text-xs text-yellow hover:text-yellow-light p-1.5 rounded-lg hover:bg-yellow/10 active:scale-95 transition-all duration-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  </button>
                )}
                {item.status === "paused" && (
                  <button
                    onClick={async () => { await api.resumeDownload(item.id); fetchQueue(); }}
                    className="text-xs text-green hover:text-green-light p-1.5 rounded-lg hover:bg-green/10 active:scale-95 transition-all duration-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </button>
                )}
                <button
                  onClick={async () => { await api.cancelDownload(item.id); fetchQueue(); }}
                  className="text-xs text-red hover:text-red-light p-1.5 rounded-lg hover:bg-red/10 active:scale-95 transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
