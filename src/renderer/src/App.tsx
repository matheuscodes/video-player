import { useEffect, useState, useCallback, useMemo } from 'react'
import TagSidebar from './components/TagSidebar'
import Playlist from './components/Playlist'
import VideoPlayer from './components/VideoPlayer'
import './assets/app.css'

export interface VideoEntry {
  filename: string
  filePath: string
  date: string
  tags: string[]
  url?: string
}

function App(): React.JSX.Element {
  const [allVideos, setAllVideos] = useState<VideoEntry[]>([])
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<string[]>([])
  /** The order in which videos are displayed (can be sorted or shuffled). */
  const [playlistOrder, setPlaylistOrder] = useState<VideoEntry[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load videos on mount
  useEffect(() => {
    async function loadVideos(): Promise<void> {
      setIsLoading(true)
      try {
        const entries = await window.api.listVideos()

        // Resolve video URLs for all entries
        const videosWithUrls = await Promise.all(
          entries.map(async (entry) => {
            const url = await window.api.getVideoUrl(entry.filePath)
            return { ...entry, url }
          })
        )

        // Collect unique tags (sorted alphabetically)
        const tagSet = new Set<string>()
        for (const v of videosWithUrls) {
          for (const tag of v.tags) tagSet.add(tag)
        }
        const sortedTags = Array.from(tagSet).sort()

        setAllVideos(videosWithUrls)
        setAllTags(sortedTags)
        setActiveTags(new Set(sortedTags)) // all tags selected by default
        setPlaylistOrder(videosWithUrls) // initial order = date-sorted from main process
      } catch (err) {
        console.error('Failed to load videos:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadVideos()
  }, [])

  // Derive filtered video list from the current playlist order and active tags
  const filteredVideos = useMemo(() => {
    if (activeTags.size === 0) return []
    return playlistOrder.filter((v) => v.tags.some((t) => activeTags.has(t)))
  }, [activeTags, playlistOrder])

  const handleTagToggle = useCallback((tag: string, checked: boolean) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (checked) next.add(tag)
      else next.delete(tag)
      return next
    })
  }, [])

  const handleSelectAllTags = useCallback(
    (select: boolean) => {
      if (select) setActiveTags(new Set(allTags))
      else setActiveTags(new Set())
    },
    [allTags]
  )

  const handleVideoSelect = useCallback((video: VideoEntry) => {
    setCurrentVideo(video)
  }, [])

  // Advance to the next video in the filtered list when the current one ends.
  const handleVideoEnd = useCallback(() => {
    setCurrentVideo((current) => {
      if (!current) return null
      const idx = filteredVideos.findIndex((v) => v.filePath === current.filePath)
      return filteredVideos[idx + 1] ?? null
    })
  }, [filteredVideos])

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>🎬 Video Player</h1>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <TagSidebar
            allTags={allTags}
            activeTags={activeTags}
            onTagToggle={handleTagToggle}
            onSelectAll={handleSelectAllTags}
          />
        </aside>
        <main className="playlist-panel">
          {isLoading ? (
            <div className="loading">Loading videos…</div>
          ) : (
            <Playlist
              videos={filteredVideos}
              currentVideo={currentVideo}
              onVideoSelect={handleVideoSelect}
              onPlaylistOrderChange={setPlaylistOrder}
              allVideos={allVideos}
            />
          )}
        </main>
        <section className="player-panel">
          <VideoPlayer video={currentVideo} onVideoEnd={handleVideoEnd} />
        </section>
      </div>
    </div>
  )
}

export default App
