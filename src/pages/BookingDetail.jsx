import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useBooking, useBookingReview } from '../hooks/useBookings.js'
import { useMessages } from '../hooks/useMessages.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import BookingSummary from '../components/BookingSummary.jsx'
import BookingActions from '../components/BookingActions.jsx'
import MessageThread from '../components/MessageThread.jsx'
import MessageComposer from '../components/MessageComposer.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import ReviewList from '../components/ReviewList.jsx'
import ReportForm from '../components/ReportForm.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { isTerminal } from '../lib/bookingRules.js'

// Steps 24–28 in one place: status, actions, the message thread, and the
// review once it is all over. Both the booking and the thread update live.
export default function BookingDetail() {
  const { bookingId } = useParams()
  const { user, role } = useAuth()
  const bookingQuery = useBooking(bookingId)
  const messagesQuery = useMessages(bookingId)
  const booking = bookingQuery.data
  const isCompleted = booking?.status === 'completed'
  const reviewQuery = useBookingReview(bookingId, { enabled: isCompleted })

  if (bookingQuery.isLoading) return <PageShell><LoadingState label="Loading booking…" /></PageShell>
  if (bookingQuery.error) return <PageShell><ErrorState error={bookingQuery.error} onRetry={bookingQuery.reload} /></PageShell>
  // RLS returns nothing for a booking you are not part of: same view as "does not exist".
  if (!booking) {
    return (
      <PageShell>
        <EmptyState title="Booking not found" message="It does not exist, or you are not part of it."
          action={<Button to="/bookings">Back to bookings</Button>} />
      </PageShell>
    )
  }

  const viewerRole = role === 'admin' ? (booking.artist_id === user.id ? 'artist' : 'organizer') : role
  const counterpartId = viewerRole === 'artist' ? booking.organizer_id : booking.artist_id
  const names = {
    [booking.artist_id]: booking.artist?.stage_name ?? 'Artist',
    [booking.organizer_id]: booking.organizer?.organization_name || booking.organizer?.profile?.full_name || 'Organizer',
  }
  const reloadAll = () => {
    bookingQuery.reload({ silent: true })
    messagesQuery.reload({ silent: true })
  }

  return (
    <PageShell width="max-w-5xl">
      <Button to="/bookings" variant="ghost" className="mb-4 !px-0">← All bookings</Button>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <BookingSummary booking={booking} role={viewerRole} />
          <BookingActions booking={booking} role={viewerRole} userId={user.id} onChanged={reloadAll} />

          {isCompleted && (
            <Card title="Review">
              {reviewQuery.isLoading ? <LoadingState /> : reviewQuery.error ? (
                <ErrorState error={reviewQuery.error} onRetry={reviewQuery.reload} />
              ) : reviewQuery.data ? (
                <ReviewList reviews={[reviewQuery.data]} />
              ) : viewerRole === 'organizer' ? (
                <ReviewForm booking={booking} reviewerId={user.id} onSaved={() => reviewQuery.reload()} />
              ) : (
                <p className="text-sm text-slate-400">The organizer has not left a review yet.</p>
              )}
            </Card>
          )}

          <ReportForm reporterId={user.id} reportedUserId={counterpartId} reportedBookingId={booking.id} />
        </div>

        <Card title="Messages" className="lg:col-span-3">
          {messagesQuery.isLoading ? <LoadingState /> : messagesQuery.error ? (
            <ErrorState error={messagesQuery.error} onRetry={messagesQuery.reload} />
          ) : (
            <MessageThread messages={messagesQuery.data} currentUserId={user.id} names={names} />
          )}
          {isTerminal(booking.status) ? (
            <p className="mt-4 border-t border-line pt-4 text-center text-sm text-slate-500">
              This booking is {booking.status}; the conversation is closed.
            </p>
          ) : (
            <MessageComposer bookingId={booking.id} senderId={user.id} onSent={() => messagesQuery.reload({ silent: true })} />
          )}
        </Card>
      </div>
    </PageShell>
  )
}
