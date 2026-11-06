import FormField from './FormField.jsx'

// Pricing section of the artist form. Only the starting price is required;
// the other two are optional ways of quoting.
export default function ArtistPricingFields({ values, setField }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold uppercase tracking-wide text-gold">Pricing (INR)</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Starting price" id="priceMin" type="number" min="0" step="500"
          value={values.priceMin} onChange={(e) => setField('priceMin', e.target.value)} placeholder="15000" />
        <FormField label="Per event (optional)" id="pricePerEvent" type="number" min="0" step="500"
          value={values.pricePerEvent} onChange={(e) => setField('pricePerEvent', e.target.value)} />
        <FormField label="Per hour (optional)" id="pricePerHour" type="number" min="0" step="100"
          value={values.pricePerHour} onChange={(e) => setField('pricePerHour', e.target.value)} />
      </div>
    </fieldset>
  )
}
