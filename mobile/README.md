# Standalone Native App Architecture (mobile/)

This directory contains the scaffolding for the **Standalone React Native Android App** (Option 2). Because Node.js cannot run the `yt-dlp` executable or standard Electron APIs on Android, this app is built entirely natively.

## How it works (Architecture)

1. **User Interface (React Native)**:
   The UI should be built using React Native `<View>` and `<Text>` components, communicating with native modules for downloading.

2. **yt-dlp via Chaquopy**:
   To parse and extract YouTube/Media URLs, the app must bundle a Python interpreter. You will need to integrate the [Chaquopy plugin](https://chaquo.com/chaquopy/) into `mobile/android/app/build.gradle`. Chaquopy allows React Native to call Python functions directly using a JNI bridge. The Python environment will run `yt-dlp` as a module.

3. **FFmpeg-Kit React Native**:
   To merge audio and video formats, you must use the `ffmpeg-kit-react-native` package.

4. **Torrent Streaming**:
   You can use `react-native-torrent` or a similar libtorrent wrapper to handle magnet links.

## Automated Builds
A GitHub Actions workflow (`.github/workflows/android-native.yml`) has been created at the root of the repository. Every time you push changes to the `mobile/` directory, GitHub will automatically:
- Install dependencies via npm.
- Setup the Android SDK & Java 17.
- Build the `app-debug.apk` using Gradle.
- Output the `.apk` as a downloadable artifact.

## Getting Started

To test this locally:
```bash
cd mobile
npm install
npx react-native run-android
```
