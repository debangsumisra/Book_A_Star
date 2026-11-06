import { describe, expect, it } from 'vitest'
import { artistStats, organizerStats } from './dashboardStats.js'

const ME = 'artist-1'
const ORG = 'org-1'
const TODAY = '2026-10-05'

const bookings = [
  { id: 1, status: 'completed', event_date: '2026-03-01', agreed_price: 20000, last_offer_by: ORG },
  { id: 2, status: 'completed', event_date: '2025-12-01', agreed_price: 10000, last_offer_by: ORG },
  { id: 3, status: 'confirmed', event_date: '2026-11-01', agreed_price: 30000, last_offer_by: ORG },
  { id: 4, status: 'requested', event_date: '2026-12-01', agreed_price: null, last_offer_by: ORG },
  { id: 5, status: 'negotiating', event_date: '2026-12-02', agreed_price: null, last_offer_by: ME },
  { id: 6, status: 'accepted', event_date: '2026-12-03', agreed_price: 5000, last_offer_by: ME },
  { id: 7, status: 'cancelled', event_date: '2026-12-04', agreed_price: 9999, last_offer_by: ORG },
]

describe('artistStats', () => {
  const stats = artistStats(bookings, ME, TODAY)
  it('earnings count only completed bookings', () => {
    expect(stats.earnedTotal).toBe(30000)
    expect(stats.earnedThisYear).toBe(20000)
    expect(stats.completedCount).toBe(2)
  })
  it('upcoming = confirmed and not in the past', () => {
    expect(stats.upcoming.map((booking) => booking.id)).toEqual([3])
    expect(stats.bookedValue).toBe(30000)
  })
  it('pending = open offers this artist did not make', () => {
    expect(stats.pending.map((booking) => booking.id)).toEqual([4])
  })
})

describe('organizerStats', () => {
  const events = [
    { status: 'open', event_date: '2026-12-01' },
    { status: 'open', event_date: '2026-01-01' },
    { status: 'closed', event_date: '2026-12-01' },
  ]
  const stats = organizerStats(bookings, events, ORG, TODAY)
  it('counts bookings by status', () => {
    expect(stats.byStatus).toEqual({ completed: 2, confirmed: 1, requested: 1, negotiating: 1, accepted: 1, cancelled: 1 })
  })
  it('counts only future open events', () => {
    expect(stats.openEvents).toBe(1)
    expect(stats.totalEvents).toBe(3)
  })
  it('needs action: counter-offers from the artist and accepted bookings', () => {
    expect(stats.needsAction.map((booking) => booking.id)).toEqual([5, 6])
  })
  it('committed spend sums confirmed + completed', () => {
    expect(stats.committedSpend).toBe(60000)
  })
})
