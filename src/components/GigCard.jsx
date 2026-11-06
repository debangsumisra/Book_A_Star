import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button.jsx'
import { createBookingRequest } from '../lib/bookings.js'
import { friendlyError } from '../lib/errors.js'
import { formatDate, formatPrice, humanize } from '../lib/format.js'

// An open event as an artist sees it, with an "Apply" form. Applying creates
// a booking initiated by the artist; the organizer then sees it in Bookings.
export default function GigCard({ event, artistId, defaultPrice }) {
  const navigate = useNavigate()
  const [isApplying, setIsApplying] = useState(false)
  const [price, setPrice] = useState(String(defaultPrice ?? ''))
  const [notes, setNotes] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleApply(submitEvent) {
    submitEvent.preventDefault()
    const amount = Number(price)
    if (price === '' || Number.isNaN(amount) || amount < 0) return setErrorMessage('Enter your quote in ₹.')
    setErrorMessage('')
    setIsSending(true)
    try {
      const booking = await createBookingRequest({ event, artistId, initiatedBy: 'artist', proposedPrice: amount, notes })
      navigate(`/bookings/${booking.id}`)
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
      setIsSending(false)
    }
  }

  const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:border-gold focus:outline-none'
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white">{event.title}</h3>
          <p className="text-sm text-slate-400">{humanize(event.event_type)} · {formatDate(event.event_date)} · {event.city}</p>
        </div>
        {(event.budget_min || event.budget_max) && (
          <span className="text-sm font-semibold text-gold">{formatPrice(event.budget_min)} – {formatPrice(event.budget_max)}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {[event.venue, event.audience_size && `${event.audience_size} guests`, event.duration_hours && `${event.duration_hours} h`]
          .filter(Boolean).join(' · ')}
      </p>
      {event.requirements && <p className="mt-2 line-clamp-3 text-sm text-slate-300">{event.requirements}</p>}

      {isApplying ? (
        <form onSubmit={handleApply} className="mt-4 space-y-3" noValidate>
          <label className="block text-sm text-slate-300">Your quote (₹)
            <input type="number" min="0" step="500" value={price} onChange={(e) => setPrice(e.target.value)} className={fieldClass} />
          </label>
          <label className="block text-sm text-slate-300">Pitch (optional)
            <textarea rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
          </label>
          {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSending}>{isSending ? 'Sending…' : 'Send application'}</Button>
            <Button variant="secondary" size="sm" onClick={() => setIsApplying(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button size="sm" className="mt-4" onClick={() => setIsApplying(true)}>Apply for this gig</Button>
      )}
    </article>
  )
}
