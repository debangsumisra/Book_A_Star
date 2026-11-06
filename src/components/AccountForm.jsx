import { useState } from 'react'
import Avatar from './Avatar.jsx'
import Button from './Button.jsx'
import FormField from './FormField.jsx'
import { updateAccount, uploadAvatar, validateAccount } from '../lib/account.js'
import { friendlyError } from '../lib/errors.js'

// Name, city, phone and photo. Phone goes to profiles_private, which only
// you and admins can read — it never appears on a public page.
export default function AccountForm({ userId, role, account, onSaved }) {
  const [fullName, setFullName] = useState(account.full_name ?? '')
  const [city, setCity] = useState(account.city ?? '')
  const [phone, setPhone] = useState(account.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(account.avatar_url)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState({ text: '', isError: false })

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateAccount({ fullName, phone })
    if (problem) return setMessage({ text: problem, isError: true })
    setIsSaving(true)
    setMessage({ text: '', isError: false })
    try {
      await updateAccount(userId, { fullName, city, phone })
      setMessage({ text: 'Saved.', isError: false })
      onSaved()
    } catch (caught) {
      setMessage({ text: friendlyError(caught), isError: true })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatar(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again after an error
    if (!file) return
    setIsUploading(true)
    setMessage({ text: '', isError: false })
    try {
      setAvatarUrl(await uploadAvatar(userId, file, role))
      onSaved()
    } catch (caught) {
      setMessage({ text: friendlyError(caught), isError: true })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={fullName} size="h-16 w-16 text-xl" />
        <label className="cursor-pointer text-sm text-gold hover:underline">
          {isUploading ? 'Uploading…' : 'Change photo'}
          <input type="file" accept="image/*" onChange={handleAvatar} disabled={isUploading} className="sr-only" />
        </label>
      </div>
      <FormField label="Full name" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" id="accountCity" value={city} onChange={(e) => setCity(e.target.value)} />
        <FormField label="Phone (private)" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel" placeholder="+91 98765 43210" />
      </div>
      <p className="text-xs text-slate-500">Email: {account.email} · Your phone number is never shown publicly.</p>
      {message.text && (
        <p role={message.isError ? 'alert' : 'status'} className={`text-sm ${message.isError ? 'text-danger' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save account'}</Button>
    </form>
  )
}
