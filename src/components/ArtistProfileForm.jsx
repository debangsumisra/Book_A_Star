import { useState } from 'react'
import ArtistAboutFields from './ArtistAboutFields.jsx'
import ArtistPricingFields from './ArtistPricingFields.jsx'
import ToggleField from './ToggleField.jsx'
import { createArtistProfile, updateArtistProfile, friendlyProfileError } from '../lib/profiles.js'
import { rowToArtistValues, artistValuesToRow, validateArtistValues } from '../lib/artistProfileValues.js'

// One form for creating and editing. Passing `existing` (the current row)
// switches it to edit mode and pre-fills every field.
export default function ArtistProfileForm({ userId, existing, onSaved, onCancel }) {
  const isEditing = Boolean(existing)
  // Eleven fields -> one state object instead of eleven useState calls.
  const [values, setValues] = useState(() => rowToArtistValues(existing))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // The functional form `prev => ...` always starts from the latest state,
  // so two quick changes in a row can never overwrite each other.
  function setField(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validateArtistValues(values)
    setErrorMessage(validationError)
    if (validationError) return

    setIsSaving(true)
    try {
      const row = artistValuesToRow(values)
      if (isEditing) await updateArtistProfile(userId, row)
      else await createArtistProfile(userId, row)
      onSaved() // let the page re-fetch, so it shows what the DATABASE now holds
    } catch (error) {
      setErrorMessage(friendlyProfileError(error))
      setIsSaving(false) // only on failure: on success this form disappears
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <h2 className="text-lg font-semibold text-white">
        {isEditing ? 'Edit' : 'Set up'} your <span className="text-gold">Artist</span> profile
      </h2>

      <ArtistAboutFields values={values} setField={setField} />
      <ArtistPricingFields values={values} setField={setField} />

      <div className="rounded-xl border border-line p-4">
        <ToggleField id="isPublished" label="List me in the artist directory"
          description="Organizers can only find and book you while this is on. Needs a bio and a language."
          checked={values.isPublished} onChange={(checked) => setField('isPublished', checked)} />
      </div>

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
