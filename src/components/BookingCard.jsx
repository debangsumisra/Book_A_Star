import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import { formatDate, formatPrice } from '../lib/format.js'
import { needsAttention } from '../lib/bookingRules.js'

// One row in a bookings list. `role` decides whose name is shown: an
// organizer cares about the artist, an artist about the organizer.
export default function BookingCard({ booking, role, userId }) {
  const counterpart = role === 'artist'
    ? booking.organizer?.organization_name || booking.organizer?.profile?.full_name || 'Organizer'
    : booking.artist?.stage_name ?? 'Artist'
  const price = booking.agreed_price ?? booking.proposed_price
  const isAttention = needsAttention(booking, role, userId)

  return (
    <Link to={`/bookings/${booking.id}`}
      className={`flex flex-col gap-3 rounded-xl border bg-panel p-4 transition hover:border-gold/60 sm:flex-row sm:items-center sm:justify-between ${isAttention ? 'border-gold/50' : 'border-line'}`}>
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{booking.event?.title ?? 'Event'}</p>
        <p className="text-sm text-slate-400">
          {counterpart} · {formatDate(booking.event_date)} · {booking.event?.city}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {isAttention && <span className="text-xs font-semibold text-gold">Your move</span>}
        <span className="text-sm font-semibold text-white">{formatPrice(price, booking.currency)}</span>
        <StatusBadge status={booking.status} />
      </div>
    </Link>
  )
}
