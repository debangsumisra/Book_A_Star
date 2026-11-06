import FormField from './FormField.jsx'
import SelectField from './SelectField.jsx'
import TextAreaField from './TextAreaField.jsx'
import ToggleField from './ToggleField.jsx'
import { ARTIST_CATEGORIES } from '../lib/profiles.js'

// "Who are you" section of the artist form. Purely presentational:
// it receives the values and one setter, and owns no state of its own.
export default function ArtistAboutFields({ values, setField }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold uppercase tracking-wide text-gold">About you</legend>
      <FormField label="Stage name" id="stageName" value={values.stageName}
        onChange={(e) => setField('stageName', e.target.value)} placeholder="e.g. DJ Nova" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Category" id="category" options={ARTIST_CATEGORIES}
          value={values.category} onChange={(e) => setField('category', e.target.value)} />
        <FormField label="Experience (years)" id="experienceYears" type="number" min="0" step="1"
          value={values.experienceYears} onChange={(e) => setField('experienceYears', e.target.value)} />
      </div>
      <FormField label="Base city" id="baseCity" value={values.baseCity}
        onChange={(e) => setField('baseCity', e.target.value)} placeholder="e.g. Pune" />
      <ToggleField id="travelsOutsideCity" label="I travel outside my city"
        checked={values.travelsOutsideCity} onChange={(checked) => setField('travelsOutsideCity', checked)} />
      <FormField label="Languages you perform in" id="languages" value={values.languages}
        onChange={(e) => setField('languages', e.target.value)} placeholder="Hindi, English, Marathi" />
      <TextAreaField label="Bio" id="bio" value={values.bio} maxLength={1000}
        onChange={(e) => setField('bio', e.target.value)}
        placeholder="Your style, the events you play, what makes your show special."
        hint={`${values.bio.length}/1000`} />
    </fieldset>
  )
}
