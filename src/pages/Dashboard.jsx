import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// Minimal for now — becomes the real organizer / artist dashboard in steps 29–30.
// It exists so step 7 has a protected URL to test against.
export default function Dashboard() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-ink px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-panel border border-line p-8">
        <h1 className="text-2xl font-bold text-white">
          Your <span className="text-gold">Dashboard</span>
        </h1>
        <p className="mt-2 text-slate-300">Signed in as {user.email}</p>
        <Link to="/" className="mt-6 inline-block text-gold hover:underline">← Home</Link>
      </div>
    </main>
  )
}
