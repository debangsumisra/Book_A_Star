import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'
import { todayIso } from './format.js'

// Organizer: my events, with a light summary of the bookings on each.
export async function fetchMyEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select('*, bookings(id, status, artist_id)')
    .eq('organizer_id', userId)
    .order('event_date', { ascending: true })
  if (error) throw error
  return data
}

// Organizer: events still open for new requests (used by "Request booking").
export async function fetchMyOpenEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, city, budget_min, budget_max')
    .eq('organizer_id', userId)
    .eq('status', 'open')
    .gte('event_date', todayIso())
    .order('event_date', { ascending: true })
  if (error) throw error
  return data
}

// Artist: public open events they could apply to. RLS already limits this to
// open + public events; the filters here are for relevance, not security.
export async function fetchOpenGigs({ city = '', eventType = '' } = {}) {
  let query = supabase
    .from('events')
    .select('id, organizer_id, title, event_type, event_date, start_time, duration_hours, city, venue, budget_min, budget_max, audience_size, requirements')
    .eq('status', 'open')
    .eq('is_public', true)
    .gte('event_date', todayIso())
    .order('event_date', { ascending: true })
    .limit(60)
  if (city.trim()) query = query.ilike('city', city.trim())
  if (eventType) query = query.eq('event_type', eventType)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchEvent(eventId) {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
  if (error) throw error
  return data
}

export async function createEvent(userId, row) {
  const { data, error } = await supabase
    .from('events').insert({ ...row, organizer_id: userId }).select('id').single()
  if (error) throw error
  return data
}

export async function updateEvent(eventId, row) {
  const { data, error } = await supabase.from('events').update(row).eq('id', eventId).select('id')
  if (error) throw error
  assertChanged(data)
}

export async function deleteEvent(eventId) {
  const { data, error } = await supabase.from('events').delete().eq('id', eventId).select('id')
  if (error) throw error
  assertChanged(data, 'Only draft or open events with no bookings can be deleted. Close it instead.')
}
