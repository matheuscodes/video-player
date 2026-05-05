import { useRef, useEffect, useCallback, useState } from 'react'
import type { VideoEntry } from '../App'

interface VideoPlayerProps {
  video: VideoEntry | null
  onVideoEnd: () => void
}

function VideoPlayer({ video, onVideoEnd }: VideoPlayerProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Load new video whenever selection changes
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    setVideoError(null)
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

  const handleSkipNext = useCallback((): void => {
    onVideoEnd()
  }, [onVideoEnd])

  const handleVideoError = useCallback((): void => {
    const el = videoRef.current
    if (!el) return
    const err = el.error
    let message = 'This video cannot be played.'
    if (err) {
      switch (err.code) {
        case MediaError.MEDIA_ERR_NETWORK:
          message = 'Network error while loading the video.'
          break
        case MediaError.MEDIA_ERR_DECODE:
          message =
            'Video decoding failed. The file may use an unsupported codec (e.g. H.265/HEVC or Apple ProRes).'
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message =
            'Video format or codec not supported. Try re-encoding to H.264 MP4 for best compatibility.'
          break
        default:
          message = `Playback error (code ${err.code}): ${err.message}`
      }
      console.error('[VideoPlayer] Playback error:', { code: err.code, message: err.message, file: video?.filename })
    }
    setVideoError(message)
  }, [video])

  const handleFullscreen = (): void => {
    const el = videoRef.current
    if (!el) return
    if (el.requestFullscreen) {
      el.requestFullscreen()
    }
  }

  // Trigger "skip to next" when the spacebar is pressed anywhere on the page,
  // unless focus is inside an input, textarea, or button (so form controls still work).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      e.preventDefault()
      handleSkipNext()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleSkipNext])

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
              onError={handleVideoError}
              playsInline
            />
            {videoError && (
              <div className="video-error-overlay">
                <span className="video-error-icon">⚠️</span>
                <p>{videoError}</p>
              </div>
            )}
          </div>

          <div className="video-controls">
            <button
              className="btn-control"
              onClick={handleSkipNext}
              title="Skip to next video (Space)"
            >
              ⏭ Next
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
