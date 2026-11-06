import { supabase } from './supabase.js'
import { assertChanged } from './errors.js'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_PREFIXES = ['image/', 'video/', 'audio/']

export function portfolioPublicUrl(storagePath) {
  return supabase.storage.from('portfolio').getPublicUrl(storagePath).data.publicUrl
}

// Where an item's media actually lives, whichever kind it is.
export function portfolioItemUrl(item) {
  return item.storage_path ? portfolioPublicUrl(item.storage_path) : item.external_url
}

export function mediaTypeForFile(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return null
}

// Client-side check for a quick message; the bucket policy is the real gate.
export function validateUpload(file) {
  if (!file) return 'Choose a file first.'
  if (!ALLOWED_PREFIXES.some((prefix) => file.type.startsWith(prefix))) return 'Only images, video or audio files.'
  if (file.size > MAX_UPLOAD_BYTES) return 'Files must be 10 MB or smaller.'
  return ''
}

// YouTube watch/short links -> embeddable URL, so videos play inline.
export function youtubeEmbedUrl(url) {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function isValidHttpUrl(text) {
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export async function fetchPortfolio(artistId) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('artist_id', artistId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// The `${userId}/` prefix is load-bearing: the storage policy (014) only
// allows writes into the folder named after your own user id.
export async function uploadPortfolioFile(userId, file, details) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('portfolio').upload(path, file, {
    contentType: file.type,
  })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('portfolio_items').insert({
    artist_id: userId,
    media_type: mediaTypeForFile(file),
    storage_path: path,
    title: details.title || null,
    event_name: details.eventName || null,
    event_date: details.eventDate || null,
  })
  if (error) {
    // Do not leave an orphaned file in storage if the row failed.
    await supabase.storage.from('portfolio').remove([path])
    throw error
  }
}

export async function addPortfolioLink(userId, { url, mediaType, title, eventName, eventDate }) {
  const { error } = await supabase.from('portfolio_items').insert({
    artist_id: userId,
    media_type: mediaType,
    external_url: url,
    title: title || null,
    event_name: eventName || null,
    event_date: eventDate || null,
  })
  if (error) throw error
}

export async function deletePortfolioItem(item) {
  const { data, error } = await supabase.from('portfolio_items').delete().eq('id', item.id).select('id')
  if (error) throw error
  assertChanged(data)
  if (item.storage_path) {
    // The row is gone either way; a leftover file is harmless, so do not fail on it.
    await supabase.storage.from('portfolio').remove([item.storage_path])
  }
}
