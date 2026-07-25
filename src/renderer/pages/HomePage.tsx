import { useState, useCallback, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { MediaInfo, OutputFormat, VideoQuality } from "../../shared/types";
import { VIDEO_FORMATS, AUDIO_FORMATS, VIDEO_QUALITIES } from "../../shared/constants";
import toast from "react-hot-toast";

export default function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [quality, setQuality] = useState<VideoQuality>("best");
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAudio = AUDIO_FORMATS.includes(format as typeof AUDIO_FORMATS[number]);

  // URL validation
  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("");
      return false;
    }
    if (value.trim().startsWith("magnet:?")) {
      setUrlError("");
      return true;
    }
    try {
      new URL(value);
      setUrlError("");
      return true;
    } catch {
      setUrlError("Please enter a valid URL or Magnet link");
      return false;
    }
  };

  useEffect(() => {
    const cleanup = window.electronAPI.onClipboardUrl(async (detectedUrl) => {
      setUrl(detectedUrl);
      if (!validateUrl(detectedUrl)) return;
      setAnalyzing(true);
      setUrlError("");
      try {
        const info = await window.electronAPI.analyzeUrl(detectedUrl);
        setMedia(info);
        setRecentUrls((prev) => [detectedUrl, ...prev.filter((u) => u !== detectedUrl)].slice(0, 10));
        
        // One click download check
        // Auto-download magnets or one-click downloads
        const settings = await window.electronAPI.getSettings();
        if (settings.oneClickDownload || detectedUrl.startsWith("magnet:?")) {
           await window.electronAPI.startDownload({
             url: info.url, title: info.title, thumbnail: info.thumbnail,
             channel: info.channel, duration: info.duration, outputFormat: format, quality,
           });
           setUrl(""); setMedia(null);
           navigate("/queue");
        }
      } catch (e) {
        console.error("Analysis failed:", e);
        setUrlError("Failed to analyze URL.");
      } finally {
        setAnalyzing(false);
      }
    });

    const cleanupBatch = window.electronAPI.onBatchImportUrls(async (urls) => {
      try {
        await window.electronAPI.batchImport(urls);
        // Toast is handled in backend or we could add one here
        setUrl(""); setMedia(null);
      } catch (e) {
        console.error("Batch import from watch folder failed:", e);
      }
    });

    return () => {
      cleanup();
      cleanupBatch();
    };
  }, [format, quality]);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim() || !validateUrl(url)) return;
    setAnalyzing(true);
    setUrlError("");
    try {
      const info = await window.electronAPI.analyzeUrl(url);
      setMedia(info);
      setRecentUrls((prev) => [url, ...prev.filter((u) => u !== url)].slice(0, 10));

      // Auto-download for magnets
      if (url.startsWith("magnet:?")) {
        await window.electronAPI.startDownload({
          url: info.url, title: info.title, thumbnail: info.thumbnail,
          channel: info.channel, duration: info.duration, outputFormat: format, quality,
        });
        setUrl(""); setMedia(null);
        navigate("/queue");
      }
    } catch (e) {
      console.error("Analysis failed:", e);
      setUrlError("Failed to analyze URL. Please check the URL and try again.");
    }
    finally { setAnalyzing(false); }
  }, [url]);

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      const urls = lines.map(line => line.split(",")[0].trim()).filter(u => u.startsWith("http://") || u.startsWith("https://"));

      if (urls.length > 0) {
        try {
          await window.electronAPI.batchImport(urls);
          toast.success(`Batch imported ${urls.length} URLs`);
        } catch (error) {
          toast.error("Batch import failed");
        }
      } else {
        toast.error("No valid URLs found in file");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!media) return;
    try {
      await window.electronAPI.startDownload({
        url: media.url, title: media.title, thumbnail: media.thumbnail,
        channel: media.channel, duration: media.duration, outputFormat: format, quality,
      });
      setUrl(""); setMedia(null);
      navigate("/queue");
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

  const handleDrop = useCallback(async (e: DragEvent) => {
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
      if (file.name.endsWith(".txt")) {
        const textData = await file.text();
        const urls = textData.split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith("http://") || l.startsWith("https://"));
        if (urls.length > 0) {
          try {
            await window.electronAPI.batchImport(urls);
            // navigate to downloads or show a toast? Let's just reset the form.
            setUrl("");
          } catch (e) {
            console.error("Batch import failed:", e);
          }
        }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue via-accent-300 to-accent-600 mb-2 tracking-tight">
            Universal Media Downloader
          </h1>
          <p className="text-accent-500/80 font-medium">Paste a URL and download media in any format</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-surface-200/50 hover:bg-surface-300 border border-border text-accent-100 font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Batch Import
          </button>
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
              placeholder="Paste a URL or drag & drop..."
              className={`input-field pr-20 shadow-inner ${urlError ? "border-red/50 focus:ring-red/50 focus:border-red/50" : "focus:ring-blue/50 focus:border-blue/50"}`}
            />
            {url && (
              <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-accent-500 hover:bg-surface hover:text-accent-300 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
        {urlError && <p className="text-red text-sm mt-1 animate-fade-in">{urlError}</p>}
      </div>

      {analyzing && (
        <div className="card border-border/50 animate-pulse">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 h-40 bg-surface rounded-lg shrink-0"></div>
            <div className="flex-1 space-y-4 py-2">
              <div className="h-6 bg-surface rounded w-3/4"></div>
              <div className="h-4 bg-surface rounded w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-surface rounded w-full"></div>
                <div className="h-4 bg-surface rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {media && !analyzing && (
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
            
            {/* New Advanced Features (Phase 1) */}
            <div className="mt-4 p-4 bg-surface-100/50 rounded-xl space-y-4 border border-border">
              <h4 className="text-sm font-semibold text-accent-100 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Advanced Options
              </h4>
              
              <div>
                <label className="block text-xs text-accent-400 mb-1">Custom Filename (Optional)</label>
                <input 
                  type="text" 
                  id="customFilenameInput"
                  placeholder="e.g. My Awesome Video" 
                  className="input-field w-full text-sm py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-accent-400 mb-1">Trim Start (HH:MM:SS)</label>
                  <input type="text" id="trimStartInput" placeholder="00:00:00" className="input-field w-full text-sm py-1.5" />
                </div>
                <div>
                  <label className="block text-xs text-accent-400 mb-1">Trim End (HH:MM:SS)</label>
                  <input type="text" id="trimEndInput" placeholder="00:02:30" className="input-field w-full text-sm py-1.5" />
                </div>
              </div>

              {isAudio && (
                <div className="space-y-3 pt-2 border-t border-accent-900/50">
                  <h5 className="text-xs font-semibold text-accent-300">Audio Options</h5>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="normalizeAudioInput" className="rounded bg-surface-300 border-border text-blue focus:ring-blue" />
                    <label htmlFor="normalizeAudioInput" className="text-xs text-accent-400">Normalize Audio Volume</label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-accent-400 mb-1 uppercase tracking-wider">Artist</label>
                      <input type="text" id="metaArtistInput" placeholder="Artist Name" className="input-field w-full text-xs py-1" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-accent-400 mb-1 uppercase tracking-wider">Album</label>
                      <input type="text" id="metaAlbumInput" placeholder="Album Name" className="input-field w-full text-xs py-1" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-accent-400 mb-1 uppercase tracking-wider">Year</label>
                      <input type="text" id="metaYearInput" placeholder="YYYY" className="input-field w-full text-xs py-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => {
              const customFilename = (document.getElementById("customFilenameInput") as HTMLInputElement)?.value;
              const startTime = (document.getElementById("trimStartInput") as HTMLInputElement)?.value;
              const endTime = (document.getElementById("trimEndInput") as HTMLInputElement)?.value;
              
              let normalizeAudio = false;
              let metadata: any = undefined;

              if (isAudio) {
                normalizeAudio = (document.getElementById("normalizeAudioInput") as HTMLInputElement)?.checked;
                const artist = (document.getElementById("metaArtistInput") as HTMLInputElement)?.value;
                const album = (document.getElementById("metaAlbumInput") as HTMLInputElement)?.value;
                const year = (document.getElementById("metaYearInput") as HTMLInputElement)?.value;
                if (artist || album || year) {
                  metadata = { artist, album, year };
                }
              }
              
              if (!media) return;
              try {
                window.electronAPI.startDownload({
                  url: media.url, title: media.title, thumbnail: media.thumbnail,
                  channel: media.channel, duration: media.duration, outputFormat: format, quality,
                  customFilename: customFilename || undefined,
                  startTime: startTime || undefined,
                  endTime: endTime || undefined,
                  normalizeAudio,
                  metadata
                });
                setUrl(""); setMedia(null);
                (document.getElementById("customFilenameInput") as HTMLInputElement).value = "";
                (document.getElementById("trimStartInput") as HTMLInputElement).value = "";
                (document.getElementById("trimEndInput") as HTMLInputElement).value = "";
                navigate("/queue");
              } catch (e) { console.error("Download failed:", e); }
            }} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        )}
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
