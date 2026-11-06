import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useMyEvents } from '../hooks/useEvents.js'
import PageShell from '../components/PageShell.jsx'
import Button from '../components/Button.jsx'
import EventCard from '../components/EventCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { deleteEvent } from '../lib/events.js'
import { friendlyError } from '../lib/errors.js'
import { todayIso } from '../lib/format.js'

export default function MyEvents() {
  const { user } = useAuth()
  const { data: events, isLoading, error, reload } = useMyEvents(user.id)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    setDeleteError('')
    setDeletingId(event.id)
    try {
      await deleteEvent(event.id)
      await reload({ silent: true })
    } catch (caught) {
      setDeleteError(friendlyError(caught))
    } finally {
      setDeletingId(null)
    }
  }

  const today = todayIso()
  const upcoming = events?.filter((event) => event.event_date >= today) ?? []
  const past = events?.filter((event) => event.event_date < today) ?? []

  return (
    <PageShell title="My" highlight="Events" actions={<Button to="/events/new">+ Post an event</Button>}>
      {deleteError && <p role="alert" className="mb-4 text-sm text-danger">{deleteError}</p>}
      {isLoading ? <LoadingState label="Loading your events…" /> : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : events.length === 0 ? (
        <EmptyState title="No events yet" message="Post your first event, then find artists who are free on that date."
          action={<Button to="/events/new">Post an event</Button>} />
      ) : (
        <div className="space-y-10">
          {[['Upcoming', upcoming], ['Past', past]].map(([label, list]) => list.length > 0 && (
            <section key={label}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{label}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {list.map((event) => (
                  <EventCard key={event.id} event={event} onDelete={handleDelete} isDeleting={deletingId === event.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  )
}
