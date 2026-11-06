import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import NotificationBell from './NotificationBell.jsx'

// Links per role. What a role SEES here is convenience; what it can DO is
// decided by RLS in the database.
const LINKS = {
  guest: [{ to: '/artists', label: 'Find artists' }],
  organizer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/artists', label: 'Find artists' },
    { to: '/events', label: 'My events' },
    { to: '/bookings', label: 'Bookings' },
  ],
  artist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/gigs', label: 'Find gigs' },
    { to: '/bookings', label: 'Requests' },
    { to: '/calendar', label: 'Calendar' },
  ],
  admin: [
    { to: '/admin', label: 'Admin' },
    { to: '/artists', label: 'Artists' },
  ],
}

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-gold/10 text-gold' : 'text-slate-300 hover:text-white'}`

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const links = LINKS[user ? role ?? 'guest' : 'guest'] ?? LINKS.guest

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      // Even if the server call failed, the local session is gone; go home.
      navigate('/')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
        <Link to="/" className="text-lg font-bold text-white">
          Book A <span className="text-gold">Star</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <NavLink to="/profile" className={linkClass} aria-label="Profile and settings">Profile</NavLink>
              <button type="button" onClick={handleSignOut}
                className="hidden rounded-lg border border-line px-3 py-2 text-sm text-white hover:border-gold sm:block">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-white hover:text-gold">Log in</Link>
              <Link to="/signup" className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Sign up</Link>
            </>
          )}
          <button type="button" onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen} aria-label="Menu"
            className="rounded-lg border border-line px-2.5 py-2 text-white md:hidden">
            ☰
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1" onClick={() => setIsMenuOpen(false)}>
            {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
            {user && (
              <button type="button" onClick={handleSignOut} className="rounded-lg px-3 py-2 text-left text-sm text-slate-300">
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
