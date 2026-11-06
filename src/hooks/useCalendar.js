import { useQuery } from './useQuery.js'
import { fetchBlockedDates, fetchBookedDates } from '../lib/availability.js'
import { monthRange } from '../lib/calendar.js'

// Blocked + booked dates for one month, as two Sets for O(1) lookup per cell.
export function useMonthAvailability(artistId, year, monthIndex, { withNotes = false } = {}) {
  return useQuery(async () => {
    const { from, to } = monthRange(year, monthIndex)
    const [blocked, booked] = await Promise.all([
      fetchBlockedDates(artistId, from, to, { withNotes }),
      fetchBookedDates(artistId, from, to),
    ])
    return {
      blocked: new Set(blocked.map((row) => row.date)),
      notes: Object.fromEntries(blocked.map((row) => [row.date, row.note])),
      booked: new Set(booked),
    }
  }, [artistId, year, monthIndex, withNotes], { enabled: Boolean(artistId) })
}
