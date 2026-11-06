import Card from './Card.jsx'
import Button from './Button.jsx'
import StatCard from './StatCard.jsx'
import BookingCard from './BookingCard.jsx'
import StarRating from './StarRating.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { useMyBookings } from '../hooks/useBookings.js'
import { artistStats } from '../lib/dashboardStats.js'
import { formatPrice } from '../lib/format.js'

// Step 30: upcoming bookings, pending requests, earnings summary, rating.
export default function ArtistDashboard({ userId, artistProfile }) {
  const { data: bookings, isLoading, error, reload } = useMyBookings(userId, 'artist')

  if (isLoading) return <LoadingState label="Loading your bookings…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const stats = artistStats(bookings, userId)

  return (
    <div className="space-y-6">
      {!artistProfile.is_published && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm text-gold">Your profile is hidden. Publish it so organizers can find and book you.</p>
          <Button to="/profile" size="sm">Publish profile</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending requests" value={stats.pending.length} accent={stats.pending.length > 0} hint="Waiting for your answer" />
        <StatCard label="Upcoming shows" value={stats.upcoming.length} hint={`${formatPrice(stats.bookedValue)} booked`} />
        <StatCard label="Earned" value={formatPrice(stats.earnedTotal)} hint={`${formatPrice(stats.earnedThisYear)} this year · ${stats.completedCount} shows`} />
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Rating</p>
          <p className="mt-2 text-2xl font-bold text-white">{Number(artistProfile.rating_avg).toFixed(1)}</p>
          <StarRating value={artistProfile.rating_avg} count={artistProfile.rating_count} size="text-sm" />
          {artistProfile.is_verified && <VerifiedBadge className="mt-2" />}
        </div>
      </div>

      <Card title="Needs your" highlight="Answer" actions={<Button to="/bookings" variant="ghost" size="sm">All requests →</Button>}>
        {stats.pending.length === 0 ? (
          <EmptyState title="No requests waiting" message="New requests and counter-offers will appear here."
            action={<Button to="/gigs" variant="secondary" size="sm">Find gigs</Button>} />
        ) : (
          <div className="space-y-3">
            {stats.pending.map((booking) => <BookingCard key={booking.id} booking={booking} role="artist" userId={userId} />)}
          </div>
        )}
      </Card>

      <Card title="Upcoming" highlight="Shows" actions={<Button to="/calendar" variant="ghost" size="sm">Calendar →</Button>}>
        {stats.upcoming.length === 0 ? (
          <EmptyState title="No confirmed shows yet" />
        ) : (
          <div className="space-y-3">
            {stats.upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} role="artist" userId={userId} />)}
          </div>
        )}
      </Card>
    </div>
  )
}
