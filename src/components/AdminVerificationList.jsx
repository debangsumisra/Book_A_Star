import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { useArtistsForReview } from '../hooks/useAdmin.js'
import { setArtistVerification } from '../lib/admin.js'
import { friendlyError } from '../lib/errors.js'
import { humanize } from '../lib/format.js'

// Admin approves or rejects artists. The lock_artist_verification trigger
// lets ONLY an admin change these columns, so this works for no one else.
export default function AdminVerificationList() {
  const { data: artists, isLoading, error, reload } = useArtistsForReview()
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  async function decide(artistId, decision) {
    setActionError('')
    setBusyId(artistId)
    try {
      await setArtistVerification(artistId, decision)
      await reload({ silent: true })
    } catch (caught) {
      setActionError(friendlyError(caught))
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (artists.length === 0) return <EmptyState title="No artists yet" />

  return (
    <div className="space-y-3">
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
      {artists.map((artist) => (
        <div key={artist.id} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/artists/${artist.id}`} className="font-semibold text-white hover:text-gold">{artist.stage_name}</Link>
              {artist.is_verified && <VerifiedBadge />}
              {!artist.is_published && <span className="text-xs text-slate-500">(unpublished)</span>}
            </div>
            <p className="text-sm text-slate-400">
              {humanize(artist.category)} · {artist.base_city || '—'} · {humanize(artist.verification_status)}
              {artist.rating_count > 0 && ` · ${Number(artist.rating_avg).toFixed(1)}★ (${artist.rating_count})`}
            </p>
            {artist.bio && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{artist.bio}</p>}
          </div>
          <div className="flex gap-2">
            {artist.verification_status !== 'approved' && (
              <Button size="sm" disabled={busyId === artist.id} onClick={() => decide(artist.id, 'approved')}>Approve</Button>
            )}
            {artist.verification_status !== 'rejected' && (
              <Button size="sm" variant="danger" disabled={busyId === artist.id} onClick={() => decide(artist.id, 'rejected')}>
                {artist.verification_status === 'approved' ? 'Revoke' : 'Reject'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
