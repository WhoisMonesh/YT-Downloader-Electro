import { useState, useCallback, useEffect } from "react";
import type { MediaInfo, OutputFormat, VideoQuality } from "../../shared/types";
import { VIDEO_FORMATS, AUDIO_FORMATS, VIDEO_QUALITIES } from "../../shared/constants";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [quality, setQuality] = useState<VideoQuality>("best");
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  const isAudio = AUDIO_FORMATS.includes(format as typeof AUDIO_FORMATS[number]);

  useEffect(() => {
    const cleanup = window.electronAPI.onClipboardUrl((detectedUrl) => setUrl(detectedUrl));
    return cleanup;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    try {
      const info = await window.electronAPI.analyzeUrl(url);
      setMedia(info);
      setRecentUrls((prev) => [url, ...prev.filter((u) => u !== url)].slice(0, 10));
    } catch (e) { console.error("Analysis failed:", e); }
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
    try { const text = await navigator.clipboard.readText(); if (text) setUrl(text); } catch { /* denied */ }
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
      <div className="glass-panel p-6 space-y-4">
        <div className="flex gap-3">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} placeholder="Paste a URL or drag & drop..." className="input-field flex-1" />
          <button onClick={handlePaste} className="btn-secondary">Paste</button>
          <button onClick={handleAnalyze} disabled={!url.trim() || analyzing} className="btn-primary">{analyzing ? "Analyzing..." : "Analyze"}</button>
        </div>
        {media && (
          <div className="animate-fade-in">
            <div className="flex gap-4 p-4 bg-surface-200/50 rounded-xl">
              {media.thumbnail && <img src={media.thumbnail} alt={media.title} className="w-48 h-28 object-cover rounded-lg shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-accent-100 truncate">{media.title}</h3>
                <p className="text-sm text-accent-400 mt-1">{media.channel}</p>
                <div className="flex gap-4 mt-2 text-xs text-accent-500">
                  <span>{fmtDuration(media.duration)}</span>
                  <span>{fmtViews(media.viewCount)} views</span>
                  {media.uploadDate && <span>{media.uploadDate}</span>}
                  {media.formats.length > 0 && <span>{media.formats.length} formats</span>}
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
            <button onClick={handleDownload} className="btn-primary w-full mt-4">Download</button>
          </div>
        )}
      </div>
      {recentUrls.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-medium text-accent-400 mb-3">Recent URLs</h3>
          <div className="space-y-2">
            {recentUrls.map((ru, i) => (
              <button key={i} onClick={() => setUrl(ru)} className="w-full text-left px-3 py-2 text-sm text-accent-300 hover:bg-accent-900/30 rounded-lg truncate transition">{ru}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
