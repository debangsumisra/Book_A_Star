import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

// const { user, loading, signOut } = useAuth()
export function useAuth() {
  const auth = useContext(AuthContext)
  // Catches the classic mistake of using the hook outside <AuthProvider>,
  // which would otherwise fail later as a confusing "cannot read 'user' of null".
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
