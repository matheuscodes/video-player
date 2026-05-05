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
Name them using the format:

```
YYYY.MM.DD # tag1, tag two, tag3.mp4
YYYY.MM.DD # tag1, tag two, tag3.mov
```

**Examples:**
```
2024.07.04 # vacation, fireworks, summer.mp4
2024.12.25 # family, christmas, celebration.mov
```

- The date part (`YYYY.MM.DD`) is used for sorting.
- Tags are separated by `, ` (comma + space).
- Tags can be multiple words.
- Files not matching this format are ignored.

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

### Package as a Windows installer

```bash
npm run build:win
```

The `.exe` setup installer is created in `dist/`.

### Package for macOS

```bash
npm run build:mac
```

### Portable unpacked folder (for USB sticks)

```bash
npm run build:unpack
```

This produces an unpacked app directory in `dist/win-unpacked/` (or the equivalent for your OS) that can be copied to a USB stick without running an installer.  
The `Videos/` folder is placed next to the executable, so it travels with the app.

---

## USB Stick Deployment

1. Run `npm run build:unpack` on a Windows machine.
2. Copy the entire `dist/win-unpacked/` folder to the USB stick.
3. The folder already contains a `Videos/` directory — copy your video files there.
4. Double-click `VideoPlayer.exe` to launch the app directly from the USB stick (no installation required).

> **Note:** Windows may show a SmartScreen warning for unsigned executables. Click *More info -> Run anyway*.

---

## Linting & Formatting

```bash
npm run lint        # ESLint
npm run format      # Prettier
```
