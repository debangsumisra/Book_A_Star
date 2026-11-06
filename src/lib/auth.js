import { supabase } from './supabase.js'

// Pages call these instead of touching supabase.auth directly (coding rule 6),
// so if the auth provider ever changes, only this file changes.

// `role` and `full_name` travel as signup metadata. The handle_new_user trigger
// (002_profiles.sql) reads them ONCE to create the profiles row, and only
// accepts 'organizer' or 'artist' — sending 'admin' from here would be ignored.
export async function signUpWithEmail({ email, password, fullName, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })
  if (error) throw error

  // When "Confirm email" is on in the dashboard, Supabase creates the user but
  // returns no session until they click the link in their inbox.
  return { needsEmailConfirmation: !data.session }
}

export async function signInWithEmail({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

// The role comes from this table row, never from auth metadata (rule 9a).
export async function fetchOwnProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, city, avatar_url')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Supabase error messages are written for developers. Translate the common ones.
export function friendlyAuthError(error) {
  const message = error?.message ?? ''
  if (message.includes('Invalid login credentials')) return 'Wrong email or password.'
  if (message.includes('Email not confirmed')) return 'Please confirm your email first — check your inbox.'
  if (message.includes('User already registered')) return 'An account with this email already exists. Try logging in.'
  // Supabase's built-in mailer allows only a few emails per hour per project.
  if (error?.code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
    return 'We cannot send another confirmation email right now. If you already signed up, confirm via the email we sent, or try again in an hour.'
  }
  if (message.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.'
  if (message.includes('Failed to fetch')) return 'Cannot reach the server. Check your internet connection.'
  return message || 'Something went wrong. Please try again.'
}
