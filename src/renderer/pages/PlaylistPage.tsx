import { useState, useCallback } from "react";
import type { MediaInfo, OutputFormat, VideoQuality } from "../../shared/types";
import { VIDEO_FORMATS, AUDIO_FORMATS, VIDEO_QUALITIES } from "../../shared/constants";

export default function PlaylistPage() {
  const [url, setUrl] = useState("");
  const [playlist, setPlaylist] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [quality, setQuality] = useState<VideoQuality>("best");

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    try { setPlaylist(await window.electronAPI.analyzePlaylist(url)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [url]);

  const toggle = (i: number) => {
    if (!playlist?.playlist) return;
    const v = [...playlist.playlist.videos];
    v[i] = { ...v[i], selected: !v[i].selected };
    setPlaylist({ ...playlist, playlist: { ...playlist.playlist, videos: v } });
  };

  const filtered = playlist?.playlist?.videos.filter((v) => !search || v.title.toLowerCase().includes(search.toLowerCase()));
  const selected = playlist?.playlist?.videos.filter((v) => v.selected).length || 0;

  const downloadSelected = useCallback(async () => {
    if (!playlist?.playlist) return;
    for (const v of playlist.playlist.videos.filter((v) => v.selected)) {
      await window.electronAPI.startDownload({ url: v.url, title: v.title, thumbnail: v.thumbnail, isPlaylist: true, playlistId: playlist.playlist!.id, outputFormat: format, quality });
    }
  }, [playlist, format, quality]);

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent-50">Playlist Downloader</h1>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex gap-3">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} placeholder="Paste playlist URL..."
            className="flex-1 h-12 px-4 rounded-xl bg-accent-900/50 border border-accent-800 text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50" />
          <button onClick={handleAnalyze} disabled={!url.trim() || loading}
            className="px-6 rounded-xl bg-blue/90 hover:bg-blue text-surface-400 font-medium transition-colors disabled:opacity-50">
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
{playlist?.playlist && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-accent-400 mb-1">Format</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="w-full h-10 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                    <optgroup label="Video">{VIDEO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
                    <optgroup label="Audio">{AUDIO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
                  </select>
                </div>
                {!AUDIO_FORMATS.includes(format as typeof AUDIO_FORMATS[number]) && (
                  <div>
                    <label className="block text-xs text-accent-400 mb-1">Quality</label>
                    <select value={quality} onChange={(e) => setQuality(e.target.value as VideoQuality)} className="w-full h-10 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                      {VIDEO_QUALITIES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-accent-50">{playlist.playlist.title}</h2>
                    <p className="text-sm text-accent-400">{playlist.playlist.videoCount} videos</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPlaylist({ ...playlist, playlist: { ...playlist.playlist!, videos: playlist.playlist!.videos.map((v) => ({ ...v, selected: true })) } })} className="text-xs text-accent-400 hover:text-accent-200 px-2 py-1 rounded hover:bg-accent-800/50 transition-colors">Select All</button>
                    <button onClick={() => setPlaylist({ ...playlist, playlist: { ...playlist.playlist!, videos: playlist.playlist!.videos.map((v) => ({ ...v, selected: false })) } })} className="text-xs text-accent-400 hover:text-accent-200 px-2 py-1 rounded hover:bg-accent-800/50 transition-colors">Unselect All</button>
                    <button onClick={downloadSelected} disabled={selected === 0}
                      className="px-4 py-1.5 rounded-lg bg-blue/90 hover:bg-blue text-surface-400 text-sm font-medium transition-colors disabled:opacity-50">
                      Download ({selected})
                    </button>
                  </div>
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50 text-sm" />
                <div className="space-y-2 max-h-[500px] overflow-auto pr-2">
                  {filtered?.map((v, i) => (
                    <div key={v.id} onClick={() => toggle(i)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${v.selected ? "bg-blue/10 border border-blue/30" : "bg-accent-900/30 border border-transparent hover:bg-accent-900/50"}`}>
                      <input type="checkbox" checked={v.selected} onChange={() => toggle(i)} className="accent-blue shrink-0" onClick={(e) => e.stopPropagation()} />
                      <span className="text-xs text-accent-500 w-6 text-right shrink-0">{i + 1}</span>
                      {v.thumbnail && <img src={v.thumbnail} alt="" className="w-20 h-12 object-cover rounded shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-accent-200 truncate">{v.title}</p>
                        <p className="text-xs text-accent-500">{fmtDur(v.duration)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
