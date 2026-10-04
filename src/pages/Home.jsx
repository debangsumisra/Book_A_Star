import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Home() {
  const [status, setStatus] = useState('checking...')

  // Temporary smoke test: proves the browser can reach Supabase.
  // Delete this whole useEffect once you build the first real page.
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) =>
        setStatus(error ? `error: ${error.message}` : 'connected to Supabase')
      )
      .catch((err) => setStatus(`error: ${err.message}`))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Book A Star</h1>
        <p className="mt-2 text-slate-600">Scaffold is running.</p>
        <p className="mt-4 text-sm font-mono text-slate-500">
          Supabase: {status}
        </p>
      </div>
    </main>
  )
}
