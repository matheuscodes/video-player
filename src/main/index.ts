import { app, shell, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { join, extname, dirname, resolve, sep } from 'path'
import { readdirSync, existsSync } from 'fs'
import { pathToFileURL } from 'url'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ffmpegStaticPath from 'ffmpeg-static'
import icon from '../../resources/icon.png?asset'

// Must be called before app is ready. Marks the scheme as secure so the
// renderer treats it like https:// (CSP, CORS, autoplay, etc.) and enables
// streaming so the browser can send Range requests for video seeking.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'localvideo',
    privileges: { secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
  }
])

/** Locate the Videos/ folder next to the app executable (or next to the project root in dev). */
function resolveVideosDir(): string {
  if (is.dev) {
    // In dev mode look relative to the project root (where package.json lives)
    return join(app.getAppPath(), 'Videos')
  }
  // In production the executable sits in the install root; Videos/ lives beside it
  return join(dirname(process.execPath), 'Videos')
}

/**
 * Return the path to the ffmpeg binary.
 * In a packaged app the binary lives in app.asar.unpacked (set via asarUnpack in
 * electron-builder.yml). We fix up the path so the OS can actually execute it.
 */
function resolveFfmpegPath(): string {
  const raw = ffmpegStaticPath ?? ''
  return raw.replace('app.asar', 'app.asar.unpacked')
}

/**
 * Transcode a video file on-the-fly to a fragmented H.264/AAC MP4 stream that
 * Chromium can decode regardless of the original codec (H.265, ProRes, etc.).
 * Returns a streaming Response so the renderer can start playing immediately.
 */
function transcodeToFmp4(filePath: string): Response {
  if (!existsSync(filePath)) {
    return new Response('Not Found', { status: 404 })
  }

  const ffmpegBin = resolveFfmpegPath()
  const proc = spawn(ffmpegBin, [
    '-i', filePath,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-preset', 'ultrafast',
    '-f', 'mp4',
    // frag_keyframe: new MP4 fragment at every keyframe → seekable stream
    // empty_moov: write a placeholder moov at the start so playback begins immediately
    // default_base_moof: improves compatibility with Chromium's MP4 demuxer
    '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
    'pipe:1'
  ])

  proc.stderr.on('data', (chunk: Buffer) => {
    // Log ffmpeg progress/errors to the main-process console (visible in terminal)
    console.log('[ffmpeg]', chunk.toString())
  })

  // Shared flag accessible from both start() and cancel() so that cancel()
  // can prevent further enqueue/close/error calls after the stream is cancelled.
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      proc.stdout.on('data', (chunk: Buffer) => {
        if (!closed) controller.enqueue(new Uint8Array(chunk))
      })
      proc.stdout.on('end', () => {
        if (!closed) {
          closed = true
          controller.close()
        }
      })
      proc.on('exit', (code) => {
        if (!closed && code !== null && code !== 0) {
          closed = true
          controller.error(new Error(`ffmpeg exited with code ${code}`))
        }
      })
      proc.on('error', (err) => {
        if (!closed) {
          closed = true
          console.error('[ffmpeg] spawn error:', err)
          controller.error(err)
        }
      })
    },
    cancel() {
      // Mark closed first so in-flight stdout data events don't touch the controller
      closed = true
      // Try graceful shutdown first; force-kill if the process lingers
      proc.kill('SIGTERM')
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL')
      }, 2000)
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'video/mp4' }
  })
}

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
}

/**
 * Parse a video filename. Accepted formats (extension .mp4 or .mov):
 *   YYYY.MM.DD # tag1, tag2, tag3
 *   YYYY.MM.DD N tag1, tag2, tag3   (N = optional integer sequence number)
 *   YYYY.MM.DD tag1, tag2, tag3
 */
function parseVideoFilename(filename: string): VideoEntry | null {
  const ext = extname(filename).toLowerCase()
  if (ext !== '.mp4' && ext !== '.mov') return null

  const nameWithoutExt = filename.slice(0, -ext.length)

  // Match: date  then  (` # ` | ` <digits> ` | ` `)  then  tags (must start with non-whitespace)
  const match = nameWithoutExt.match(/^(\d{4}\.\d{2}\.\d{2})(?:\s+#\s+|\s+\d+\s+|\s+)(\S.*)$/)
  if (!match) return null

  const date = match[1]
  const tagsStr = match[2].trim()
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
    mainWindow.webContents.openDevTools()
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

  // Serve local video files via a dedicated protocol.
  // MP4 files are served directly via net.fetch (supports Range requests / seeking).
  // MOV files are transcoded on-the-fly to fragmented H.264 MP4 via ffmpeg so that
  // files encoded with unsupported codecs (H.265/HEVC, Apple ProRes, etc.) can play
  // in Chromium without any modification to the original files.
  const videosDir = resolveVideosDir()
  protocol.handle('localvideo', (request) => {
    const filePath = resolve(decodeURIComponent(request.url.slice('localvideo://'.length)))
    // Reject paths that escape the Videos directory (path traversal guard)
    if (!filePath.startsWith(videosDir + sep) && filePath !== videosDir) {
      return new Response('Forbidden', { status: 403 })
    }
    // Transcode MOV files on-the-fly; serve MP4 files directly
    if (extname(filePath).toLowerCase() === '.mov') {
      return transcodeToFmp4(filePath)
    }
    return net.fetch(pathToFileURL(filePath).toString(), { bypassCustomProtocolHandlers: true })
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
