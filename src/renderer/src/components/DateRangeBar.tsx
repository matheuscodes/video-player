interface DateRangeBarProps {
  minDate: string // YYYY-MM-DD (HTML date input format)
  maxDate: string
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

function DateRangeBar({
  minDate,
  maxDate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangeBarProps): React.JSX.Element {
  return (
    <div className="date-range-bar">
      <span className="date-range-label">Date range</span>
      <div className="date-range-inputs">
        <input
          type="date"
          className="date-input"
          min={minDate}
          max={endDate || maxDate}
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          aria-label="Start date"
          title="Start date"
        />
        <span className="date-range-sep">–</span>
        <input
          type="date"
          className="date-input"
          min={startDate || minDate}
          max={maxDate}
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          aria-label="End date"
          title="End date"
        />
      </div>
      <button
        className="btn-small"
        onClick={() => {
          onStartDateChange(minDate)
          onEndDateChange(maxDate)
        }}
        title="Reset date range"
      >
        Reset
      </button>
    </div>
  )
}

export default DateRangeBar
