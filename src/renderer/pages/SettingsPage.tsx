import { useState, useEffect, useCallback } from "react";
import type { AppSettings } from "../../shared/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { window.electronAPI.getSettings().then(setSettings); }, []);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    await window.electronAPI.updateSettings(settings);
    setSaving(false);
  }, [settings]);

  const update = (key: keyof AppSettings, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };
  const updateProxy = (key: string, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, proxy: { ...settings.proxy, [key]: value } });
  };

  if (!settings) return <div className="text-accent-500">Loading...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-50">Settings</h1>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-xl bg-blue/90 hover:bg-blue text-surface-400 font-medium transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
      </div>

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Theme</span>
          <select value={settings.theme} onChange={(e) => update("theme", e.target.value)}
            className="w-48 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
            <option value="dark">Dark</option><option value="light">Light</option><option value="auto">Auto</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Downloads</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Download Folder</span>
          <div className="flex items-center gap-2">
            <input type="text" value={settings.downloadFolder} onChange={(e) => update("downloadFolder", e.target.value)}
              className="flex-1 max-w-md ml-4 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50" />
            <button onClick={async () => {
              const path = await window.electronAPI.selectDirectory();
              if (path) update("downloadFolder", path);
            }} className="btn-secondary text-sm px-4 h-9">Browse</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Concurrent Downloads</span>
          <select value={settings.concurrentDownloads} onChange={(e) => update("concurrentDownloads", parseInt(e.target.value))}
            className="w-24 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Default Format</span>
          <select value={settings.defaultFormat} onChange={(e) => update("defaultFormat", e.target.value)}
            className="w-32 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
            {["mp4", "mkv", "webm", "mp3", "aac", "flac"].map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Filename Template</span>
          <input type="text" value={settings.filenameTemplate} onChange={(e) => update("filenameTemplate", e.target.value)}
            className="flex-1 max-w-md ml-4 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue/50" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Network</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-300">Proxy Type</span>
          <select value={settings.proxy.type} onChange={(e) => updateProxy("type", e.target.value)}
            className="w-32 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
            <option value="none">None</option><option value="http">HTTP</option><option value="socks5">SOCKS5</option>
          </select>
        </div>
        {settings.proxy.type !== "none" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-accent-300">Host</span>
              <input type="text" value={settings.proxy.host} onChange={(e) => updateProxy("host", e.target.value)} placeholder="127.0.0.1"
                className="flex-1 max-w-md ml-4 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-accent-300">Port</span>
              <input type="number" value={settings.proxy.port} onChange={(e) => updateProxy("port", parseInt(e.target.value))} placeholder="1080"
                className="w-24 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50" />
            </div>
          </>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Behavior</h2>
        {[
          ["Auto Update", "autoUpdate"],
          ["Hardware Acceleration", "hardwareAcceleration"],
          ["Auto Resume", "autoResume"],
          ["Clipboard Monitoring", "clipboardMonitoring"],
          ["One-Click Download", "oneClickDownload"],
        ].map(([label, key]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-accent-300">{label}</span>
            <button onClick={() => update(key as keyof AppSettings, !(settings as unknown as Record<string, unknown>)[key])}
              className={`w-11 h-6 rounded-full relative transition-colors ${(settings as unknown as Record<string, unknown>)[key] ? "bg-blue" : "bg-accent-800"}`}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform" style={{ transform: (settings as unknown as Record<string, unknown>)[key] ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
