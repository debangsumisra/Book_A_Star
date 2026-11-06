import Card from './Card.jsx'
import Button from './Button.jsx'
import StatCard from './StatCard.jsx'
import BookingCard from './BookingCard.jsx'
import StatusBadge from './StatusBadge.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { useMyBookings } from '../hooks/useBookings.js'
import { useMyEvents } from '../hooks/useEvents.js'
import { organizerStats } from '../lib/dashboardStats.js'
import { BOOKING_STATUSES } from '../lib/bookingRules.js'
import { formatPrice } from '../lib/format.js'

// Step 29: my events, booking statuses, upcoming bookings.
export default function OrganizerDashboard({ userId }) {
  const bookingsQuery = useMyBookings(userId, 'organizer')
  const eventsQuery = useMyEvents(userId)

  if (bookingsQuery.isLoading || eventsQuery.isLoading) return <LoadingState label="Loading your dashboard…" />
  if (bookingsQuery.error) return <ErrorState error={bookingsQuery.error} onRetry={bookingsQuery.reload} />
  if (eventsQuery.error) return <ErrorState error={eventsQuery.error} onRetry={eventsQuery.reload} />

  const stats = organizerStats(bookingsQuery.data, eventsQuery.data, userId)

  if (stats.totalEvents === 0) {
    return (
      <EmptyState title="Start with your first event"
        message="Post the date, city and budget. Then find artists who are free that day."
        action={<Button to="/events/new">Post an event</Button>} />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open events" value={stats.openEvents} hint={`${stats.totalEvents} in total`} />
        <StatCard label="Needs your action" value={stats.needsAction.length} accent={stats.needsAction.length > 0} hint="Offers to answer or bookings to confirm" />
        <StatCard label="Upcoming bookings" value={stats.upcoming.length} />
        <StatCard label="Committed spend" value={formatPrice(stats.committedSpend)} hint="Confirmed and completed" />
      </div>

      <Card title="Booking" highlight="Status">
        <div className="flex flex-wrap gap-3">
          {BOOKING_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
              <StatusBadge status={status} />
              <span className="font-semibold text-white">{stats.byStatus[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Your" highlight="Move" actions={<Button to="/bookings" variant="ghost" size="sm">All bookings →</Button>}>
        {stats.needsAction.length === 0 ? (
          <EmptyState title="Nothing waiting on you" message="When an artist responds, it will show up here."
            action={<Button to="/artists" variant="secondary" size="sm">Find artists</Button>} />
        ) : (
          <div className="space-y-3">
            {stats.needsAction.map((booking) => <BookingCard key={booking.id} booking={booking} role="organizer" userId={userId} />)}
          </div>
        )}
      </Card>

      <Card title="Upcoming" highlight="Bookings" actions={<Button to="/events" variant="ghost" size="sm">My events →</Button>}>
        {stats.upcoming.length === 0 ? (
          <EmptyState title="No confirmed bookings yet" />
        ) : (
          <div className="space-y-3">
            {stats.upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} role="organizer" userId={userId} />)}
          </div>
        )}
      </Card>
    </div>
  )
}
