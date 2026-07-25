import { useState, useCallback, useRef, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { MediaInfo } from "../../shared/types";

export default function TorrentPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("");
      return false;
    }
    if (value.trim().startsWith("magnet:?")) {
      setUrlError("");
      return true;
    }
    setUrlError("Please enter a valid Magnet link");
    return false;
  };

  const handleAnalyze = useCallback(async () => {
    if (!url.trim() || !validateUrl(url)) return;
    setAnalyzing(true);
    setUrlError("");
    try {
      const info = await window.electronAPI.analyzeUrl(url);
      setMedia(info);
    } catch (e) {
      console.error("Analysis failed:", e);
      setUrlError("Failed to analyze Magnet URL.");
    } finally {
      setAnalyzing(false);
    }
  }, [url]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        validateUrl(text);
      }
    } catch { /* denied */ }
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
    setMedia(null);
    setUrlError("");
    inputRef.current?.focus();
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData("text");
    if (text) {
      setUrl(text);
      validateUrl(text);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-100 mb-2">Torrent Downloader</h1>
          <p className="text-accent-500">Paste a Magnet link to start a P2P download (Aria2c)</p>
        </div>
      </div>
      <div
        className={`glass-panel p-6 space-y-4 transition-all duration-200 ${isDragging ? "border-2 border-dashed border-blue ring-2 ring-blue/20" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); validateUrl(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Paste a magnet link here (magnet:?xt=urn:btih:...)"
              className={`input-field pr-20 ${urlError ? "border-red/50 focus:ring-red/30 focus:border-red/50" : ""}`}
            />
            {url && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-500 hover:text-accent-300 transition-colors"
                title="Clear"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={handlePaste} className="btn-secondary" title="Paste from clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </button>
          <button onClick={handleAnalyze} disabled={!url.trim() || analyzing || !!urlError} className="btn-primary min-w-[100px]">
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing
              </span>
            ) : "Analyze"}
          </button>
        </div>
        {urlError && (
          <p className="text-xs text-red flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {urlError}
          </p>
        )}
        {media && (
          <div className="animate-fade-in mt-6">
            <div className="flex gap-4 p-4 bg-surface-200/50 rounded-xl">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-accent-100 truncate line-clamp-2">{media.title}</h3>
                <p className="text-sm text-accent-400 mt-1 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {media.channel}
                </p>
              </div>
            </div>

            <button onClick={async () => {
              try {
                await window.electronAPI.startDownload({
                  url: media.url, title: media.title, thumbnail: media.thumbnail,
                  channel: media.channel, duration: media.duration, outputFormat: "mp4", quality: "best",
                });
                setUrl(""); setMedia(null);
                navigate("/queue");
              } catch (e) {
                console.error("Download failed:", e);
              }
            }} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Start Torrent Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
