# 🎬 Video Player

A desktop application that reads and plays tagged videos from a local folder.  
Built with **Electron**, **React**, and **TypeScript** using the **electron-vite** toolchain.

---

## Features

- 📂 Reads `.mp4` and `.mov` files from a `Videos/` folder
- 🏷️ Parses tags from filenames (`YYYY.MM.DD # tag1, tag2, tag3`)
- ✅ Filter videos by tag (checkboxes in the sidebar)
- 📅 Default sort by date; **Shuffle** button to randomize playlist
- ▶️ Built-in video player with **skip forward (+10 s)** and **fullscreen** support
- 📦 Packagable as a portable Windows installer (USB-stick friendly)
- 🍎 Also supports macOS

---

## Filename Convention

Place your video files inside the `Videos/` folder.  
All of the following formats are supported (extension `.mp4` or `.mov`):

```
YYYY.MM.DD # tag1, tag two, tag3
YYYY.MM.DD N tag1, tag two, tag3    (N = integer sequence number, e.g. 1, 2, 3)
YYYY.MM.DD Na tag1, tag two, tag3   (Na = alphanumeric sequence, e.g. 4a, 4b)
YYYY.MM.DD N                        (sequence only, no tags)
YYYY.MM.DD tag1, tag two, tag3      (no sequence number)
YYYY.MM.DD                          (date only, no tags)
```

**Examples:**
```
2024.07.04 # vacation, fireworks, summer.mp4
2024.12.25 # family, christmas, celebration.mov
2024.04.03 1 hiking, mountains.mp4
2024.04.03 2 hiking, mountains.mp4
2024.04.03 4a standing.mov
2024.04.03 4b standing.mov
2024.04.03 5.mov
2024.04.03.mp4
```

- The date part (`YYYY.MM.DD`) is used for sorting.
- Tags are separated by `, ` (comma + space).
- Tags can be multiple words.
- Files with no tags are labeled **"no tag"** in the sidebar.
- Files not starting with a valid date are ignored.

---

## Tech Stack & Why

| Tool | Purpose | Why chosen |
|---|---|---|
| **Electron** | Desktop shell | Cross-platform native wrapper; gives full file-system access |
| **React 19** | UI library | Component-based, huge ecosystem, excellent TypeScript support |
| **TypeScript** | Type safety | Catches bugs at compile-time, better IDE experience |
| **Vite / electron-vite** | Build tool | Very fast HMR, first-class Electron+React integration |
| **electron-builder** | Packaging | NSIS installer for Windows, DMG for macOS, AppImage for Linux |

---

## Project Structure

```
video-player/
├── src/
│   ├── main/           # Electron main process
│   │   └── index.ts    # Window creation, IPC handlers, file scanning
│   ├── preload/        # Secure bridge between main and renderer
│   │   ├── index.ts
│   │   └── index.d.ts
│   └── renderer/       # React front-end
│       ├── index.html
│       └── src/
│           ├── App.tsx              # Root component & state
│           ├── main.tsx             # React entry point
│           ├── assets/app.css       # Global styles
│           └── components/
│               ├── TagSidebar.tsx   # Tag filter panel
│               ├── Playlist.tsx     # Video list with sort/shuffle
│               └── VideoPlayer.tsx  # HTML5 video player
├── Videos/             # Put your video files here
├── build/              # Electron-builder assets (icons, entitlements)
├── electron-builder.yml
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- **Node.js** >= 18 ([nodejs.org](https://nodejs.org))
- **npm** >= 9 (comes with Node.js)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development mode

```bash
npm run dev
```

This starts the app with hot-module replacement. Any changes to the renderer source are applied instantly.

### 3. Add your own videos

Drop `.mp4` or `.mov` files into the `Videos/` folder following the naming convention above.  
The app ships with a few minimal sample files for demonstration.

---

## Building

### Type-check only

```bash
npm run typecheck
```

### Build (compile, no installer)

```bash
npm run build
```

### Package for Windows

```bash
npm run build:win
```

This produces two artifacts in `dist/`:

| File | What it is | Recommended? |
|---|---|---|
| `VideoPlayer-1.0.0-win.zip` | Zip archive of the full app folder | ✅ **Yes – use this** |
| `VideoPlayer-1.0.0.exe` | NSIS self-extracting portable exe | ⚠️ May be flagged by AV |

**Use the zip**: extract it anywhere, place a `Videos/` folder next to `VideoPlayer.exe`, and double-click to run.  
Windows Defender and other AV tools are much less likely to flag a plain exe than an NSIS self-extractor.

### Package for macOS

```bash
npm run build:mac
```

### Portable unpacked folder (for USB sticks / fastest start)

```bash
npm run build:unpack
```

This produces an unpacked app directory in `dist/win-unpacked/` (or the equivalent for your OS).  
Copy the entire folder to a USB stick and add your `Videos/` folder next to the exe.

---

## Distribution & Running

### Recommended: zip distribution (Windows)

1. Run `npm run build:win` on Windows.
2. Distribute `VideoPlayer-1.0.0-win.zip`.
3. The recipient:
   - Extracts the zip → gets a `VideoPlayer-win32-x64/` (or similar) folder.
   - Creates a `Videos/` folder **inside that folder**, next to `VideoPlayer.exe`.
   - Copies video files there (named according to the convention below).
   - Double-clicks `VideoPlayer.exe`.

```
VideoPlayer-win32-x64/
├── VideoPlayer.exe   ← run this
├── Videos/           ← put your .mp4 / .mov files here
│   ├── 2024.07.04 # vacation, fireworks.mp4
│   └── 2024.12.25 # family, christmas.mov
└── resources/  (Electron internals — do not modify)
```

### USB Stick Deployment (unpacked)

1. Run `npm run build:unpack` on a Windows machine.
2. Copy the entire `dist/win-unpacked/` folder to the USB stick.
3. Add a `Videos/` directory inside that folder and copy your video files there.
4. Double-click `VideoPlayer.exe` to launch directly from the USB stick.

> **Note:** Windows SmartScreen may warn about unsigned executables.  
> Click *More info → Run anyway*. The zip-based distribution triggers this far less often than the self-extracting portable exe.

---

## Linting & Formatting

```bash
npm run lint        # ESLint
npm run format      # Prettier
```
