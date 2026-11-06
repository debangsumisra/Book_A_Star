import { useState } from 'react'
import FormField from './FormField.jsx'
import SelectField from './SelectField.jsx'
import {
  ORGANIZER_TYPES, createOrganizerProfile, updateOrganizerProfile, friendlyProfileError,
} from '../lib/profiles.js'

// Same create/edit pattern as ArtistProfileForm: `existing` switches to edit mode.
export default function OrganizerProfileForm({ userId, existing, onSaved, onCancel }) {
  const isEditing = Boolean(existing)
  const [organizationName, setOrganizationName] = useState(existing?.organization_name ?? '')
  const [organizerType, setOrganizerType] = useState(existing?.organizer_type ?? 'individual')
  const [city, setCity] = useState(existing?.city ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    // Individuals often have no organization, so only non-individuals must name one.
    if (organizerType !== 'individual' && !organizationName.trim()) {
      return setErrorMessage('Enter your organization name.')
    }
    if (!city.trim()) return setErrorMessage('Enter your city.')

    const values = { organizationName: organizationName.trim(), organizerType, city: city.trim() }
    setIsSaving(true)
    try {
      if (isEditing) await updateOrganizerProfile(userId, values)
      else await createOrganizerProfile(userId, values)
      onSaved()
    } catch (error) {
      setErrorMessage(friendlyProfileError(error))
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h2 className="text-lg font-semibold text-white">
        {isEditing ? 'Edit' : 'Set up'} your <span className="text-gold">Organizer</span> profile
      </h2>
      <SelectField label="I am a…" id="organizerType" options={ORGANIZER_TYPES}
        value={organizerType} onChange={(e) => setOrganizerType(e.target.value)} />
      <FormField label={organizerType === 'individual' ? 'Organization (optional)' : 'Organization name'}
        id="organizationName" value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. IIT Pune Cultural Committee" />
      <FormField label="City" id="city" value={city}
        onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />

      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isSaving}
          className="flex-1 rounded-lg bg-gold py-2.5 font-semibold text-ink hover:bg-gold-dark disabled:opacity-60">
          {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create profile'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-line px-5 text-white hover:border-slate-500">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
