# Universal Media Downloader

Universal Media Downloader is a powerful, modern, and cross-platform desktop application built with Electron, React, Vite, and Tailwind CSS. It leverages the power of `yt-dlp` and `FFmpeg` to download video, audio, and torrent streams with unparalleled speed and reliability.

## 🚀 Features
- **Ultimate Media Support**: Download from thousands of websites (powered by yt-dlp).
- **Torrent/Magnet Streaming**: Seamless peer-to-peer downloads with zero seeding via `torrent-stream`.
- **Beautiful UI**: Modern glassmorphism UI with violet/indigo gradients.
- **Conversion & Merging**: Embedded FFmpeg pipeline for complex video-audio merging and format conversion.
- **Mobile Standalone App**: A fully native Android counterpart being built in React Native inside the `mobile/` directory.

## 🏗️ Architecture

Below is the high-level architecture diagram illustrating how the Electron Main Process communicates with native binaries, the React frontend, and the future Mobile app.

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

    %% Mobile Architecture (Option 2)
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

## 💻 Development (Desktop)

To run the Electron application locally:

```bash
# Install dependencies
npm install

# Start the dev server and Electron
npm run dev
```

To build the executable (Windows/Mac/Linux):
```bash
npm run build
```

## 📱 Development (Mobile)

The standalone Android app (Option 2) lives in the `mobile/` directory.

```bash
cd mobile
npm install
npx react-native run-android
```

## 🛠️ GitHub Actions (CI)
The project utilizes automated CI pipelines for seamless deployment:
- **`build.yml`**: Compiles the Electron application for Windows & Mac and packages the executable.
- **`android-native.yml`**: Compiles the React Native application using Gradle and generates an `app-debug.apk`.

> [!NOTE]
> All artifacts are securely hosted by GitHub Actions upon successful pushes to the main branch.
