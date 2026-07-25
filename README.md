# Universal Media Downloader

A professional, modern, cross-platform desktop application built with Electron that downloads online media and converts it into multiple formats.

## Features

- Download videos, audio, playlists, and channels
- Multiple output formats (MP4, MKV, MP3, FLAC, etc.)
- Quality selection (up to 8K)
- Built-in converter with trimming, cropping, and more
- Advanced Download queue with pause, resume, reordering, and priority
- Scheduled downloads (One-time and Recurring tasks)
- Multi-Threaded Acceleration (Aria2c) for faster downloads
- Magnet and Torrent Link Support (via Aria2c)
- YouTube Authenticator (extract cookies from browsers)
- Smart Clipboard Monitor (automatically detects media URLs)
- Watch Folders (batch import from .txt/.csv files)
- Post-Download Power Actions (Shutdown/Sleep after queue finishes)
- Smart URL Rules Engine (regex-based format and quality assignment)
- RSS & Channel Auto-Monitor (automatically queue new videos)
- Cloud Sync (WebDAV settings and history synchronization)
- SponsorBlock Integration (skip sponsored segments)
- In-App Mini Media Player (preview downloads directly in app)
- Dark theme with modern UI
- Auto-updates

## Tech Stack

- **Electron** - Desktop framework
- **React + TypeScript** - Frontend
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **yt-dlp** - Media extraction
- **FFmpeg** - Media conversion
- **better-sqlite3** - Local database
- **electron-store** - Settings persistence

## Development

```bash
# Install dependencies
npm install

# Start development
npm run electron:dev

# Build for production
npm run build

# Package for distribution
npm run package
```

## Project Structure

```
src/
  main/           # Electron main process
    database/     # SQLite database layer
    downloader/   # yt-dlp wrapper and download engine
    converter/    # FFmpeg conversion engine
    queue/        # Download queue manager
    scheduler/    # Scheduled task manager
    ffmpeg/       # FFmpeg manager
    updater/      # Auto-updater
    ipc/          # IPC handlers
    settings/     # Settings manager
  renderer/       # React frontend
    pages/        # Page components
    components/   # Reusable UI components
    hooks/        # Custom React hooks
    store/        # Zustand stores
  shared/         # Shared types, constants, utilities
```

## License

MIT
