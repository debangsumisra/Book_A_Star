import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'

// One select string so the list and the detail page show the same shape.
// The nested parts follow foreign keys: bookings -> events, bookings ->
// artist_profiles, bookings -> organizer_profiles -> profiles. Each nested
// table is still filtered by its OWN RLS policy.
const BOOKING_SELECT = `
  *,
  event:events(id, title, event_type, event_date, start_time, duration_hours, city, venue,
               budget_min, budget_max, audience_size, requirements, status),
  artist:artist_profiles(id, stage_name, category, avatar_url, base_city, is_verified, rating_avg),
  organizer:organizer_profiles(id, organization_name, organizer_type, city,
                               profile:profiles(full_name))
`

// RLS returns only bookings I am part of, so no user filter is needed —
// but the filter is cheap and makes the intent obvious to a reader.
export async function fetchMyBookings(userId, role) {
  const column = role === 'artist' ? 'artist_id' : 'organizer_id'
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq(column, userId)
    .order('event_date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchBooking(bookingId) {
  const { data, error } = await supabase
    .from('bookings').select(BOOKING_SELECT).eq('id', bookingId).maybeSingle()
  if (error) throw error
  return data
}

// `event` must include organizer_id. organizer_id and event_date are
// overwritten by the sync trigger anyway; they are sent because the columns
// are NOT NULL and the RLS check reads organizer_id.
export async function createBookingRequest({ event, artistId, initiatedBy, proposedPrice, notes }) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      event_id: event.id,
      artist_id: artistId,
      organizer_id: event.organizer_id,
      event_date: event.event_date,
      initiated_by: initiatedBy,
      proposed_price: proposedPrice,
      notes: notes || null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function setBookingStatus(bookingId, status, extra = {}) {
  const { data, error } = await supabase
    .from('bookings').update({ status, ...extra }).eq('id', bookingId).select('id')
  if (error) throw error
  assertChanged(data)
}

// A counter-offer is just a new price. The database records who made it
// (last_offer_by) and moves 'requested' to 'negotiating' by itself.
export async function counterOffer(bookingId, amount) {
  const { data, error } = await supabase
    .from('bookings').update({ proposed_price: amount }).eq('id', bookingId).select('id')
  if (error) throw error
  assertChanged(data)
}
