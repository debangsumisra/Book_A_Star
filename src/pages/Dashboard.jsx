import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useMyProfile } from '../hooks/useMyProfile.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import RoleProfilePanel from '../components/RoleProfilePanel.jsx'
import ArtistDashboard from '../components/ArtistDashboard.jsx'
import OrganizerDashboard from '../components/OrganizerDashboard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'

// One URL, three dashboards. The role decides which one renders.
export default function Dashboard() {
  const { user } = useAuth()
  const { profile, roleProfile, isLoading, error, reload } = useMyProfile(user.id)

  if (isLoading) return <PageShell><LoadingState label="Loading your dashboard…" /></PageShell>
  if (error) {
    return <PageShell><ErrorState title="Could not load your profile" error={error} onRetry={reload} /></PageShell>
  }
  if (profile.role === 'admin') return <Navigate to="/admin" replace />

  const firstName = (profile.full_name || user.email).split(' ')[0]

  // First visit: nothing works until the role profile exists, so the
  // dashboard IS the setup form.
  if (!roleProfile) {
    return (
      <PageShell title="Welcome," highlight={firstName} subtitle="One quick step before you start." width="max-w-3xl">
        <Card>
          <RoleProfilePanel userId={user.id} role={profile.role} roleProfile={null} onChanged={reload} />
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell title="Hello," highlight={firstName}
      subtitle={profile.role === 'artist' ? 'Your stage, your calendar, your price.' : 'Your events and bookings at a glance.'}>
      {profile.role === 'artist'
        ? <ArtistDashboard userId={user.id} artistProfile={roleProfile} />
        : <OrganizerDashboard userId={user.id} />}
    </PageShell>
  )
}
