import { useQuery } from './useQuery.js'
import { fetchAdminStats, fetchAllBookings, fetchArtistsForReview, fetchReports, fetchUsers } from '../lib/admin.js'

export const useAdminStats = () => useQuery(fetchAdminStats, [])
export const useArtistsForReview = () => useQuery(fetchArtistsForReview, [])
export const useReports = () => useQuery(fetchReports, [])
export const useAllUsers = () => useQuery(fetchUsers, [])
export const useAllBookings = () => useQuery(fetchAllBookings, [])
