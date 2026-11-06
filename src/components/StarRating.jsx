// Read-only stars, or an input when `onChange` is given.
export default function StarRating({ value = 0, count, onChange, size = 'text-base' }) {
  const rounded = Math.round(Number(value))
  const isInput = typeof onChange === 'function'

  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="inline-flex" role={isInput ? 'radiogroup' : 'img'}
        aria-label={isInput ? 'Rating' : `${Number(value).toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) =>
          isInput ? (
            <button key={star} type="button" role="radio" aria-checked={rounded === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`} onClick={() => onChange(star)}
              className={`px-0.5 text-2xl ${star <= rounded ? 'text-gold' : 'text-line'} hover:text-gold`}>
              ★
            </button>
          ) : (
            <span key={star} aria-hidden="true" className={star <= rounded ? 'text-gold' : 'text-line'}>★</span>
          ),
        )}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-400">
          {count > 0 ? `${Number(value).toFixed(1)} (${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  )
}
