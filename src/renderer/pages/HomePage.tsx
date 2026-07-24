import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import type { MediaInfo, OutputFormat, VideoQuality } from "../../shared/types";
import { VIDEO_FORMATS, AUDIO_FORMATS, VIDEO_QUALITIES } from "../../shared/constants";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [quality, setQuality] = useState<VideoQuality>("best");
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isAudio = AUDIO_FORMATS.includes(format as typeof AUDIO_FORMATS[number]);

  // URL validation
  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("");
      return false;
    }
    try {
      new URL(value);
      setUrlError("");
      return true;
    } catch {
      setUrlError("Please enter a valid URL");
      return false;
    }
  };

  useEffect(() => {
    const cleanup = window.electronAPI.onClipboardUrl((detectedUrl) => setUrl(detectedUrl));
    return cleanup;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim() || !validateUrl(url)) return;
    setAnalyzing(true);
    setUrlError("");
    try {
      const info = await window.electronAPI.analyzeUrl(url);
      setMedia(info);
      setRecentUrls((prev) => [url, ...prev.filter((u) => u !== url)].slice(0, 10));
    } catch (e) {
      console.error("Analysis failed:", e);
      setUrlError("Failed to analyze URL. Please check the URL and try again.");
    }
    finally { setAnalyzing(false); }
  }, [url]);

  const handleDownload = useCallback(async () => {
    if (!media) return;
    try {
      await window.electronAPI.startDownload({
        url: media.url, title: media.title, thumbnail: media.thumbnail,
        channel: media.channel, duration: media.duration, outputFormat: format, quality,
      });
      setUrl(""); setMedia(null);
    } catch (e) { console.error("Download failed:", e); }
  }, [media, format, quality]);

  const handlePaste = useCallback(async () => {
    try { const text = await navigator.clipboard.readText(); if (text) { setUrl(text); validateUrl(text); } } catch { /* denied */ }
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

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData("text");
    if (text) {
      setUrl(text);
      validateUrl(text);
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        // Handle file drop - could add file conversion feature
      }
    }
  }, []);

  const fmtDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}` : `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const fmtViews = (v?: number) => {
    if (!v) return "N/A";
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-accent-100 mb-2">Universal Media Downloader</h1>
        <p className="text-accent-500">Paste a URL and download media in any format</p>
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
              placeholder="Paste a URL or drag & drop..."
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
          <button onClick={handleAnalyze} disabled={!url.trim() || analyzing} className="btn-primary min-w-[100px]">
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
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue/5 rounded-xl pointer-events-none">
            <p className="text-blue font-medium">Drop URL here</p>
          </div>
        )}
        {media && (
          <div className="animate-fade-in">
            <div className="flex gap-4 p-4 bg-surface-200/50 rounded-xl">
              {media.thumbnail && (
                <div className="relative shrink-0">
                  <img src={media.thumbnail} alt={media.title} className="w-48 h-28 object-cover rounded-lg" />
                  {media.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {fmtDuration(media.duration)}
                    </span>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-accent-100 truncate line-clamp-2">{media.title}</h3>
                <p className="text-sm text-accent-400 mt-1 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {media.channel}
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-accent-500">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {fmtViews(media.viewCount)} views
                  </span>
                  {media.uploadDate && (
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {media.uploadDate}
                    </span>
                  )}
                  {media.formats.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {media.formats.length} formats
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-accent-400 mb-2">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="select-field w-full">
                  <optgroup label="Video">{VIDEO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
                  <optgroup label="Audio">{AUDIO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
                </select>
              </div>
              {!isAudio && (
                <div>
                  <label className="block text-sm text-accent-400 mb-2">Quality</label>
                  <select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)} className="select-field w-full">
                    {VIDEO_QUALITIES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button onClick={handleDownload} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        )}
      </div>
      {recentUrls.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-accent-400">Recent URLs</h3>
            <button onClick={() => setRecentUrls([])} className="text-xs text-accent-500 hover:text-accent-300 transition">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentUrls.map((ru, i) => (
              <button
                key={i}
                onClick={() => setUrl(ru)}
                className="max-w-xs text-left px-3 py-1.5 text-xs text-accent-300 hover:bg-accent-900/50 rounded-lg truncate transition border border-transparent hover:border-accent-800"
                title={ru}
              >
                {ru.length > 40 ? `${ru.slice(0, 40)}...` : ru}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
