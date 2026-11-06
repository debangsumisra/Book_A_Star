import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useOpenGigs } from '../hooks/useEvents.js'
import { useMyProfile } from '../hooks/useMyProfile.js'
import PageShell from '../components/PageShell.jsx'
import Button from '../components/Button.jsx'
import GigCard from '../components/GigCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { EVENT_TYPES } from '../lib/eventValues.js'
import { humanize } from '../lib/format.js'

// Artists browse open public events and apply (brief §5: organizers can
// invite, and artists can be discovered — this is the other direction).
export default function Gigs() {
  const { user } = useAuth()
  const profileQuery = useMyProfile(user.id)
  const [city, setCity] = useState('')
  const [eventType, setEventType] = useState('')
  const gigs = useOpenGigs({ city, eventType })
  const artist = profileQuery.roleProfile

  const fieldClass = 'rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:border-gold focus:outline-none'

  let content
  if (profileQuery.isLoading) content = <LoadingState />
  else if (profileQuery.error) content = <ErrorState error={profileQuery.error} onRetry={profileQuery.reload} />
  else if (!artist?.is_published) {
    content = (
      <EmptyState title="Publish your profile to apply"
        message="Organizers need to see who you are before they accept an application."
        action={<Button to="/profile">Finish your profile</Button>} />
    )
  } else if (gigs.isLoading) content = <LoadingState label="Loading open events…" />
  else if (gigs.error) content = <ErrorState error={gigs.error} onRetry={gigs.reload} />
  else if (gigs.data.length === 0) content = <EmptyState title="No open events match" message="Try another city or type, or check back soon." />
  else {
    content = (
      <div className="grid gap-4 md:grid-cols-2">
        {gigs.data.map((event) => (
          <GigCard key={event.id} event={event} artistId={user.id}
            defaultPrice={artist.price_per_event ?? artist.price_min} />
        ))}
      </div>
    )
  }

  return (
    <PageShell title="Find" highlight="Gigs" subtitle="Open events looking for talent.">
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="gigCity">City</label>
        <input id="gigCity" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={fieldClass} />
        <label className="sr-only" htmlFor="gigType">Event type</label>
        <select id="gigType" value={eventType} onChange={(e) => setEventType(e.target.value)} className={fieldClass}>
          <option value="">All event types</option>
          {EVENT_TYPES.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
        </select>
      </div>
      {content}
    </PageShell>
  )
}
