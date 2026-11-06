import { useQuery } from './useQuery.js'
import { fetchArtist, fetchFeaturedArtists, searchArtists } from '../lib/artists.js'
import { fetchPortfolio } from '../lib/portfolio.js'
import { fetchArtistReviews } from '../lib/reviews.js'

// Re-runs whenever any filter value changes. JSON.stringify gives a stable
// dependency for an object whose identity changes on every render.
export function useArtistSearch(filters) {
  const key = JSON.stringify(filters)
  return useQuery(() => searchArtists(JSON.parse(key)), [key])
}

export function useFeaturedArtists() {
  return useQuery(fetchFeaturedArtists, [])
}

export function useArtist(artistId) {
  return useQuery(() => fetchArtist(artistId), [artistId], { enabled: Boolean(artistId) })
}

export function usePortfolio(artistId) {
  return useQuery(() => fetchPortfolio(artistId), [artistId], { enabled: Boolean(artistId) })
}

export function useArtistReviews(artistId) {
  return useQuery(() => fetchArtistReviews(artistId), [artistId], { enabled: Boolean(artistId) })
}
