import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// Wrap routes that need a logged-in user. This is UX, not security (rule 11):
// it stops a logged-out visitor from SEEING the page, but the data on it is
// protected by RLS in the database, which is the check that actually matters.
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Session not restored yet — wait instead of guessing "logged out".
  if (loading) {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </main>
    )
  }

  if (!user) {
    // `replace` swaps the history entry, so Back does not loop to this page.
    // `state.from` remembers where they were going, so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // <Outlet /> renders whichever child route matched (see App.jsx).
  return <Outlet />
}
