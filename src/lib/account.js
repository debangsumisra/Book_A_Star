import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'

export async function fetchAccount(userId) {
  const [{ data: profile, error: profileError }, { data: privateRow, error: privateError }] = await Promise.all([
    supabase.from('profiles').select('id, role, full_name, city, avatar_url').eq('id', userId).single(),
    supabase.from('profiles_private').select('email, phone').eq('id', userId).maybeSingle(),
  ])
  if (profileError) throw profileError
  if (privateError) throw privateError
  return { ...profile, email: privateRow?.email ?? '', phone: privateRow?.phone ?? '' }
}

export function validateAccount({ fullName, phone }) {
  if (fullName.trim().length < 2) return 'Enter your full name.'
  if (phone.trim() && !/^\+?[0-9 -]{7,15}$/.test(phone.trim())) return 'Enter a valid phone number (digits only).'
  return ''
}

export async function updateAccount(userId, { fullName, city, phone }) {
  const { data, error } = await supabase
    .from('profiles').update({ full_name: fullName.trim(), city: city.trim() || null }).eq('id', userId).select('id')
  if (error) throw error
  assertChanged(data)

  const { error: privateError } = await supabase
    .from('profiles_private').update({ phone: phone.trim() || null }).eq('id', userId)
  if (privateError) throw privateError
}

// Avatars live at avatars/{userId}/avatar-<time>.<ext>. A new file name each
// time means browsers never show a stale cached picture.
export async function uploadAvatar(userId, file, role) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.')

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar-${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
  if (error) throw error
  // Artist cards read their own avatar_url, so keep it in step.
  if (role === 'artist') {
    await supabase.from('artist_profiles').update({ avatar_url: url }).eq('id', userId)
  }
  return url
}
