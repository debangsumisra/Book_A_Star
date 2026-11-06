import { supabase } from './supabase.js'

// The columns a public artist card needs. Listing them (instead of `*`) is a
// habit worth having: a new private column added later will not leak here.
const CARD_COLUMNS =
  'id, stage_name, category, base_city, travels_outside_city, languages, price_min, price_per_event, price_per_hour, currency, avatar_url, cover_image_url, is_verified, rating_avg, rating_count, experience_years, bio'

// Filters arrive as form strings; '' means "not filtering on this".
export async function searchArtists(filters) {
  const blankToNull = (value) => (value === '' || value === undefined ? null : value)
  const { data, error } = await supabase.rpc('search_artists', {
    p_category: blankToNull(filters.category),
    p_city: blankToNull(filters.city?.trim()),
    p_price_min: blankToNull(filters.priceMin) === null ? null : Number(filters.priceMin),
    p_price_max: blankToNull(filters.priceMax) === null ? null : Number(filters.priceMax),
    p_min_rating: blankToNull(filters.minRating) === null ? null : Number(filters.minRating),
    p_date: blankToNull(filters.date),
    p_limit: 48,
  })
  if (error) throw error
  return data
}

export async function fetchFeaturedArtists() {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select(CARD_COLUMNS)
    .eq('is_published', true)
    .order('is_verified', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(6)
  if (error) throw error
  return data
}

// Returns null (not an error) when the artist does not exist or is
// unpublished — RLS hides both cases identically, on purpose.
export async function fetchArtist(artistId) {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select(`${CARD_COLUMNS}, is_published, verification_status`)
    .eq('id', artistId)
    .maybeSingle()
  if (error) throw error
  return data
}
