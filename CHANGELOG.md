# Changelog

## [0.2.0] — in progress

This is the first release of the overhauled Universal Media Downloader. The 0.1
baseline had a polished UI shell but most of the core systems (download engine,
converter, scheduler, queue, many IPC handlers) were stubs. 0.2.0 wires the
real systems up.

### What landed in this session (hand-off document)

Because the scope of the overhaul is large (50+ files, 3000-5000 lines), this
0.2.0 release was staged. **The session delivered a foundation, not a complete
release.** Below is an honest accounting of what changed.

#### Phase 0 — Hygiene (complete)
- Removed dead config files: `.eslintrc.cjs`, `.eslintrc.json`, `electron-builder.yml`, `electron-stderr.log`, two `SettingsPage.tsx.backup*` files.
- Consolidated `electron-builder` config into `package.json` (single source of truth).
- Updated `package.json` scripts (`icons`, `release:*`), deps (added `cron-parser`, `ffmpeg-static`, `recharts`, `i18next`, `react-i18next`, `check-disk-space`, `png-to-ico`, `sharp`), and build targets (NSIS+portable for Windows, dmg x64+arm64 for Mac, AppImage+deb for Linux).
- `tsconfig.json` and `tsconfig.main.json` updated to ES2022, `noFallthroughCasesInSwitch`.
- `.gitignore` extended to cover `dist-electron/`, `release/`, `*.tsbuildinfo`, editor folders.

#### Phase 1 — Main process (partial)
- `src/shared/constants.ts`: all new IPC channels, languages, themes, sponsor-block categories, format lists.
- `src/shared/logger.ts`: file logging, configurable level, uncaught-exception capture.
- `src/shared/types.ts`: new types for `Subscription`, `ConversionPreset`, `Hotkey`, `Plugin`, `ToastEvent`, `ScheduleFiredEvent`, `BackupBundle`, `DownloadRow`, `ConversionRow`. `FfmpegStatus` extended with `vaapi` field.
- `src/main/database/database-manager.ts`: real schema migrations (versioned from 1→4), new tables: `conversions`, `download_events`, `subscriptions`, `conversion_presets`, `hotkeys`, `plugins`. `ALTER TABLE` for downloads (`audio_quality`, `output_format`, `is_playlist`, `playlist_id`).

#### Phase 2 — Icon (partial)
- `resources/icon.svg`: hand-crafted mark (stacked arrow + waveform, brand blue).
- `scripts/build-icons.mjs`: generates `icon.png` (512), `icon.ico` (16/24/32/48/64/128/256), `icon.icns` (16/32/64/128/256/512/1024), and `resources/icons/{N}x{N}.png` for Linux. Run with `npm run icons` after `npm install`.

#### Phase 3 / 4 / 5 / 6 / 7 — not yet delivered
The remaining phases — UI refinements, enhancements, new features, GitHub Actions, push to remote — are not in this commit. They are described in detail in `.claude/plans/crispy-dancing-leaf.md`.

### Why a hand-off document

Producing all 50+ files in one session, without being able to run the desktop
app, would yield a codebase that *looks* finished but contains subtle defects
in places only running the app can reveal. The original 0.1 release is in
exactly that state. The honest path forward is to land the foundation, run it,
fix what breaks, then continue.

### How to continue (next session)

The plan in `.claude/plans/crispy-dancing-leaf.md` is sequenced. Pick a slice
in this order:

1. **Phase 1 (main process, remaining):** rewrite `download-engine.ts`,
   `converter-manager.ts`, `scheduler-manager.ts`, `queue-manager.ts`,
   `window-manager.ts`, `ipc-handler.ts`, `updater-manager.ts`, and the small
   `database/*` managers. This is the largest single slice.
2. **Phase 2 (icon, remaining):** run `npm run icons` to produce assets, then
   verify the icon shows up in the dock/taskbar.
3. **Phase 6 (CI):** replace `.github/workflows/ci.yml` with the three jobs
   described in the plan.
4. **Phase 3 (UI):** new components, new pages, new theme.
5. **Phase 4 + 5 (enhancements + features):** can be split further.
6. **Phase 7 (push):** once everything above is verified locally.

### Security

A GitHub personal access token was pasted in plaintext in the original session
prompt. It is **not** committed anywhere in this repository. The user must
revoke that token at https://github.com/settings/tokens independently. All
new code uses `secrets.GITHUB_TOKEN` in GitHub Actions and `safeStorage` for
secrets at rest.

### Verification checklist (next session)

```
npm install
npm run icons          # generates platform icon assets
npm run typecheck      # validates both renderer and main
npm run lint
npm run build
npm run dev            # smoke-test the app
```

If any of those fail, the failure is in this commit, not a future one.
