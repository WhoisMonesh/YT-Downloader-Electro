import { useState, useCallback, DragEvent } from "react";
import { AUDIO_FORMATS, VIDEO_FORMATS } from "../../shared/constants";
import type { OutputFormat } from "../../shared/types";

interface FileItem {
  name: string;
  path?: string;
  size: number;
  status: "pending" | "converting" | "completed" | "error";
  progress?: number;
  error?: string;
}

export default function ConverterPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [converting, setConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelect = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.selectFile([
        { name: "Media Files", extensions: ["mp4", "mkv", "avi", "mov", "webm", "flv", "mp3", "flac", "aac", "ogg", "wav", "m4a", "opus"] }
      ]);
      if (filePath) {
        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        // Add the file with the path - backend will handle the actual conversion
        setFiles((prev) => [...prev, {
          name: fileName,
          path: filePath,
          size: 0,
          status: "pending" as const,
        }]);
      }
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  }, []);

  // Also support drag and drop
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("video/") || f.type.startsWith("audio/")
    );
    if (droppedFiles.length > 0) {
      const newFiles = droppedFiles.map((f) => ({
        name: f.name,
        path: (f as any).path || f.name,
        size: f.size,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  // Handle file paths from the backend
  const handleFilePath = useCallback(async (filePath: string) => {
    if (!filePath) return;
    const fileName = filePath.split(/[\\/]/).pop() || filePath;
    setFiles((prev) => [...prev, {
      name: fileName,
      path: filePath,
      size: 0,
      status: "pending" as const,
    }]);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0 || converting) return;
    setConverting(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      const inputPath = files[i].path || files[i].name;
      if (!inputPath) {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: "error",
            error: "No file path available",
          };
          return updated;
        });
        continue;
      }

      setFiles((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: "converting", progress: 0 };
        return updated;
      });

      try {
        const inputName = inputPath.replace(/\.[^.]+$/, '');
        await window.electronAPI.convertFile({
          inputPath: inputPath,
          outputPath: `${inputName}_converted.${format}`,
          outputFormat: format,
        });
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "completed", progress: 100 };
          return updated;
        });
      } catch (e) {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: "error",
            error: e instanceof Error ? e.message : "Conversion failed",
          };
          return updated;
        });
      }
    }
    setConverting(false);
  }, [files, format]);

  const fmtSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-accent-100">Converter</h1>
        <p className="text-sm text-accent-500 mt-1">Convert media files between different formats</p>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <div>
          <label className="block text-sm text-accent-400 mb-2">Output Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
            className="select-field w-full"
          >
            <optgroup label="Audio">
              {AUDIO_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </optgroup>
            <optgroup label="Video">
              {VIDEO_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-blue bg-blue/10"
              : "border-accent-800 hover:border-accent-700"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-accent-200">
                  {files.length} file(s) selected
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {completedCount > 0 && (
                    <span className="text-green flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {completedCount}
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {errorCount}
                    </span>
                  )}
                  <button onClick={clearAll} className="text-accent-500 hover:text-accent-300">
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-auto space-y-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg bg-accent-900/30"
                  >
                    <div className="shrink-0">
                      {file.status === "pending" && (
                        <svg className="w-5 h-5 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                      {file.status === "converting" && (
                        <svg className="w-5 h-5 text-blue animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                      )}
                      {file.status === "completed" && (
                        <svg className="w-5 h-5 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      )}
                      {file.status === "error" && (
                        <svg className="w-5 h-5 text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-accent-200 truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-accent-500">{fmtSize(file.size)}</span>
                        {file.status === "converting" && (
                          <div className="flex-1 h-1 bg-accent-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue transition-all duration-300"
                              style={{ width: `${file.progress || 0}%` }}
                            />
                          </div>
                        )}
                        {file.status === "error" && file.error && (
                          <span className="text-xs text-red truncate">{file.error}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="shrink-0 p-1 text-accent-500 hover:text-red transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-accent-900/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-accent-400">Drag & drop files here</p>
              <p className="text-xs text-accent-600">or click to browse</p>
            </div>
          )}
          <button onClick={handleSelect} className="btn-secondary mt-4">
            {files.length > 0 ? "Add More Files" : "Select Files"}
          </button>
        </div>

        <button
          onClick={handleConvert}
          disabled={files.length === 0 || converting || pendingCount === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {converting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Converting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              Convert {pendingCount > 0 ? `(${pendingCount})` : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
