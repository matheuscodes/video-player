import { ElectronAPI } from '@electron-toolkit/preload'

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
}

export interface VideoAPI {
  listVideos: () => Promise<VideoEntry[]>
  getVideoUrl: (filePath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: VideoAPI
  }
}
