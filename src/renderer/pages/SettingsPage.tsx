import { useState, useEffect, useCallback } from "react";
import type { AppSettings, Theme } from "../../shared/types";

function ToggleSwitch({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full relative transition-all duration-200 ${
        enabled ? "bg-blue" : "bg-accent-800"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-md ${
          enabled ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-accent-900/30 last:border-0">
      <div className="flex-1 mr-4">
        <span className="text-sm text-accent-200">{label}</span>
        {description && <p className="text-xs text-accent-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { window.electronAPI.getSettings().then(setSettings); }, []);

  // Apply theme when settings change
  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else if (theme === "dark" || theme === "auto") {
      root.removeAttribute("data-theme");
    }
  };

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    await window.electronAPI.updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const update = (key: keyof AppSettings, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };
  const updateProxy = (key: string, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, proxy: { ...settings.proxy, [key]: value } });
  };

  if (!settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-100">Settings</h1>
          <p className="text-sm text-accent-500 mt-1">Configure your download preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
            saved
              ? "bg-green text-white"
              : "bg-blue/90 hover:bg-blue text-surface-400"
          } disabled:opacity-50`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </span>
          ) : "Save Settings"}
        </button>
      </div>

      {/* Appearance Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-accent-900/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Appearance</h2>
          </div>
        </div>
        <div className="p-5">
          <SettingRow label="Theme" description="Choose your preferred color scheme">
            <div className="flex gap-1 bg-accent-900/50 p-1 rounded-lg">
              {(["dark", "light", "auto"] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => update("theme", theme)}
                  className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
                    settings.theme === theme
                      ? "bg-blue text-white"
                      : "text-accent-400 hover:text-accent-200"
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Downloads Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-accent-900/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Downloads</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <SettingRow label="Download Folder" description="Where your files will be saved">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.downloadFolder}
                onChange={(e) => update("downloadFolder", e.target.value)}
                className="w-64 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
              />
              <button
                onClick={async () => {
                  const path = await window.electronAPI.selectDirectory();
                  if (path) update("downloadFolder", path);
                }}
                className="btn-secondary text-sm px-3 h-9"
              >
                Browse
              </button>
            </div>
          </SettingRow>

          <SettingRow label="Concurrent Downloads" description="Number of downloads to run simultaneously">
            <select
              value={settings.concurrentDownloads}
              onChange={(e) => update("concurrentDownloads", parseInt(e.target.value))}
              className="w-24 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
            >
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </SettingRow>

          <SettingRow label="Default Format" description="Preferred output format for downloads">
            <select
              value={settings.defaultFormat}
              onChange={(e) => update("defaultFormat", e.target.value)}
              className="w-32 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
            >
              {["mp4", "mkv", "webm", "mp3", "aac", "flac"].map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </SettingRow>

          <SettingRow label="Filename Template" description="Customize how files are named">
            <input
              type="text"
              value={settings.filenameTemplate}
              onChange={(e) => update("filenameTemplate", e.target.value)}
              className="w-64 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue/50"
            />
          </SettingRow>
        </div>
      </div>

      {/* Network Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-accent-900/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Network</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <SettingRow label="Proxy Type" description="Configure a proxy for downloads">
            <select
              value={settings.proxy.type}
              onChange={(e) => updateProxy("type", e.target.value)}
              className="w-32 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
            >
              <option value="none">None</option>
              <option value="http">HTTP</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </SettingRow>

          {settings.proxy.type !== "none" && (
            <div className="pl-4 border-l-2 border-accent-800 space-y-4">
              <SettingRow label="Proxy Host">
                <input
                  type="text"
                  value={settings.proxy.host}
                  onChange={(e) => updateProxy("host", e.target.value)}
                  placeholder="127.0.0.1"
                  className="w-48 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
                />
              </SettingRow>
              <SettingRow label="Proxy Port">
                <input
                  type="number"
                  value={settings.proxy.port}
                  onChange={(e) => updateProxy("port", parseInt(e.target.value))}
                  placeholder="1080"
                  className="w-28 h-9 px-3 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50"
                />
              </SettingRow>
            </div>
          )}
        </div>
      </div>

      {/* Behavior Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-accent-900/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v6l4 2" />
            </svg>
            <h2 className="text-sm font-semibold text-accent-300 uppercase tracking-wider">Behavior</h2>
          </div>
        </div>
        <div className="p-5">
          <SettingRow
            label="Auto Update"
            description="Automatically check for and install updates"
          >
            <ToggleSwitch enabled={settings.autoUpdate} onChange={(v) => update("autoUpdate", v)} />
          </SettingRow>
          <SettingRow
            label="Hardware Acceleration"
            description="Use GPU for better performance"
          >
            <ToggleSwitch enabled={settings.hardwareAcceleration} onChange={(v) => update("hardwareAcceleration", v)} />
          </SettingRow>
          <SettingRow
            label="Auto Resume"
            description="Resume interrupted downloads automatically"
          >
            <ToggleSwitch enabled={settings.autoResume} onChange={(v) => update("autoResume", v)} />
          </SettingRow>
          <SettingRow
            label="Clipboard Monitoring"
            description="Detect URLs copied to clipboard"
          >
            <ToggleSwitch enabled={settings.clipboardMonitoring} onChange={(v) => update("clipboardMonitoring", v)} />
          </SettingRow>
          <SettingRow
            label="One-Click Download"
            description="Start download immediately after analyzing"
          >
            <ToggleSwitch enabled={settings.oneClickDownload} onChange={(v) => update("oneClickDownload", v)} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
