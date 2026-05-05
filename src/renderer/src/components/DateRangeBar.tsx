import { useMemo } from 'react'

interface DateRangeBarProps {
  allDates: string[] // sorted unique dates in YYYY-MM-DD format
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

/**
 * Find the last date in `allDates` (sorted ascending) that is <= `target`,
 * falling back to allDates[0] when target precedes every date.
 * Returns an empty string for an empty array.
 */
function floorDate(allDates: string[], target: string): string {
  if (allDates.length === 0) return ''
  let best = allDates[0]
  for (const d of allDates) {
    if (d <= target) best = d
    else break
  }
  return best
}

/**
 * Find the first date in `allDates` (sorted ascending) that is >= `target`,
 * falling back to the last element when target is beyond every date.
 * Returns an empty string for an empty array.
 */
function ceilDate(allDates: string[], target: string): string {
  if (allDates.length === 0) return ''
  for (const d of allDates) {
    if (d >= target) return d
  }
  return allDates[allDates.length - 1]
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

  // Slider handlers — snap to allDates entries, respect cross-clamp
  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const idx = Math.min(Number(e.target.value), endIdx)
    onStartDateChange(allDates[idx])
  }

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const idx = Math.max(Number(e.target.value), startIdx)
    onEndDateChange(allDates[idx])
  }

  // Text input handlers — snap typed date to nearest available date
  const handleStartInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const typed = e.target.value
    if (!typed) return
    const snapped = floorDate(allDates, typed)
    if (!snapped) return
    // Ensure start doesn't exceed end
    onStartDateChange(snapped <= endDate ? snapped : endDate)
  }

  const handleEndInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const typed = e.target.value
    if (!typed) return
    const snapped = ceilDate(allDates, typed)
    if (!snapped) return
    // Ensure end doesn't precede start
    onEndDateChange(snapped >= startDate ? snapped : startDate)
  }

  return (
    <div className="date-range-bar">
      <span className="date-range-label">Date range</span>
      <div className="date-slider-wrapper">
        {/* Manual date inputs row */}
        <div className="date-inputs-row">
          <input
            type="date"
            className="date-input"
            value={startDate}
            min={allDates[0]}
            max={endDate}
            onChange={handleStartInput}
            aria-label="Start date"
            title="Start date"
          />
          <span className="date-range-sep">–</span>
          <input
            type="date"
            className="date-input"
            value={endDate}
            min={startDate}
            max={allDates[max]}
            onChange={handleEndInput}
            aria-label="End date"
            title="End date"
          />
        </div>
        {/* Dual-handle range slider */}
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
            onChange={handleStartSlider}
            aria-label="Start date slider"
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
            onChange={handleEndSlider}
            aria-label="End date slider"
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

