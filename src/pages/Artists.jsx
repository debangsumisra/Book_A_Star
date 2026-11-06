import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import ArtistCard from '../components/ArtistCard.jsx'
import ArtistFilters, { EMPTY_FILTERS } from '../components/ArtistFilters.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useArtistSearch } from '../hooks/useArtists.js'
import { formatDate } from '../lib/format.js'

// Filters live in the URL (?city=Pune&date=...). That makes a search
// shareable, survives a refresh, and lets "Find artists for this date" on an
// event card link straight into a pre-filtered directory.
function filtersFromParams(params) {
  return Object.fromEntries(Object.keys(EMPTY_FILTERS).map((key) => [key, params.get(key) ?? '']))
}

export default function Artists() {
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState(() => filtersFromParams(params))

  // Typing in "City" would otherwise fire a query on every keystroke.
  // Debouncing waits until the user pauses for 350 ms.
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
      setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [filters, setParams])

  const { data: artists, isLoading, error, reload } = useArtistSearch(debouncedFilters)

  return (
    <PageShell title="Find your" highlight="Star"
      subtitle={debouncedFilters.date ? `Showing artists available on ${formatDate(debouncedFilters.date)}` : 'Every artist here is published and bookable.'}>
      <ArtistFilters filters={filters} onChange={setFilters} />
      <div className="mt-6">
        {isLoading ? (
          <LoadingState label="Searching artists…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : artists.length === 0 ? (
          <EmptyState title="No artists match"
            message="Try another city, widen the price range, or pick a different date." />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-400">{artists.length} artist{artists.length === 1 ? '' : 's'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}
