import { useState, useEffect, useCallback } from "react";
import type { SchedulerTask } from "../../shared/types";

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    name: "", url: "", 
    scheduleType: "cron" as "cron" | "once",
    cronPreset: "0 * * * *",
    cronExpression: "0 * * * *", 
    datetime: "",
    outputFormat: "mp4" as SchedulerTask["outputFormat"], 
    quality: "best" as SchedulerTask["quality"], 
    action: "none" as SchedulerTask["action"] 
  });

  useEffect(() => { window.electronAPI.getScheduledTasks().then(setTasks); }, []);

  const handleAdd = useCallback(async () => {
    if (!form.name || !form.url) return;
    const taskData: any = { ...form };
    if (form.scheduleType === "cron") {
      taskData.cronExpression = form.cronPreset === "custom" ? form.cronExpression : form.cronPreset;
    }
    const task = await window.electronAPI.addScheduledTask(taskData);
    setTasks((p) => [...p, task]);
    setForm({ name: "", url: "", scheduleType: "cron", cronPreset: "0 * * * *", cronExpression: "0 * * * *", datetime: "", outputFormat: "mp4", quality: "best", action: "none" });
    setShowForm(false);
  }, [form]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-50">Scheduler</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 rounded-xl bg-blue/90 hover:bg-blue text-surface-400 font-medium transition-colors">
          {showForm ? "Cancel" : "New Task"}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Task name"
            className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50 text-sm" />
          <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL"
            className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 placeholder-accent-600 focus:outline-none focus:ring-2 focus:ring-blue/50 text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-accent-500 mb-1">Schedule Type</label>
              <select value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value as "cron" | "once" })}
                className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                <option value="cron">Recurring (Cron)</option>
                <option value="once">One-Time</option>
              </select>
            </div>
            {form.scheduleType === "cron" ? (
              <div>
                <label className="block text-xs text-accent-500 mb-1">Interval</label>
                <select value={form.cronPreset} onChange={(e) => setForm({ ...form, cronPreset: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                  <option value="0 * * * *">Hourly</option>
                  <option value="0 0 * * *">Daily</option>
                  <option value="0 0 * * 0">Weekly</option>
                  <option value="custom">Custom Cron</option>
                </select>
                {form.cronPreset === "custom" && (
                  <input type="text" value={form.cronExpression} onChange={(e) => setForm({ ...form, cronExpression: e.target.value })} placeholder="* * * * *"
                    className="w-full h-10 mt-2 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue/50" />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs text-accent-500 mb-1">Date & Time</label>
                <input type="datetime-local" value={form.datetime} onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50" />
              </div>
            )}
            <div>
              <label className="block text-xs text-accent-500 mb-1">Format</label>
              <select value={form.outputFormat} onChange={(e) => setForm({ ...form, outputFormat: e.target.value as SchedulerTask["outputFormat"] })}
                className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                {["mp4", "mkv", "mp3", "aac", "webm"].map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-accent-500 mb-1">Post-Task Action</label>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as SchedulerTask["action"] })}
                className="w-full h-10 px-4 rounded-lg bg-accent-900/50 border border-accent-800 text-accent-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue/50">
                <option value="none">None</option>
                <option value="shutdown">Shutdown PC</option>
                <option value="sleep">Sleep PC</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} className="px-6 py-2 rounded-xl bg-blue/90 hover:bg-blue text-surface-400 font-medium transition-colors">Create</button>
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <p className="text-accent-500">No scheduled tasks</p>
          </div>
        ) : tasks.map((t) => (
          <div key={t.id} className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-accent-50">{t.name}</h3>
                <p className="text-xs text-accent-500 mt-1">{t.url}</p>
                <p className="text-xs text-accent-600 mt-1">
                  {t.scheduleType === "once" ? `Once: ${new Date(t.datetime!).toLocaleString()}` : `Cron: ${t.cronExpression}`} - {t.outputFormat.toUpperCase()}
                  {t.action !== "none" && ` - Action: ${t.action}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { await window.electronAPI.updateScheduledTask(t.id, { enabled: !t.enabled }); setTasks((p) => p.map((x) => x.id === t.id ? { ...x, enabled: !x.enabled } : x)); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${t.enabled ? "bg-blue" : "bg-accent-800"}`}>
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform" style={{ transform: t.enabled ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
                <button onClick={async () => { await window.electronAPI.deleteScheduledTask(t.id); setTasks((p) => p.filter((x) => x.id !== t.id)); }}
                  className="text-xs text-red hover:text-red-light px-2 py-1 rounded hover:bg-red/10 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
