import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import PageShell from './PageShell.jsx'
import ErrorState from './ErrorState.jsx'

// Nested inside ProtectedRoute: the user is logged in; now check the role.
// Like ProtectedRoute this is UX only — RLS is what actually refuses the data.
export default function RoleRoute({ allow }) {
  const { role, profile, refreshProfile } = useAuth()

  if (!profile) {
    return (
      <PageShell>
        <ErrorState title="Could not load your account" error={new Error('Your profile did not load.')} onRetry={refreshProfile} />
      </PageShell>
    )
  }
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
