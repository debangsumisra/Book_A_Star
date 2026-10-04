import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import { signInWithEmail, friendlyAuthError } from '../lib/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  // Set by ProtectedRoute when it bounced the user here; default to the dashboard.
  const redirectTo = location.state?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!email.trim() || !password) return setErrorMessage('Enter your email and password.')

    setIsSubmitting(true)
    try {
      await signInWithEmail({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(friendlyAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome" highlight="Back" subtitle="Log in to manage your bookings.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Email" id="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <FormField label="Password" id="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />

        {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}

        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-lg bg-gold py-2.5 font-semibold text-ink hover:bg-gold-dark disabled:opacity-60">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-slate-400">
          New here? <Link to="/signup" className="text-gold hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
