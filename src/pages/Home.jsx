import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState('')

  async function handleSignOut() {
    setSignOutError('')
    try {
      await signOut()
    } catch (error) {
      setSignOutError(error.message)
    }
  }

  return (
    <main className="min-h-screen bg-ink bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.35),_transparent_60%)] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-panel border border-line p-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          Book A <span className="text-gold">Star</span>
        </h1>

        {loading ? (
          <p className="mt-6 text-slate-400">Checking your session…</p>
        ) : user ? (
          <>
            <p className="mt-6 text-slate-300">
              Logged in as <span className="text-white font-medium">{user.email}</span>
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/dashboard" className="rounded-lg bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold-dark">Dashboard</Link>
              <button onClick={handleSignOut}
                className="rounded-lg border border-line px-5 py-2 text-white hover:border-gold">
                Log out
              </button>
            </div>
            {signOutError && <p role="alert" className="mt-3 text-sm text-danger">{signOutError}</p>}
          </>
        ) : (
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="rounded-lg border border-line px-5 py-2 text-white hover:border-gold">Log in</Link>
            <Link to="/signup" className="rounded-lg bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold-dark">Sign up</Link>
          </div>
        )}
      </div>
    </main>
  )
}
