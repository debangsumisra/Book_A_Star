import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import { signUpWithEmail, friendlyAuthError } from '../lib/auth.js'

const ROLE_OPTIONS = [
  { value: 'organizer', label: 'I organize events', hint: 'Find and book artists' },
  { value: 'artist', label: "I'm an artist", hint: 'Get discovered and booked' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('organizer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser's default full-page form submit
    setErrorMessage('')

    // Client-side validation is for a quick, friendly message.
    // Supabase validates again on the server; that is the check that counts.
    if (fullName.trim().length < 2) return setErrorMessage('Please enter your name.')
    if (password.length < 8) return setErrorMessage('Password must be at least 8 characters.')

    setIsSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUpWithEmail({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      })
      if (needsEmailConfirmation) setIsAwaitingConfirmation(true)
      else navigate('/')
    } catch (error) {
      setErrorMessage(friendlyAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAwaitingConfirmation) {
    return (
      <AuthLayout title="Check your" highlight="Inbox">
        <p className="text-slate-300">
          We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
          Click it, then come back and log in.
        </p>
        <Link to="/login" className="mt-6 inline-block text-gold hover:underline">Go to login →</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Join" highlight="Book A Star" subtitle="Create your free account.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="block text-sm font-medium text-slate-300 mb-2">I want to…</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={`rounded-lg border p-3 text-left transition ${
                  role === option.value ? 'border-gold bg-gold/10' : 'border-line hover:border-slate-500'
                }`}
              >
                <span className="block text-sm font-semibold text-white">{option.label}</span>
                <span className="block text-xs text-slate-400">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <FormField label="Full name" id="fullName" value={fullName}
          onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
        <FormField label="Email" id="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <FormField label="Password" id="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
          placeholder="At least 8 characters" required />

        {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}

        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-lg bg-gold py-2.5 font-semibold text-ink hover:bg-gold-dark disabled:opacity-60">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-gold hover:underline">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
