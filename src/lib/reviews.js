import { supabase } from './supabase.js'

// Reviews are public. reviewer names are NOT (profiles are private), so the
// UI shows "Verified organizer" — every review is tied to a real completed booking.
export async function fetchArtistReviews(artistId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function fetchReviewForBooking(bookingId) {
  const { data, error } = await supabase
    .from('reviews').select('id, rating, comment, created_at').eq('booking_id', bookingId).maybeSingle()
  if (error) throw error
  return data
}

// artist_id is derived by a trigger from the booking; any value works here
// but the column is NOT NULL, so we send the real one.
export async function createReview({ bookingId, reviewerId, artistId, rating, comment }) {
  const { error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    reviewer_id: reviewerId,
    artist_id: artistId,
    rating,
    comment: comment.trim() || null,
  })
  if (error) throw error
}
