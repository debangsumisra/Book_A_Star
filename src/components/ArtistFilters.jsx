import { ARTIST_CATEGORIES } from '../lib/profiles.js'
import { humanize, todayIso } from '../lib/format.js'

export const EMPTY_FILTERS = { category: '', city: '', priceMin: '', priceMax: '', minRating: '', date: '' }

const inputClass = 'w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none'

// Controlled by the page: it owns the filter values, this only draws inputs.
export default function ArtistFilters({ filters, onChange }) {
  const set = (name) => (event) => onChange({ ...filters, [name]: event.target.value })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <form onSubmit={(event) => event.preventDefault()} aria-label="Filter artists"
      className="grid gap-3 rounded-2xl border border-line bg-panel p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="text-xs text-slate-400">Category
        <select value={filters.category} onChange={set('category')} className={`${inputClass} mt-1`}>
          <option value="">All</option>
          {ARTIST_CATEGORIES.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-400">City
        <input value={filters.city} onChange={set('city')} placeholder="Any city" className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-400">Min price (₹)
        <input type="number" min="0" step="1000" value={filters.priceMin} onChange={set('priceMin')} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-400">Max price (₹)
        <input type="number" min="0" step="1000" value={filters.priceMax} onChange={set('priceMax')} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-400">Min rating
        <select value={filters.minRating} onChange={set('minRating')} className={`${inputClass} mt-1`}>
          <option value="">Any</option>
          {[4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}★ and up</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-400">Available on
        <input type="date" min={todayIso()} value={filters.date} onChange={set('date')} className={`${inputClass} mt-1`} />
      </label>
      {hasFilters && (
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)}
          className="text-left text-sm text-gold hover:underline sm:col-span-2 lg:col-span-6">
          Clear all filters
        </button>
      )}
    </form>
  )
}
