import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useMyBookings } from '../hooks/useBookings.js'
import PageShell from '../components/PageShell.jsx'
import Button from '../components/Button.jsx'
import BookingCard from '../components/BookingCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { isTerminal } from '../lib/bookingRules.js'

const TABS = [
  { key: 'active', label: 'Active', test: (booking) => !isTerminal(booking.status) },
  { key: 'confirmed', label: 'Confirmed', test: (booking) => booking.status === 'confirmed' },
  { key: 'past', label: 'Closed', test: (booking) => isTerminal(booking.status) },
  { key: 'all', label: 'All', test: () => true },
]

export default function Bookings() {
  const { user, role } = useAuth()
  const { data: bookings, isLoading, error, reload } = useMyBookings(user.id, role)
  const [tab, setTab] = useState('active')
  const visible = (bookings ?? []).filter(TABS.find((candidate) => candidate.key === tab).test)

  return (
    <PageShell title={role === 'artist' ? 'Booking' : 'My'} highlight={role === 'artist' ? 'Requests' : 'Bookings'}>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((candidate) => (
          <button key={candidate.key} type="button" role="tab" aria-selected={tab === candidate.key}
            onClick={() => setTab(candidate.key)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === candidate.key ? 'bg-gold font-semibold text-ink' : 'border border-line text-slate-300 hover:text-white'}`}>
            {candidate.label}
            {bookings && <span className="ml-1.5 opacity-70">{bookings.filter(candidate.test).length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState label="Loading bookings…" /> : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing here yet"
          message={role === 'artist'
            ? 'Requests from organizers appear here. You can also apply to open events.'
            : 'Find an artist and send a request — it will show up here.'}
          action={role === 'artist' ? <Button to="/gigs">Find gigs</Button> : <Button to="/artists">Find artists</Button>} />
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => <BookingCard key={booking.id} booking={booking} role={role} userId={user.id} />)}
        </div>
      )}
    </PageShell>
  )
}
