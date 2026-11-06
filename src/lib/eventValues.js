// Event form <-> database row, plus validation. Same pattern as
// artistProfileValues.js: pure functions the form calls and tests can check.

import { todayIso } from './format.js'

export const EVENT_TYPES = ['wedding', 'college_fest', 'corporate', 'concert', 'private_party', 'other']
export const EVENT_STATUSES = ['draft', 'open', 'closed', 'completed', 'cancelled']

const toText = (value) => (value === null || value === undefined ? '' : String(value))
const optionalNumber = (text) => (text.trim() === '' ? null : Number(text))

export function rowToEventValues(row) {
  return {
    title: row?.title ?? '',
    eventType: row?.event_type ?? 'wedding',
    eventDate: row?.event_date ?? '',
    startTime: row?.start_time?.slice(0, 5) ?? '',
    durationHours: toText(row?.duration_hours),
    city: row?.city ?? '',
    venue: row?.venue ?? '',
    budgetMin: toText(row?.budget_min),
    budgetMax: toText(row?.budget_max),
    audienceSize: toText(row?.audience_size),
    requirements: row?.requirements ?? '',
    status: row?.status ?? 'open',
  }
}

export function eventValuesToRow(values) {
  return {
    title: values.title.trim(),
    event_type: values.eventType,
    event_date: values.eventDate,
    start_time: values.startTime || null,
    duration_hours: optionalNumber(values.durationHours),
    city: values.city.trim(),
    venue: values.venue.trim() || null,
    budget_min: optionalNumber(values.budgetMin),
    budget_max: optionalNumber(values.budgetMax),
    audience_size: optionalNumber(values.audienceSize),
    requirements: values.requirements.trim() || null,
    status: values.status,
  }
}

function isNonNegative(text) {
  if (text.trim() === '') return true
  const number = Number(text)
  return !Number.isNaN(number) && number >= 0
}

// `isNew`: only a brand-new event must be in the future. An existing past
// event can still be edited (e.g. marked completed).
export function validateEventValues(values, { isNew = true, today = todayIso() } = {}) {
  if (values.title.trim().length < 3) return 'Give the event a title of at least 3 characters.'
  if (values.title.trim().length > 120) return 'Title must be 120 characters or fewer.'
  if (!values.eventDate) return 'Pick the event date.'
  if (isNew && values.eventDate < today) return 'The event date cannot be in the past.'
  if (!values.city.trim()) return 'Enter the city.'
  if (!isNonNegative(values.budgetMin) || !isNonNegative(values.budgetMax)) return 'Budget must be 0 or more.'
  if (values.budgetMin && values.budgetMax && Number(values.budgetMax) < Number(values.budgetMin)) {
    return 'Maximum budget must be at least the minimum budget.'
  }
  if (values.durationHours && !(Number(values.durationHours) > 0)) return 'Duration must be more than 0 hours.'
  if (values.audienceSize && !(Number.isInteger(Number(values.audienceSize)) && Number(values.audienceSize) > 0)) {
    return 'Audience size must be a whole number above 0.'
  }
  if (values.requirements.length > 2000) return 'Requirements must be 2000 characters or fewer.'
  return ''
}
