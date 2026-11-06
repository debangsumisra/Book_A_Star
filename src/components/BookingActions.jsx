import { useState } from 'react'
import Button from './Button.jsx'
import { availableActions } from '../lib/bookingRules.js'
import { counterOffer, setBookingStatus } from '../lib/bookings.js'
import { friendlyError } from '../lib/errors.js'
import { formatPrice } from '../lib/format.js'

const CONFIRM_TEXT = {
  rejected: 'Reject this request? This cannot be undone.',
  cancelled: 'Cancel this booking? The other side will be notified. This cannot be undone.',
  confirmed: 'Confirm this booking? The date will be locked in the artist\'s calendar.',
  completed: 'Mark the event as completed?',
}

// Shows only the buttons the trigger would allow (lib/bookingRules.js) and
// surfaces the database's own message if it still refuses.
export default function BookingActions({ booking, role, userId, onChanged }) {
  const [busyAction, setBusyAction] = useState('')
  const [isCountering, setIsCountering] = useState(false)
  const [counterAmount, setCounterAmount] = useState(String(booking.proposed_price ?? ''))
  const [errorMessage, setErrorMessage] = useState('')

  const actions = availableActions(booking, role, userId)
  if (actions.length === 0) return null

  async function run(label, work) {
    setErrorMessage('')
    setBusyAction(label)
    try {
      await work()
      setIsCountering(false)
      onChanged()
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
    } finally {
      setBusyAction('')
    }
  }

  function handleStatus(action) {
    if (CONFIRM_TEXT[action.nextStatus] && !window.confirm(CONFIRM_TEXT[action.nextStatus])) return
    let extra = {}
    if (action.nextStatus === 'cancelled') {
      const reason = window.prompt('Reason for cancelling (optional):') ?? ''
      extra = { cancellation_reason: reason.trim() || null }
    }
    run(action.label, () => setBookingStatus(booking.id, action.nextStatus, extra))
  }

  function handleCounter(submitEvent) {
    submitEvent.preventDefault()
    const amount = Number(counterAmount)
    if (counterAmount === '' || Number.isNaN(amount) || amount < 0) {
      setErrorMessage('Enter an amount of 0 or more.')
      return
    }
    run('counter', () => counterOffer(booking.id, amount))
  }

  return (
    <section className="rounded-2xl border border-gold/30 bg-panel p-5" aria-label="Booking actions">
      <p className="text-sm font-semibold text-gold">Actions</p>
      {(booking.status === 'requested' || booking.status === 'negotiating') && booking.last_offer_by === userId && (
        <p className="mt-1 text-xs text-slate-400">Your offer is on the table — waiting for the other side to accept or counter.</p>
      )}
      {booking.status === 'accepted' && role === 'artist' && (
        <p className="mt-1 text-xs text-slate-400">Offer accepted — waiting for the organizer to confirm.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action.label} variant={action.tone} size="sm" disabled={Boolean(busyAction)}
            onClick={() => (action.type === 'counter' ? setIsCountering((open) => !open) : handleStatus(action))}>
            {busyAction === action.label ? 'Working…' : action.label}
          </Button>
        ))}
      </div>

      {isCountering && (
        <form onSubmit={handleCounter} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-300">New price (₹)
            <input type="number" min="0" step="500" value={counterAmount} autoFocus
              onChange={(e) => setCounterAmount(e.target.value)}
              className="mt-1 block w-40 rounded-lg border border-line bg-ink px-3 py-2 text-white focus:border-gold focus:outline-none" />
          </label>
          <Button type="submit" size="sm" disabled={Boolean(busyAction)}>
            {busyAction === 'counter' ? 'Sending…' : 'Send offer'}
          </Button>
          <p className="w-full text-xs text-slate-500">
            Current offer: {formatPrice(booking.proposed_price, booking.currency)}. After you send a new offer, the other side decides.
          </p>
        </form>
      )}

      {errorMessage && <p role="alert" className="mt-3 text-sm text-danger">{errorMessage}</p>}
    </section>
  )
}
