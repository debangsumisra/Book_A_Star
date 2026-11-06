import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Which table holds the role-specific details for each role.
const ROLE_TABLE = { artist: 'artist_profiles', organizer: 'organizer_profiles' }

// Loads the signed-in user's `profiles` row plus their artist / organizer row.
// Returns every state a page needs to render: loading, error, empty, data.
export function useMyProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [roleProfile, setRoleProfile] = useState(null) // null = not set up yet (the "empty" state)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // useCallback keeps the same function between renders, so it is safe to put
  // in useEffect's dependency list and to hand to a "Try again" button.
  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, city')
      .eq('id', userId)
      .single() // exactly one row expected; zero or many is an error

    if (profileError) {
      setError(profileError)
      setIsLoading(false)
      return
    }

    const roleTable = ROLE_TABLE[profileRow.role]
    let roleRow = null
    if (roleTable) {
      // maybeSingle: zero rows is fine (profile not created yet), not an error.
      const { data, error: roleError } = await supabase
        .from(roleTable)
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (roleError) {
        setError(roleError)
        setIsLoading(false)
        return
      }
      roleRow = data
    }

    setProfile(profileRow)
    setRoleProfile(roleRow)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) loadProfile()
  }, [userId, loadProfile])

  return { profile, roleProfile, isLoading, error, reload: loadProfile }
}
