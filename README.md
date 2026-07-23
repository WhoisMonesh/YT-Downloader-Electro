# Universal Media Downloader

A professional, modern, cross-platform desktop application built with Electron that downloads online media and converts it into multiple formats.

## Features

- Download videos, audio, playlists, and channels
- Multiple output formats (MP4, MKV, MP3, FLAC, etc.)
- Quality selection (up to 8K)
- Built-in converter with trimming, cropping, and more
- Download queue with pause, resume, and priority
- Scheduled downloads
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
