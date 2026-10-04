import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { signOutUser } from '../lib/auth.js'

// Context = a value any component can read without passing it down as props
// through every layer. Read it with the useAuth() hook, not with this directly.
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Starts true: until Supabase has checked localStorage for a saved session we
  // do not KNOW whether someone is logged in. Treating "unknown" as "logged out"
  // would bounce a logged-in user to /login on every refresh (step 7).
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fires once immediately (INITIAL_SESSION, restored from localStorage),
    // then again on every SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED — including
    // ones that happen in another browser tab.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup: stop listening when the provider unmounts, otherwise React's
    // StrictMode double-mount in dev would leave two listeners running.
    return () => subscription.unsubscribe()
  }, [])

  const value = { user, loading, signOut: signOutUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
