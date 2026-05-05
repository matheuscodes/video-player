import { useCallback } from 'react'
import type { VideoEntry } from '../App'

interface PlaylistProps {
  /** Filtered videos currently visible in the list */
  videos: VideoEntry[]
  currentVideo: VideoEntry | null
  onVideoSelect: (video: VideoEntry) => void
  /**
   * Called when the user reorders the playlist (sort / shuffle).
   * Passes the new full order of ALL videos so the parent can apply filtering
   * on top of the new order, preserving the order for unselected tags too.
   */
  onPlaylistOrderChange: (allVideosInNewOrder: VideoEntry[]) => void
  /** Full unfiltered video list (needed for sort/shuffle of hidden videos too) */
  allVideos: VideoEntry[]
}

function formatDate(date: string): string {
  // date is "YYYY.MM.DD"
  const [year, month, day] = date.split('.')
  if (!year || !month || !day) return date
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function Playlist({
  videos,
  currentVideo,
  onVideoSelect,
  onPlaylistOrderChange,
  allVideos
}: PlaylistProps): React.JSX.Element {
  const handleSortByDate = useCallback(() => {
    const sorted = [...allVideos].sort((a, b) => a.date.localeCompare(b.date))
    onPlaylistOrderChange(sorted)
  }, [allVideos, onPlaylistOrderChange])

  const handleShuffle = useCallback(() => {
    const shuffled = [...allVideos]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
    onPlaylistOrderChange(shuffled)
  }, [allVideos, onPlaylistOrderChange])

  return (
    <div className="playlist">
      <div className="playlist-header">
        <h2 className="sidebar-title">Playlist ({videos.length})</h2>
        <div className="playlist-controls">
          <button className="btn-small" onClick={handleSortByDate} title="Sort by date">
            📅 Sort
          </button>
          <button className="btn-small" onClick={handleShuffle} title="Shuffle playlist">
            🔀 Shuffle
          </button>
        </div>
      </div>

      {videos.length === 0 ? (
        <p className="empty-state">No videos match the selected tags.</p>
      ) : (
        <ul className="playlist-list">
          {videos.map((video) => {
            const isActive = currentVideo?.filePath === video.filePath
            return (
              <li
                key={video.filePath}
                className={`playlist-item${isActive ? ' playlist-item--active' : ''}`}
                onClick={() => onVideoSelect(video)}
              >
                <div className="playlist-item-date">{formatDate(video.date)}</div>
                <div className="playlist-item-tags">
                  {video.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Playlist
