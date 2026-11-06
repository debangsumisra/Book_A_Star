import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'

// Dates the artist blocked by hand. `note` is fetched only for the owner's
// own calendar view; the public calendar never shows it.
export async function fetchBlockedDates(artistId, from, to, { withNotes = false } = {}) {
  const { data, error } = await supabase
    .from('availability')
    .select(withNotes ? 'id, date, note' : 'id, date')
    .eq('artist_id', artistId)
    .gte('date', from)
    .lte('date', to)
  if (error) throw error
  return data
}

// Dates taken by accepted/confirmed bookings (018: dates only, nothing else).
export async function fetchBookedDates(artistId, from, to) {
  const { data, error } = await supabase.rpc('artist_booked_dates', {
    p_artist_id: artistId, p_from: from, p_to: to,
  })
  if (error) throw error
  // A `returns setof date` RPC gives back plain strings.
  return data
}

export async function isArtistAvailable(artistId, isoDate) {
  const { data, error } = await supabase.rpc('artist_is_available', { p_artist_id: artistId, p_date: isoDate })
  if (error) throw error
  return data
}

export async function blockDate(artistId, isoDate, note) {
  const { error } = await supabase.from('availability').insert({ artist_id: artistId, date: isoDate, note: note || null })
  if (error) throw error
}

export async function unblockDate(artistId, isoDate) {
  const { data, error } = await supabase
    .from('availability').delete().eq('artist_id', artistId).eq('date', isoDate).select('id')
  if (error) throw error
  assertChanged(data)
}
