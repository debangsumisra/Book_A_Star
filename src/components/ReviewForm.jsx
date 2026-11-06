import { useState } from 'react'
import Button from './Button.jsx'
import StarRating from './StarRating.jsx'
import { createReview } from '../lib/reviews.js'
import { friendlyError } from '../lib/errors.js'

// Shown to the organizer on a completed booking. The database refuses a
// review on anything not completed, or a second review, whatever the UI does.
export default function ReviewForm({ booking, reviewerId, onSaved }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (rating < 1) return setErrorMessage('Choose a star rating.')
    setErrorMessage('')
    setIsSaving(true)
    try {
      await createReview({ bookingId: booking.id, reviewerId, artistId: booking.artist_id, rating, comment })
      onSaved()
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <StarRating value={rating} onChange={setRating} />
      <label htmlFor="reviewComment" className="sr-only">Comment</label>
      <textarea id="reviewComment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="How was the performance?"
        className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none" />
      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
      <Button type="submit" disabled={isSaving}>{isSaving ? 'Posting…' : 'Post review'}</Button>
    </form>
  )
}
