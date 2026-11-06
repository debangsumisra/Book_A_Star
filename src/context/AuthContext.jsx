import { createContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { fetchOwnProfile, signOutUser } from '../lib/auth.js'

// Context = a value any component can read without passing it down as props
// through every layer. Read it with the useAuth() hook, not with this directly.
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Starts true: until Supabase has checked localStorage for a saved session we
  // do not KNOW whether someone is logged in. Treating "unknown" as "logged out"
  // would bounce a logged-in user to /login on every refresh (step 7).
  const [loading, setLoading] = useState(true)

  // The `profiles` row, which is where the role comes from (rule 9a: never
  // from user_metadata). Navbar and RoleRoute need it on every page.
  const [profile, setProfile] = useState(null)
  // Which user the current `profile` belongs to. Comparing it with user.id
  // tells us "a profile for THIS user has not arrived yet" without a flicker
  // between the user appearing and the profile request starting.
  const [profileUserId, setProfileUserId] = useState(null)

  useEffect(() => {
    // Fires once immediately (INITIAL_SESSION, restored from localStorage),
    // then again on every SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED — including
    // ones that happen in another browser tab.
    //
    // Do not `await` Supabase calls inside this callback: supabase-js holds an
    // internal lock while it runs, and a query in here can deadlock. That is
    // why the profile is loaded in the separate effect below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup: stop listening when the provider unmounts, otherwise React's
    // StrictMode double-mount in dev would leave two listeners running.
    return () => subscription.unsubscribe()
  }, [])

  const userId = user?.id
  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setProfileUserId(null)
      return
    }
    try {
      setProfile(await fetchOwnProfile(userId))
    } catch {
      // A failed profile load leaves profile null; pages that need it show
      // their own error state with a retry, so nothing is swallowed silently.
      setProfile(null)
    } finally {
      setProfileUserId(userId)
    }
  }, [userId])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const value = {
    user,
    // Only the FIRST profile load counts as "loading". A later refresh (after
    // editing your name) must not blank the whole page behind a spinner.
    loading: loading || (Boolean(user) && profileUserId !== user.id),
    profile,
    role: profile?.role ?? null,
    refreshProfile,
    signOut: signOutUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
