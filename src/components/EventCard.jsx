import { Link } from 'react-router-dom'
import { formatDate, formatPrice, humanize } from '../lib/format.js'

const EVENT_STATUS_STYLES = {
  draft: 'bg-line text-slate-300',
  open: 'bg-sky-500/15 text-sky-300',
  closed: 'bg-violet-500/15 text-violet-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-slate-500/20 text-slate-400',
}

// An organizer's own event, with a count of the bookings on it.
export default function EventCard({ event, onDelete, isDeleting }) {
  const bookings = event.bookings ?? []
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed').length
  const pending = bookings.filter((booking) => ['requested', 'negotiating', 'accepted'].includes(booking.status)).length
  const canDelete = bookings.length === 0 && (event.status === 'draft' || event.status === 'open')

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{event.title}</h3>
          <p className="text-sm text-slate-400">{humanize(event.event_type)} · {formatDate(event.event_date)}</p>
          <p className="text-sm text-slate-400">{[event.venue, event.city].filter(Boolean).join(', ')}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${EVENT_STATUS_STYLES[event.status]}`}>
          {humanize(event.status)}
        </span>
      </div>
      {(event.budget_min || event.budget_max) && (
        <p className="mt-3 text-sm text-gold">Budget {formatPrice(event.budget_min)} – {formatPrice(event.budget_max)}</p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        {confirmed} confirmed · {pending} in progress · {bookings.length} total requests
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link to={`/artists?city=${encodeURIComponent(event.city)}&date=${event.event_date}`} className="text-gold hover:underline">
          Find artists for this date
        </Link>
        <Link to={`/events/${event.id}/edit`} className="text-slate-300 hover:text-white">Edit</Link>
        {canDelete && onDelete && (
          <button type="button" onClick={() => onDelete(event)} disabled={isDeleting}
            className="text-danger hover:underline disabled:opacity-60">
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </article>
  )
}
