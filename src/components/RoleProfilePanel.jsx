import { useState } from 'react'
import RoleProfileSummary from './RoleProfileSummary.jsx'
import ArtistProfileForm from './ArtistProfileForm.jsx'
import OrganizerProfileForm from './OrganizerProfileForm.jsx'
import { deleteRoleProfile, friendlyProfileError } from '../lib/profiles.js'

// Everything you can do with your role profile: create it, view it, edit it,
// delete it. `onChanged` tells the page to re-fetch after any write.
export default function RoleProfilePanel({ userId, role, roleProfile, onChanged }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const ProfileForm = role === 'artist' ? ArtistProfileForm : role === 'organizer' ? OrganizerProfileForm : null
  if (!ProfileForm) return null // admins have no role profile

  // No row yet -> create form. After saving, onChanged re-fetches and the row appears.
  if (!roleProfile) return <ProfileForm userId={userId} onSaved={onChanged} />

  if (isEditing) {
    return (
      <ProfileForm userId={userId} existing={roleProfile} onCancel={() => setIsEditing(false)}
        onSaved={() => { setIsEditing(false); onChanged() }} />
    )
  }

  async function handleDelete() {
    // window.confirm is plain and ugly, but it is honest and one line.
    // A deletion with no "are you sure?" is a support ticket waiting to happen.
    if (!window.confirm(`Delete your ${role} profile? This cannot be undone.`)) return
    setErrorMessage('')
    setIsDeleting(true)
    try {
      await deleteRoleProfile(role, userId)
      onChanged()
    } catch (error) {
      setErrorMessage(friendlyProfileError(error))
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <RoleProfileSummary role={role} roleProfile={roleProfile} />
      <div className="mt-4 flex gap-3">
        <button onClick={() => setIsEditing(true)}
          className="rounded-lg bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold-dark">
          Edit
        </button>
        <button onClick={handleDelete} disabled={isDeleting}
          className="rounded-lg border border-danger/50 px-5 py-2 text-danger hover:bg-danger/10 disabled:opacity-60">
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      {errorMessage && <p role="alert" className="mt-3 text-sm text-danger">{errorMessage}</p>}
    </div>
  )
}
