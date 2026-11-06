import { supabase } from './supabase.js'

// Must match the enums in 001_enums.sql. The database rejects anything else,
// these lists just let the form offer the right choices.
export const ARTIST_CATEGORIES = ['singer', 'band', 'musician', 'dancer', 'dj', 'comedian', 'anchor', 'magician', 'other']
export const ORGANIZER_TYPES = ['individual', 'college', 'company', 'event_agency', 'other']

const ROLE_TABLE = { artist: 'artist_profiles', organizer: 'organizer_profiles' }

function toOrganizerRow(values) {
  return {
    organization_name: values.organizationName || null,
    organizer_type: values.organizerType,
    city: values.city,
  }
}

// RLS does NOT raise an error when you update or delete a row you may not
// touch — it silently filters it out, so the query "succeeds" with 0 rows.
// `.select('id')` returns the rows actually changed, so we can tell the
// difference between "saved" and "nothing happened".
function assertChanged(data) {
  if (!data || data.length === 0) {
    const error = new Error('Nothing was changed — this profile does not belong to you.')
    error.code = 'NO_ROWS'
    throw error
  }
}

// `id` is the user's own id. RLS checks `id = auth.uid()` and the role, so
// passing someone else's id here fails in the database, not just in the UI.
// Artist functions take a ready-made row (built by lib/artistProfileValues.js).
export async function createArtistProfile(userId, row) {
  const { error } = await supabase.from('artist_profiles').insert({ id: userId, ...row })
  if (error) throw error
}

export async function updateArtistProfile(userId, row) {
  const { data, error } = await supabase
    .from('artist_profiles').update(row).eq('id', userId).select('id')
  if (error) throw error
  assertChanged(data)
}

export async function createOrganizerProfile(userId, values) {
  const { error } = await supabase.from('organizer_profiles').insert({ id: userId, ...toOrganizerRow(values) })
  if (error) throw error
}

export async function updateOrganizerProfile(userId, values) {
  const { data, error } = await supabase
    .from('organizer_profiles').update(toOrganizerRow(values)).eq('id', userId).select('id')
  if (error) throw error
  assertChanged(data)
}

export async function deleteRoleProfile(role, userId) {
  const { data, error } = await supabase.from(ROLE_TABLE[role]).delete().eq('id', userId).select('id')
  if (error) throw error
  assertChanged(data)
}

// Postgres error codes -> sentences a user can act on.
export function friendlyProfileError(error) {
  if (error?.code === '23505') return 'Your profile already exists. Refresh the page.'
  if (error?.code === '23503') return 'This profile has bookings attached, so it cannot be deleted. Unpublish it instead.'
  if (error?.code === '42501') return 'You are not allowed to change this profile.'
  if (error?.message?.includes('Failed to fetch')) return 'Cannot reach the server. Check your connection.'
  return error?.message || 'Could not save. Please try again.'
}
