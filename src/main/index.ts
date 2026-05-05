import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join, extname, dirname } from 'path'
import { readdirSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

/** Locate the Videos/ folder next to the app executable (or next to the project root in dev). */
function resolveVideosDir(): string {
  if (is.dev) {
    // In dev mode look relative to the project root (where package.json lives)
    return join(app.getAppPath(), 'Videos')
  }
  // In production the executable sits in the install root; Videos/ lives beside it
  return join(dirname(process.execPath), 'Videos')
}

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
}

/** Parse a video filename of the form "YYYY.MM.DD # tag1, tag2, tag3" */
function parseVideoFilename(filename: string): VideoEntry | null {
  const ext = extname(filename).toLowerCase()
  if (ext !== '.mp4' && ext !== '.mov') return null

  const nameWithoutExt = filename.slice(0, -ext.length)
  const separatorIdx = nameWithoutExt.indexOf(' # ')
  if (separatorIdx === -1) return null

  const date = nameWithoutExt.slice(0, separatorIdx).trim()
  const tagsStr = nameWithoutExt.slice(separatorIdx + 3).trim()
  const tags = tagsStr
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  return { filename, filePath: '', date, tags }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.video-player')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Serve local video files via a dedicated protocol to avoid cross-origin issues
  // without having to disable webSecurity globally.
  protocol.registerFileProtocol('localvideo', (request, callback) => {
    // Strip the scheme (localvideo://) and decode the path
    const filePath = decodeURIComponent(request.url.slice('localvideo://'.length))
    callback({ path: filePath })
  })

  // IPC: list all video files from the Videos/ folder
  ipcMain.handle('list-videos', (): VideoEntry[] => {
    const videosDir = resolveVideosDir()
    if (!existsSync(videosDir)) return []

    const entries: VideoEntry[] = []
    try {
      const files = readdirSync(videosDir)
      for (const file of files) {
        const entry = parseVideoFilename(file)
        if (entry) {
          entry.filePath = join(videosDir, file)
          entries.push(entry)
        }
      }
    } catch (err) {
      console.error('Error reading Videos directory:', err)
    }

    // Sort by date ascending by default
    entries.sort((a, b) => a.date.localeCompare(b.date))
    return entries
  })

  // IPC: convert an absolute file path to a localvideo:// URL for the renderer
  ipcMain.handle('get-video-url', (_event, filePath: string): string => {
    return `localvideo://${encodeURIComponent(filePath)}`
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
