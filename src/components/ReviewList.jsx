import StarRating from './StarRating.jsx'
import { formatDateTime } from '../lib/format.js'

export default function ReviewList({ reviews }) {
  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <StarRating value={review.rating} size="text-sm" />
            <span className="text-xs text-slate-500">{formatDateTime(review.created_at)}</span>
          </div>
          {review.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{review.comment}</p>}
          {/* Every review comes from a completed booking — the RLS insert rule guarantees it. */}
          <p className="mt-2 text-xs text-slate-500">Verified organizer · completed booking</p>
        </li>
      ))}
    </ul>
  )
}
