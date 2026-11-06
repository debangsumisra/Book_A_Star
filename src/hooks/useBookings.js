import { useEffect } from 'react'
import { useQuery } from './useQuery.js'
import { fetchBooking, fetchMyBookings } from '../lib/bookings.js'
import { subscribeToBooking } from '../lib/messages.js'
import { fetchReviewForBooking } from '../lib/reviews.js'

export function useMyBookings(userId, role) {
  return useQuery(() => fetchMyBookings(userId, role), [userId, role], {
    enabled: Boolean(userId) && (role === 'artist' || role === 'organizer'),
  })
}

// One booking, kept live: when the other side accepts / confirms in another
// browser, this page re-fetches without a manual refresh.
export function useBooking(bookingId) {
  const query = useQuery(() => fetchBooking(bookingId), [bookingId], { enabled: Boolean(bookingId) })
  const { reload } = query

  useEffect(() => {
    if (!bookingId) return undefined
    return subscribeToBooking(bookingId, () => reload({ silent: true }))
  }, [bookingId, reload])

  return query
}

export function useBookingReview(bookingId, { enabled = true } = {}) {
  return useQuery(() => fetchReviewForBooking(bookingId), [bookingId], { enabled: Boolean(bookingId) && enabled })
}
