import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { useMyOpenEvents } from '../hooks/useEvents.js'
import { createBookingRequest } from '../lib/bookings.js'
import { isArtistAvailable } from '../lib/availability.js'
import { friendlyError } from '../lib/errors.js'
import { formatDate, formatPrice } from '../lib/format.js'

const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-white focus:border-gold focus:outline-none'

// Step 23: an organizer sends a request for one of their open events.
export default function RequestBookingForm({ artist, organizerId }) {
  const navigate = useNavigate()
  const { data: events, isLoading, error, reload } = useMyOpenEvents(organizerId)
  const [eventId, setEventId] = useState('')
  const [price, setPrice] = useState(String(artist.price_per_event ?? artist.price_min ?? ''))
  const [notes, setNotes] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (isLoading) return <LoadingState label="Loading your events…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (events.length === 0) {
    return (
      <EmptyState title="No open events yet"
        message="Post an event first, then come back to request this artist."
        action={<Button to="/events/new">Post an event</Button>} />
    )
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    setErrorMessage('')
    const event = events.find((candidate) => candidate.id === eventId)
    if (!event) return setErrorMessage('Choose which event this is for.')
    const amount = Number(price)
    if (price === '' || Number.isNaN(amount) || amount < 0) return setErrorMessage('Enter your offer in ₹ (0 or more).')

    setIsSending(true)
    try {
      // A friendly early warning. Not a guarantee — two organizers can pass
      // this at the same moment. The unique index at confirmation is the guarantee.
      if (!(await isArtistAvailable(artist.id, event.event_date))) {
        setErrorMessage(`${artist.stage_name} is not available on ${formatDate(event.event_date)}.`)
        setIsSending(false)
        return
      }
      const booking = await createBookingRequest({
        event: { ...event, organizer_id: organizerId },
        artistId: artist.id,
        initiatedBy: 'organizer',
        proposedPrice: amount,
        notes,
      })
      navigate(`/bookings/${booking.id}`)
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block text-sm text-slate-300">Event
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={fieldClass}>
          <option value="">Choose one of your events…</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} — {formatDate(event.event_date)}, {event.city}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-slate-300">Your offer (₹)
        <input type="number" min="0" step="500" value={price} onChange={(e) => setPrice(e.target.value)} className={fieldClass} />
        <span className="mt-1 block text-xs text-slate-500">Artist's starting price: {formatPrice(artist.price_min, artist.currency)}</span>
      </label>
      <label className="block text-sm text-slate-300">Message to the artist (optional)
        <textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Set length, sound setup, dress code…" className={fieldClass} />
      </label>
      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
      <Button type="submit" disabled={isSending} className="w-full">
        {isSending ? 'Sending request…' : 'Send booking request'}
      </Button>
    </form>
  )
}
