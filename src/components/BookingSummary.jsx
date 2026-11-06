import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { formatDate, formatPrice, humanize } from '../lib/format.js'

const STEPS = ['requested', 'negotiating', 'accepted', 'confirmed', 'completed']

// Progress bar through the happy path. rejected/cancelled show as a badge only.
function StatusTrack({ status }) {
  const currentIndex = STEPS.indexOf(status)
  if (currentIndex === -1) return null
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Booking progress">
      {STEPS.map((step, index) => (
        <li key={step} className="text-center">
          <span className={`block h-1.5 rounded-full ${index <= currentIndex ? 'bg-gold' : 'bg-line'}`} />
          <span className={`mt-1 block text-[11px] ${index <= currentIndex ? 'text-gold' : 'text-slate-500'}`}>{humanize(step)}</span>
        </li>
      ))}
    </ol>
  )
}

export default function BookingSummary({ booking, role }) {
  const { event, artist, organizer } = booking
  const rows = [
    ['Date', formatDate(booking.event_date) + (event?.start_time ? `, ${event.start_time.slice(0, 5)}` : '')],
    ['Where', [event?.venue, event?.city].filter(Boolean).join(', ')],
    ['Event type', humanize(event?.event_type)],
    ['Duration', event?.duration_hours ? `${event.duration_hours} h` : ''],
    ['Audience', event?.audience_size ? `${event.audience_size} people` : ''],
    ['Organizer budget', event?.budget_min || event?.budget_max
      ? `${formatPrice(event.budget_min)} – ${formatPrice(event.budget_max)}` : ''],
    ['Current offer', formatPrice(booking.proposed_price, booking.currency)],
    ['Agreed price', booking.agreed_price !== null ? formatPrice(booking.agreed_price, booking.currency) : 'Not agreed yet'],
  ]

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{event?.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {role === 'artist' ? (
              <>Organizer: <span className="text-white">{organizer?.organization_name || organizer?.profile?.full_name || '—'}</span></>
            ) : (
              <>Artist: <Link to={`/artists/${artist?.id}`} className="text-gold hover:underline">{artist?.stage_name}</Link>
                {artist?.is_verified && <VerifiedBadge className="ml-2" />}</>
            )}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <StatusTrack status={booking.status} />

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-line/60 pb-2">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {event?.requirements && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Requirements</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{event.requirements}</p>
        </div>
      )}
      {booking.notes && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Note with the request</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{booking.notes}</p>
        </div>
      )}
      {booking.status === 'cancelled' && booking.cancellation_reason && (
        <p className="mt-4 text-sm text-slate-400">Cancellation reason: {booking.cancellation_reason}</p>
      )}
    </section>
  )
}
