import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import TorrentPage from "./pages/TorrentPage";
import DownloadsPage from "./pages/DownloadsPage";
import PlaylistPage from "./pages/PlaylistPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import ConverterPage from "./pages/ConverterPage";
import SchedulerPage from "./pages/SchedulerPage";
import QueuePage from "./pages/QueuePage";
import { useEffect } from "react";

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    console.log("App mounted");
    console.log("electronAPI available:", typeof window.electronAPI !== "undefined");
    if (typeof window.electronAPI !== "undefined") {
      console.log("electronAPI methods:", Object.keys(window.electronAPI));
      
      // Load initial settings for global theme
      window.electronAPI.getSettings().then(settings => {
        if (settings?.theme) {
          const root = document.documentElement;
          if (settings.theme === "light") {
            root.setAttribute("data-theme", "light");
          } else {
            root.removeAttribute("data-theme");
          }
        }
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#181825",
            color: "#cdd6f4",
            border: "1px solid #313244",
            borderRadius: "12px",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="torrent" element={<TorrentPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="playlist" element={<PlaylistPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="converter" element={<ConverterPage />} />
          <Route path="scheduler" element={<SchedulerPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
