import { ElectronAPI } from '@electron-toolkit/preload'

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
}

export interface VideoListResult {
  entries: VideoEntry[]
  sourceDir: string
}

export interface VideoAPI {
  listVideos: (sourceDir?: string) => Promise<VideoListResult>
  pickVideoDirectory: () => Promise<string | null>
  getVideoUrl: (filePath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: VideoAPI
  }
}
