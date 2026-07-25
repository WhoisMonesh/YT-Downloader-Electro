<div align="center">
  <img src="resources/icon.png" width="150" alt="Universal Media Downloader Icon" />
  
  # Universal Media Downloader
  
  **A beautiful, lightning-fast, and powerful cross-platform media extraction tool.**
  
  [![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#-download)
  [![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](#-download)
  [![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)

</div>

---

## 📥 Download (Latest Releases)

Get the latest versions directly from our automated deployment pipelines. No zips, no extracting, just one-click direct installs!

### 💻 Desktop (Windows)
> **[⬇️ Download Universal Media Downloader (.exe)](https://github.com/WhoisMonesh/YT-Downloader-Electro/releases/download/latest/Universal.Media.Downloader.0.2.0.exe)**

### 📱 Mobile (Android)
> **[⬇️ Download Universal Media Downloader (.apk)](https://github.com/WhoisMonesh/YT-Downloader-Electro/releases/download/mobile-latest/app-debug.apk)**

---

## ✨ What's New: UI & Aesthetic Upgrades

We've completely overhauled the UI to provide a state-of-the-art, premium experience:
- **Glassmorphism & Gradients**: Deep violet and indigo gradients overlayed with frosted glass panels.
- **Custom Fonts & Micro-animations**: Integrated the sleek **Outfit** font family alongside buttery smooth hover states and transition animations.
- **Custom Application Icons**: Full high-density native application icons built deeply into the Windows `.exe` and the Android `.apk`.
- **Dynamic Layout**: A fully responsive sidebar, sleek download queue visuals, and premium dark-mode aesthetics.

---

## 🚀 Features
- **Ultimate Media Support**: Download from thousands of websites (powered by highly optimized `yt-dlp`).
- **Torrent/Magnet Streaming**: Seamless peer-to-peer downloads with zero seeding via `torrent-stream`.
- **Conversion & Merging**: Embedded FFmpeg pipeline for complex video-audio merging and format conversion right on your machine.
- **Native Android Client**: A fully standalone Android counterpart utilizing React Native, delivering the same immense power to your phone.

---

## 🏗️ Architecture Diagram

Below is the high-level architecture diagram illustrating how the Electron Main Process communicates with native binaries, the React frontend, and the Android mobile app.

```mermaid
graph TD
    %% Desktop Architecture
    subgraph Desktop [Electron Desktop App]
        UI[React/Vite Frontend]
        Main[Electron Main Process]
        API[IPC Bridge]
        DB[(SQLite Database)]
        
        UI <-->|IPC Events| API
        API <--> Main
        
        Main --> DB
        
        subgraph Binaries [Native Binaries]
            YTDLP[yt-dlp.exe]
            FFMPEG[ffmpeg.exe]
            NodeTorrent[torrent-stream]
        end
        
        Main -->|Spawns| YTDLP
        Main -->|Spawns| FFMPEG
        Main -->|Uses| NodeTorrent
    end

    %% Mobile Architecture
    subgraph Mobile [Standalone Android App]
        RN[React Native UI]
        Chaquopy[Chaquopy Python Bridge]
        FFmpegKit[FFmpeg-Kit Native]
        LibTorrent[LibTorrent]
        
        RN -->|JNI| Chaquopy
        RN -->|JNI| FFmpegKit
        RN -->|JNI| LibTorrent
        
        Chaquopy -->|Runs| MobileYTDLP[yt-dlp python module]
    end

    classDef desktop fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef mobile fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef binary fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    
    class UI,Main,API desktop;
    class RN,Chaquopy,FFmpegKit mobile;
    class YTDLP,FFMPEG,NodeTorrent,MobileYTDLP binary;
```

---

## 💻 Development (Desktop)

To run the Electron application locally:

```bash
# Install dependencies
npm install

# Start the dev server and Electron
npm run dev
```

To build the executable manually (Windows/Mac/Linux):
```bash
npm run build
npm run package
```

## 📱 Development (Mobile)

The standalone Android app lives in the `mobile/` directory.

```bash
cd mobile
npm install
npx react-native run-android
```
