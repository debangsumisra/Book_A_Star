import { useState } from 'react'
import Button from './Button.jsx'
import FormField from './FormField.jsx'
import SelectField from './SelectField.jsx'
import TextAreaField from './TextAreaField.jsx'
import { EVENT_STATUSES, EVENT_TYPES, rowToEventValues, validateEventValues } from '../lib/eventValues.js'
import { todayIso } from '../lib/format.js'

// Create and edit share this form; `existing` switches to edit mode.
// It validates and hands values to `onSubmit` — the page decides what to save.
export default function EventForm({ existing, onSubmit, onCancel }) {
  const isNew = !existing
  const [values, setValues] = useState(() => rowToEventValues(existing))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const setField = (name) => (event) => setValues((previous) => ({ ...previous, [name]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateEventValues(values, { isNew })
    setErrorMessage(problem)
    if (problem) return
    setIsSaving(true)
    try {
      await onSubmit(values)
    } catch (caught) {
      setErrorMessage(caught.message)
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField label="Event title" id="title" value={values.title} onChange={setField('title')}
        placeholder="e.g. Annual College Fest — Night 2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Event type" id="eventType" options={EVENT_TYPES} value={values.eventType} onChange={setField('eventType')} />
        <FormField label="Date" id="eventDate" type="date" min={isNew ? todayIso() : undefined}
          value={values.eventDate} onChange={setField('eventDate')} />
        <FormField label="Start time (optional)" id="startTime" type="time" value={values.startTime} onChange={setField('startTime')} />
        <FormField label="Duration in hours (optional)" id="durationHours" type="number" min="0.5" step="0.5"
          value={values.durationHours} onChange={setField('durationHours')} />
        <FormField label="City" id="city" value={values.city} onChange={setField('city')} placeholder="e.g. Pune" />
        <FormField label="Venue (optional)" id="venue" value={values.venue} onChange={setField('venue')} />
        <FormField label="Budget from (₹)" id="budgetMin" type="number" min="0" step="1000"
          value={values.budgetMin} onChange={setField('budgetMin')} />
        <FormField label="Budget up to (₹)" id="budgetMax" type="number" min="0" step="1000"
          value={values.budgetMax} onChange={setField('budgetMax')} />
        <FormField label="Audience size (optional)" id="audienceSize" type="number" min="1" step="1"
          value={values.audienceSize} onChange={setField('audienceSize')} />
        {!isNew && (
          <SelectField label="Status" id="status" options={EVENT_STATUSES} value={values.status} onChange={setField('status')} />
        )}
      </div>
      <TextAreaField label="Requirements (optional)" id="requirements" maxLength={2000}
        value={values.requirements} onChange={setField('requirements')}
        placeholder="Genre, set length, sound and lighting, dress code…" hint={`${values.requirements.length}/2000`} />

      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? 'Saving…' : isNew ? 'Post event' : 'Save changes'}
        </Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  )
}
