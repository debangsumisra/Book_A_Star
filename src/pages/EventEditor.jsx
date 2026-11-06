import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useEvent } from '../hooks/useEvents.js'
import { useMyProfile } from '../hooks/useMyProfile.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import EventForm from '../components/EventForm.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { createEvent, updateEvent } from '../lib/events.js'
import { eventValuesToRow } from '../lib/eventValues.js'
import { friendlyError } from '../lib/errors.js'

// /events/new and /events/:eventId/edit share this page.
export default function EventEditor() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = !eventId
  const profileQuery = useMyProfile(user.id)
  const eventQuery = useEvent(eventId)

  // events.organizer_id references organizer_profiles, so the organizer
  // profile must exist first. Say so, instead of a cryptic foreign-key error.
  if (profileQuery.isLoading || (!isNew && eventQuery.isLoading)) return <PageShell><LoadingState /></PageShell>
  if (profileQuery.error) return <PageShell><ErrorState error={profileQuery.error} onRetry={profileQuery.reload} /></PageShell>
  if (!profileQuery.roleProfile) {
    return (
      <PageShell>
        <EmptyState title="Set up your organizer profile first"
          message="Artists see your organization name and city when you contact them."
          action={<Button to="/profile">Set up profile</Button>} />
      </PageShell>
    )
  }
  if (!isNew && eventQuery.error) return <PageShell><ErrorState error={eventQuery.error} onRetry={eventQuery.reload} /></PageShell>
  if (!isNew && !eventQuery.data) {
    return <PageShell><EmptyState title="Event not found" action={<Button to="/events">Back to my events</Button>} /></PageShell>
  }

  async function handleSubmit(values) {
    try {
      if (isNew) await createEvent(user.id, eventValuesToRow(values))
      else await updateEvent(eventId, eventValuesToRow(values))
      navigate('/events')
    } catch (caught) {
      // EventForm shows error.message; give it the friendly version.
      throw new Error(friendlyError(caught))
    }
  }

  return (
    <PageShell title={isNew ? 'Post an' : 'Edit'} highlight="Event" width="max-w-3xl">
      <Card>
        <EventForm existing={isNew ? null : eventQuery.data} onSubmit={handleSubmit} onCancel={() => navigate('/events')} />
      </Card>
    </PageShell>
  )
}
