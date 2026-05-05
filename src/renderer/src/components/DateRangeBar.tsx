import { useMemo } from 'react'

interface DateRangeBarProps {
  allDates: string[] // sorted unique dates in YYYY-MM-DD format
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

function DateRangeBar({
  allDates,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangeBarProps): React.JSX.Element {
  const max = Math.max(0, allDates.length - 1)

  const startIdx = useMemo(() => {
    const idx = allDates.indexOf(startDate)
    return idx >= 0 ? idx : 0
  }, [allDates, startDate])

  const endIdx = useMemo(() => {
    const idx = allDates.indexOf(endDate)
    return idx >= 0 ? idx : max
  }, [allDates, endDate, max])

  // Percentage positions for the filled range track
  const leftPct = max > 0 ? (startIdx / max) * 100 : 0
  const rightPct = max > 0 ? (endIdx / max) * 100 : 100

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const idx = Math.min(Number(e.target.value), endIdx)
    onStartDateChange(allDates[idx])
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const idx = Math.max(Number(e.target.value), startIdx)
    onEndDateChange(allDates[idx])
  }

  /** Format YYYY-MM-DD → YYYY.MM.DD for display */
  const fmt = (d: string): string => d.replace(/-/g, '.')

  return (
    <div className="date-range-bar">
      <span className="date-range-label">Date range</span>
      <div className="date-slider-wrapper">
        <div className="date-slider-labels">
          <span>{fmt(startDate)}</span>
          <span>{fmt(endDate)}</span>
        </div>
        <div className="date-slider-track">
          {/* Background track */}
          <div className="date-slider-bg" />
          {/* Active range fill */}
          <div
            className="date-slider-fill"
            style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
          />
          {/* Left / start thumb.
              When both thumbs overlap at the same position the start thumb
              rises above the end thumb (z-index 5 > 4) so the user can drag
              it left again. In all other cases it sits below (z-index 3). */}
          <input
            type="range"
            className="date-slider-input"
            min={0}
            max={max}
            value={startIdx}
            onChange={handleStartChange}
            aria-label="Start date"
            style={{ zIndex: startIdx >= endIdx ? 5 : 3 }}
          />
          {/* Right / end thumb — always at z-index 4 so it normally sits
              on top of the start thumb and is easy to grab. */}
          <input
            type="range"
            className="date-slider-input"
            min={0}
            max={max}
            value={endIdx}
            onChange={handleEndChange}
            aria-label="End date"
            style={{ zIndex: 4 }}
          />
        </div>
      </div>
      <button
        className="btn-small"
        onClick={() => {
          onStartDateChange(allDates[0])
          onEndDateChange(allDates[max])
        }}
        title="Reset date range"
      >
        Reset
      </button>
    </div>
  )
}

export default DateRangeBar

