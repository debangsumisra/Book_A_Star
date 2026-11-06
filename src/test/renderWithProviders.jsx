import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

// Renders a component as if it were inside the real app: a router (at
// `path`) and an AuthContext with whatever user/role the test needs.
export function renderWithProviders(ui, { auth = {}, path = '/', routes = [] } = {}) {
  const authValue = {
    user: null, loading: false, profile: null, role: null,
    refreshProfile: async () => {}, signOut: async () => {},
    ...auth,
  }
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={ui} />
          {routes.map(({ path: routePath, element }) => <Route key={routePath} path={routePath} element={element} />)}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}
