import { buildMonthGrid, monthLabel, shiftMonth } from '../lib/calendar.js'
import { todayIso } from '../lib/format.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Draws one month. Knows nothing about Supabase: it receives the blocked and
// booked dates as Sets, and reports clicks through `onDayClick` (optional —
// the public profile is read-only, the artist's own calendar is clickable).
export default function MonthCalendar({ year, monthIndex, onMonthChange, blocked, booked, onDayClick, busyDay }) {
  const today = todayIso()
  const cells = buildMonthGrid(year, monthIndex)

  function cellStyle(cell) {
    if (!cell.inMonth) return 'text-slate-600'
    if (booked?.has(cell.iso)) return 'bg-emerald-500/20 text-emerald-200 font-semibold'
    if (blocked?.has(cell.iso)) return 'bg-red-500/20 text-red-200 line-through'
    if (cell.iso < today) return 'text-slate-500'
    return 'text-white hover:bg-gold/15'
  }

  const go = (delta) => onMonthChange(shiftMonth(year, monthIndex, delta))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} aria-label="Previous month"
          className="rounded-lg border border-line px-3 py-1 text-white hover:border-gold">‹</button>
        <p className="font-semibold text-white" aria-live="polite">{monthLabel(year, monthIndex)}</p>
        <button type="button" onClick={() => go(1)} aria-label="Next month"
          className="rounded-lg border border-line px-3 py-1 text-white hover:border-gold">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {WEEKDAYS.map((weekday) => <div key={weekday} className="py-1">{weekday}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isClickable = onDayClick && cell.inMonth && cell.iso >= today && !booked?.has(cell.iso)
          return (
            <button key={cell.iso} type="button" disabled={!isClickable || busyDay === cell.iso}
              onClick={() => onDayClick(cell.iso)}
              aria-label={`${cell.iso}${booked?.has(cell.iso) ? ', booked' : blocked?.has(cell.iso) ? ', blocked' : ''}`}
              className={`aspect-square rounded-lg text-sm transition disabled:cursor-default ${cellStyle(cell)} ${cell.iso === today ? 'ring-1 ring-gold' : ''} ${busyDay === cell.iso ? 'animate-pulse' : ''}`}>
              {cell.day}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/40" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500/40" /> Unavailable</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-1 ring-gold" /> Today</span>
      </div>
    </div>
  )
}
