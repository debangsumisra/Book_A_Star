// Dashboard numbers, computed from the booking rows the page already loaded.
// Pure, so tests can feed in known bookings and check every figure.

import { needsAttention } from './bookingRules.js'
import { todayIso } from './format.js'

const sum = (list, pick) => list.reduce((total, item) => total + Number(pick(item) ?? 0), 0)

export function artistStats(bookings, userId, today = todayIso()) {
  const completed = bookings.filter((booking) => booking.status === 'completed')
  const upcoming = bookings
    .filter((booking) => booking.status === 'confirmed' && booking.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
  const pending = bookings.filter((booking) => needsAttention(booking, 'artist', userId))
  const thisYear = today.slice(0, 4)

  return {
    upcoming,
    pending,
    // Earned = completed engagements. Booked = confirmed, not yet performed.
    earnedTotal: sum(completed, (booking) => booking.agreed_price),
    earnedThisYear: sum(completed.filter((booking) => booking.event_date.startsWith(thisYear)), (booking) => booking.agreed_price),
    bookedValue: sum(upcoming, (booking) => booking.agreed_price),
    completedCount: completed.length,
  }
}

export function organizerStats(bookings, events, userId, today = todayIso()) {
  const byStatus = {}
  for (const booking of bookings) byStatus[booking.status] = (byStatus[booking.status] ?? 0) + 1

  const upcoming = bookings
    .filter((booking) => booking.status === 'confirmed' && booking.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  return {
    byStatus,
    upcoming,
    needsAction: bookings.filter((booking) => needsAttention(booking, 'organizer', userId)),
    openEvents: events.filter((event) => event.status === 'open' && event.event_date >= today).length,
    totalEvents: events.length,
    committedSpend: sum(bookings.filter((booking) => ['confirmed', 'completed'].includes(booking.status)), (booking) => booking.agreed_price),
  }
}
