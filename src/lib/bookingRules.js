// Which buttons to show on a booking. This MIRRORS the database trigger
// `enforce_booking_transition` (008_bookings.sql) — it does not replace it.
// If the two ever disagree, the database wins and the user sees its error.
// That is the point of rule 11: hiding a button is UX, the trigger is security.

import { todayIso } from './format.js'

export const BOOKING_STATUSES = [
  'requested', 'negotiating', 'accepted', 'confirmed', 'completed', 'rejected', 'cancelled',
]

export const TERMINAL_STATUSES = ['completed', 'rejected', 'cancelled']

// Tailwind classes per status, so every badge in the app matches.
export const STATUS_STYLES = {
  requested: 'bg-sky-500/15 text-sky-300',
  negotiating: 'bg-violet-500/15 text-violet-300',
  accepted: 'bg-gold/15 text-gold',
  confirmed: 'bg-emerald-500/15 text-emerald-300',
  completed: 'bg-emerald-500/10 text-emerald-200',
  rejected: 'bg-red-500/15 text-red-300',
  cancelled: 'bg-slate-500/20 text-slate-300',
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status)
}

// The side that did not start the booking (019_negotiation_rules.sql).
export function isResponder(booking, role) {
  return role !== booking.initiated_by
}

// An offer is accepted by the side that did NOT make it.
export function canAcceptOffer(booking, userId) {
  return booking.last_offer_by !== userId
}

// Returns the list of actions this user may take right now.
// Each action: { type, label, nextStatus?, tone }
export function availableActions(booking, role, userId, today = todayIso()) {
  const { status } = booking
  const actions = []

  if (status === 'requested' || status === 'negotiating') {
    if (canAcceptOffer(booking, userId)) {
      actions.push({ type: 'status', nextStatus: 'accepted', label: 'Accept offer', tone: 'primary' })
    }
    actions.push({ type: 'counter', label: 'Counter-offer', tone: 'secondary' })
    if (isResponder(booking, role)) {
      actions.push({ type: 'status', nextStatus: 'rejected', label: 'Decline', tone: 'danger' })
    } else {
      actions.push({ type: 'status', nextStatus: 'cancelled', label: 'Withdraw request', tone: 'danger' })
    }
  }

  if (status === 'accepted' && role === 'organizer') {
    actions.push({ type: 'status', nextStatus: 'confirmed', label: 'Confirm booking', tone: 'primary' })
  }

  if (status === 'confirmed' && booking.event_date <= today) {
    actions.push({ type: 'status', nextStatus: 'completed', label: 'Mark completed', tone: 'primary' })
  }

  if (status === 'accepted' || status === 'confirmed') {
    actions.push({ type: 'status', nextStatus: 'cancelled', label: 'Cancel booking', tone: 'danger' })
  }

  return actions
}

// "Your move": an open offer you can answer, or (organizer) an accepted
// booking waiting for confirmation.
export function needsAttention(booking, role, userId) {
  if (booking.status === 'requested' || booking.status === 'negotiating') return canAcceptOffer(booking, userId)
  return role === 'organizer' && booking.status === 'accepted'
}
