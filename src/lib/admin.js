import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'

// Every function here works only because RLS grants admins wider reads via
// private.is_admin(). A non-admin calling them simply gets their own rows
// (or nothing) back — the admin page being hidden is not what protects this.

export async function fetchAdminStats() {
  const count = async (table, apply = (query) => query) => {
    const { count: total, error } = await apply(supabase.from(table).select('id', { count: 'exact', head: true }))
    if (error) throw error
    return total
  }
  const [users, artists, events, bookings, confirmed, openReports, pendingVerification] = await Promise.all([
    count('profiles'),
    count('artist_profiles'),
    count('events'),
    count('bookings'),
    count('bookings', (query) => query.in('status', ['confirmed', 'completed'])),
    count('reports', (query) => query.in('status', ['open', 'reviewing'])),
    count('artist_profiles', (query) => query.eq('verification_status', 'pending').eq('is_published', true)),
  ])
  return { users, artists, events, bookings, confirmed, openReports, pendingVerification }
}

export async function fetchArtistsForReview() {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('id, stage_name, category, base_city, bio, is_published, is_verified, verification_status, rating_avg, rating_count, created_at')
    .order('verification_status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function setArtistVerification(artistId, decision) {
  const { data, error } = await supabase
    .from('artist_profiles')
    .update({ verification_status: decision, is_verified: decision === 'approved' })
    .eq('id', artistId)
    .select('id')
  if (error) throw error
  assertChanged(data)
}

export async function fetchReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function updateReport(reportId, userId, { status, adminNotes }) {
  const isClosed = status === 'resolved' || status === 'dismissed'
  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      admin_notes: adminNotes || null,
      resolved_by: isClosed ? userId : null,
      resolved_at: isClosed ? new Date().toISOString() : null,
    })
    .eq('id', reportId)
    .select('id')
  if (error) throw error
  assertChanged(data)
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, city, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function fetchAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, event_date, agreed_price, proposed_price, currency, event:events(title), artist:artist_profiles(stage_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}
