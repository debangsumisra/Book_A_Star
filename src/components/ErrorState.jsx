import { friendlyError } from '../lib/errors.js'

// The "error" state. Always offers a way forward: a blank screen on failure
// is a bug (rule 7).
export default function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-5">
      <p className="font-medium text-danger">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{friendlyError(error)}</p>
      {onRetry && (
        <button type="button" onClick={() => onRetry()} className="mt-3 text-sm text-gold hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}
