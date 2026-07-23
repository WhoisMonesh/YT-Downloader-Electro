import { useState, useCallback } from "react";
import { AUDIO_FORMATS, VIDEO_FORMATS } from "../../shared/constants";
import type { OutputFormat } from "../../shared/types";

export default function ConverterPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [converting, setConverting] = useState(false);

  const handleSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.multiple = true; input.accept = "video/*,audio/*";
    input.onchange = () => { if (input.files) setFiles(Array.from(input.files).map((f) => f.name)); };
    input.click();
  }, []);

  const handleConvert = useCallback(async () => {
    setConverting(true);
    for (const file of files) {
      try {
        await window.electronAPI.convertFile({ inputPath: file, outputPath: file.replace(/\.[^.]+$/, `.${format}`), outputFormat: format });
      } catch (e) { console.error(e); }
    }
    setConverting(false);
  }, [files, format]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-accent-100">Converter</h1>
      <div className="glass-panel p-6 space-y-4">
        <div>
          <label className="block text-sm text-accent-400 mb-2">Output Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="select-field w-full">
            <optgroup label="Audio">{AUDIO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
            <optgroup label="Video">{VIDEO_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}</optgroup>
          </select>
        </div>
        <div className="border-2 border-dashed border-accent-800 rounded-xl p-8 text-center">
          {files.length > 0 ? (
            <div className="space-y-2">
              <p className="text-accent-200">{files.length} file(s) selected</p>
              <div className="max-h-32 overflow-auto text-xs text-accent-500 space-y-1">{files.map((f, i) => <p key={i} className="truncate">{f}</p>)}</div>
            </div>
          ) : <p className="text-accent-500">Click below to select files</p>}
          <button onClick={handleSelect} className="btn-secondary mt-4">Select Files</button>
        </div>
        <button onClick={handleConvert} disabled={files.length === 0 || converting} className="btn-primary w-full">{converting ? "Converting..." : "Convert"}</button>
      </div>
    </div>
  );
}
