// "Verified Star" badge (brief §6). Only an admin can set is_verified —
// the lock_artist_verification trigger enforces that.
export default function VerifiedBadge({ className = '' }) {
  return (
    <span title="Verified by Book A Star"
      className={`inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold ${className}`}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
      </svg>
      Verified
    </span>
  )
}
