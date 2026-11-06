import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'

// Builds the same nesting as App.jsx: ProtectedRoute > RoleRoute > page.
function renderAt(path, auth) {
  const value = { loading: false, user: null, profile: null, role: null, refreshProfile: async () => {}, signOut: async () => {}, ...auth }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/dashboard" element={<p>dashboard page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allow={['organizer']} />}>
              <Route path="/events" element={<p>events page</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  it('sends a logged-out visitor to /login', () => {
    renderAt('/events', {})
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('waits while the session is being restored instead of redirecting', () => {
    renderAt('/events', { loading: true })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('lets the right role through', () => {
    renderAt('/events', { user: { id: 'u1' }, profile: { role: 'organizer' }, role: 'organizer' })
    expect(screen.getByText('events page')).toBeInTheDocument()
  })

  it('redirects the wrong role to the dashboard', () => {
    renderAt('/events', { user: { id: 'u1' }, profile: { role: 'artist' }, role: 'artist' })
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })
})
