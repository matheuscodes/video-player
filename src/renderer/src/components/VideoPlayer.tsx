import { useRef, useEffect } from 'react'
import type { VideoEntry } from '../App'

interface VideoPlayerProps {
  video: VideoEntry | null
  onVideoEnd: () => void
}

const SKIP_SECONDS = 10

function VideoPlayer({ video, onVideoEnd }: VideoPlayerProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load new video whenever selection changes
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (video?.url) {
      el.src = video.url
      el.load()
      el.play().catch(() => {
        // Autoplay may be blocked; user can press play manually
      })
    } else {
      el.removeAttribute('src')
      el.load()
    }
  }, [video])

  const handleSkipForward = (): void => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = Math.min(el.currentTime + SKIP_SECONDS, el.duration || el.currentTime)
  }

  const handleFullscreen = (): void => {
    const el = videoRef.current
    if (!el) return
    if (el.requestFullscreen) {
      el.requestFullscreen()
    }
  }

  return (
    <div className="video-player">
      {video ? (
        <>
          <div className="video-info">
            <span className="video-date">{video.date}</span>
            <div className="video-tags">
              {video.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="video-wrapper">
            <video
              ref={videoRef}
              className="video-element"
              controls
              onEnded={onVideoEnd}
              playsInline
            />
          </div>

          <div className="video-controls">
            <button className="btn-control" onClick={handleSkipForward} title="Skip forward 10s">
              ⏩ +{SKIP_SECONDS}s
            </button>
            <button className="btn-control" onClick={handleFullscreen} title="Full screen">
              ⛶ Fullscreen
            </button>
          </div>
        </>
      ) : (
        <div className="player-empty">
          <div className="player-empty-icon">▶</div>
          <p>Select a video from the playlist to start playing</p>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
