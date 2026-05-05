import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import TagSidebar from './components/TagSidebar'
import Playlist from './components/Playlist'
import VideoPlayer from './components/VideoPlayer'
import DateRangeBar from './components/DateRangeBar'
import './assets/app.css'

/** Convert a video date string "YYYY.MM.DD" to HTML date input format "YYYY-MM-DD". */
function videoDateToInput(d: string): string {
  return d.replace(/\./g, '-')
}

/** Convert an HTML date input string "YYYY-MM-DD" back to video date format "YYYY.MM.DD". */
function inputToVideoDate(d: string): string {
  return d.replace(/-/g, '.')
}

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

  // Date range filter — stored as HTML input format (YYYY-MM-DD)
  const [minDate, setMinDate] = useState<string>('')
  const [maxDate, setMaxDate] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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

        // Initialise date range from the oldest/newest video
        if (videosWithUrls.length > 0) {
          const dates = videosWithUrls.map((v) => videoDateToInput(v.date)).sort()
          const earliest = dates[0]
          const latest = dates[dates.length - 1]
          setMinDate(earliest)
          setMaxDate(latest)
          setStartDate(earliest)
          setEndDate(latest)
        }
      } catch (err) {
        console.error('Failed to load videos:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadVideos()
  }, [])

  // Derive filtered video list from the current playlist order, active tags and date range
  const filteredVideos = useMemo(() => {
    if (activeTags.size === 0) return []
    return playlistOrder.filter((v) => {
      if (!v.tags.some((t) => activeTags.has(t))) return false
      // Date range filter: compare YYYY.MM.DD lexicographically
      const vd = v.date
      if (startDate && vd < inputToVideoDate(startDate)) return false
      if (endDate && vd > inputToVideoDate(endDate)) return false
      return true
    })
  }, [activeTags, playlistOrder, startDate, endDate])

  // Keep a ref to the latest filtered list so handleVideoEnd always sees
  // the current value without needing filteredVideos in its dependency array.
  const filteredVideosRef = useRef<VideoEntry[]>(filteredVideos)
  useEffect(() => {
    filteredVideosRef.current = filteredVideos
  }, [filteredVideos])

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
  // Wraps around from the last video back to the first.
  // If the current video is no longer in the filtered list (e.g. filtered out),
  // start from the beginning.
  // Reads the ref so it always uses the latest filtered list regardless of
  // when the video-end event fires.
  const handleVideoEnd = useCallback(() => {
    setCurrentVideo((current) => {
      const list = filteredVideosRef.current
      if (list.length === 0) return null
      if (!current) return list[0]
      const idx = list.findIndex((v) => v.filePath === current.filePath)
      // idx === -1 means current video was filtered out; restart from first
      if (idx === -1) return list[0]
      return list[(idx + 1) % list.length]
    })
  }, [])

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>🎬 Video Player</h1>
        {!isLoading && minDate && maxDate && (
          <DateRangeBar
            minDate={minDate}
            maxDate={maxDate}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        )}
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
