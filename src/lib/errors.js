// One place that turns database / network errors into sentences users can act on.
//
// Our triggers raise exceptions with human-written messages ("This event date
// has already passed"), which Supabase passes through as error.message. Those
// are kept. Only raw Postgres codes get translated.

export function friendlyError(error) {
  if (!error) return ''
  const message = error.message ?? String(error)

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Cannot reach the server. Check your internet connection.'
  }
  if (message.includes('bookings_no_double_booking')) {
    return 'This artist is already booked on that date. The date is no longer available.'
  }
  if (message.includes('bookings_event_id_artist_id_key')) {
    return 'You already sent this artist a request for this event. Open it from Bookings.'
  }
  if (message.includes('reviews_booking_id_key')) return 'This booking has already been reviewed.'
  if (message.includes('availability_artist_id_date_key')) return 'That date is already blocked.'
  if (error.code === '23503') return 'This item is still linked to bookings, so it cannot be deleted.'
  if (error.code === '42501' || message.includes('row-level security')) {
    return 'You are not allowed to do that.'
  }
  if (error.code === 'NO_ROWS') return message
  return message || 'Something went wrong. Please try again.'
}

// RLS does not raise an error on rows you may not touch; it silently filters
// them, so an UPDATE "succeeds" with zero rows. Call this with the result of
// `.select()` to turn that silent no-op into a real error.
export function assertChanged(data, message = 'Nothing was changed — you may not have permission.') {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    const error = new Error(message)
    error.code = 'NO_ROWS'
    throw error
  }
}
