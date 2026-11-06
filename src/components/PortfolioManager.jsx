import { useState } from 'react'
import PortfolioGrid from './PortfolioGrid.jsx'
import PortfolioUploadForm from './PortfolioUploadForm.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { usePortfolio } from '../hooks/useArtists.js'
import { deletePortfolioItem } from '../lib/portfolio.js'
import { friendlyError } from '../lib/errors.js'

// The artist's own portfolio editor (step 16).
export default function PortfolioManager({ userId }) {
  const { data: items, isLoading, error, reload } = usePortfolio(userId)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(item) {
    if (!window.confirm('Remove this item from your portfolio?')) return
    setDeleteError('')
    setDeletingId(item.id)
    try {
      await deletePortfolioItem(item)
      await reload({ silent: true })
    } catch (caught) {
      setDeleteError(friendlyError(caught))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <PortfolioUploadForm userId={userId} onAdded={() => reload({ silent: true })} />
      {deleteError && <p role="alert" className="text-sm text-danger">{deleteError}</p>}
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState title="Your portfolio is empty" message="Photos and videos from past shows are what convince organizers." />
      ) : (
        <PortfolioGrid items={items} onDelete={handleDelete} deletingId={deletingId} />
      )}
    </div>
  )
}
