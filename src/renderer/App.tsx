import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DownloadsPage from "./pages/DownloadsPage";
import PlaylistPage from "./pages/PlaylistPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import ConverterPage from "./pages/ConverterPage";
import SchedulerPage from "./pages/SchedulerPage";
import QueuePage from "./pages/QueuePage";

export default function App() {
  return (
    <>
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
    </>
  );
}
