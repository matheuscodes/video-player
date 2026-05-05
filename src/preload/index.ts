import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
}

const api = {
  listVideos: (): Promise<VideoEntry[]> => ipcRenderer.invoke('list-videos'),
  getVideoUrl: (filePath: string): Promise<string> => ipcRenderer.invoke('get-video-url', filePath)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
