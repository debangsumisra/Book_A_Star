// Pure functions for the artist form: no React, no Supabase.
// Keeping them separate means the form component stays about layout, and
// these rules can be read (and later tested) on their own.

// Database row -> form values. Inputs always hold strings, so numbers are
// converted, and null becomes '' (an <input> must never get `null` as value).
export function rowToArtistValues(row) {
  const toText = (value) => (value === null || value === undefined ? '' : String(value))
  return {
    stageName: row?.stage_name ?? '',
    category: row?.category ?? 'singer',
    baseCity: row?.base_city ?? '',
    travelsOutsideCity: row?.travels_outside_city ?? false,
    languages: (row?.languages ?? []).join(', '),
    experienceYears: toText(row?.experience_years),
    bio: row?.bio ?? '',
    priceMin: toText(row?.price_min),
    pricePerEvent: toText(row?.price_per_event),
    pricePerHour: toText(row?.price_per_hour),
    isPublished: row?.is_published ?? false,
  }
}

// '' -> null so an optional number column is cleared instead of saved as 0.
const optionalNumber = (text) => (text.trim() === '' ? null : Number(text))

// Form values -> database row.
export function artistValuesToRow(values) {
  return {
    stage_name: values.stageName.trim(),
    category: values.category,
    base_city: values.baseCity.trim(),
    travels_outside_city: values.travelsOutsideCity,
    // "Hindi, English , ,Marathi" -> ['Hindi', 'English', 'Marathi']
    languages: values.languages.split(',').map((language) => language.trim()).filter(Boolean),
    experience_years: optionalNumber(values.experienceYears),
    bio: values.bio.trim() || null,
    price_min: Number(values.priceMin),
    price_per_event: optionalNumber(values.pricePerEvent),
    price_per_hour: optionalNumber(values.pricePerHour),
    is_published: values.isPublished,
  }
}

function isValidOptionalAmount(text) {
  if (text.trim() === '') return true
  const number = Number(text)
  return !Number.isNaN(number) && number >= 0
}

// Returns the first problem as a sentence, or '' when everything is fine.
export function validateArtistValues(values) {
  if (values.stageName.trim().length < 2) return 'Stage name must be at least 2 characters.'
  if (values.stageName.trim().length > 60) return 'Stage name must be 60 characters or fewer.'
  if (!values.baseCity.trim()) return 'Enter the city you are based in.'
  if (values.priceMin.trim() === '' || !isValidOptionalAmount(values.priceMin)) return 'Enter a starting price of 0 or more.'
  if (!isValidOptionalAmount(values.pricePerEvent)) return 'Price per event must be 0 or more.'
  if (!isValidOptionalAmount(values.pricePerHour)) return 'Price per hour must be 0 or more.'
  const years = values.experienceYears.trim()
  if (years !== '' && (!Number.isInteger(Number(years)) || Number(years) < 0)) return 'Experience must be a whole number of years.'
  if (values.bio.length > 1000) return 'Bio must be 1000 characters or fewer.'

  // Publishing puts you in front of organizers, so require enough to judge you by.
  if (values.isPublished) {
    if (values.bio.trim().length < 30) return 'Write a bio of at least 30 characters before publishing.'
    if (values.languages.trim() === '') return 'Add at least one language before publishing.'
  }
  return ''
}
