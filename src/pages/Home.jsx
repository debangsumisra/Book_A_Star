import { useAuth } from '../hooks/useAuth.js'
import { useFeaturedArtists } from '../hooks/useArtists.js'
import PageShell from '../components/PageShell.jsx'
import Button from '../components/Button.jsx'
import ArtistCard from '../components/ArtistCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'

const STEPS = [
  { title: 'Post your event', text: 'Date, city, budget and what you need. Takes two minutes.' },
  { title: 'Find your star', text: 'Filter by category, city, price, rating — and who is actually free that day.' },
  { title: 'Talk it through', text: 'Message the artist directly and settle the price with offers and counter-offers.' },
  { title: 'Confirm & celebrate', text: 'Lock the date. Afterwards, leave a review that helps the next organizer.' },
]

const PROBLEMS = [
  ['Endless phone calls', 'Availability, pricing and portfolios in one place.'],
  ['Steep agency fees', 'Organizers and artists deal directly. No middleman cut.'],
  ['Talent goes unseen', 'Every artist gets a profile organizers can actually find.'],
]

export default function Home() {
  const { user, role } = useAuth()
  const { data: artists, isLoading, error, reload } = useFeaturedArtists()

  const primaryAction = !user
    ? { to: '/signup', label: 'Get started — it’s free' }
    : role === 'artist'
      ? { to: '/gigs', label: 'Find gigs' }
      : { to: '/events/new', label: 'Post an event' }

  return (
    <PageShell>
      <section className="py-10 text-center sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Live talent, booked directly</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
          Book the <span className="text-gold">Star</span> your event deserves
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Singers, bands, DJs and performers — discover them, negotiate, and confirm the booking in one place.
          No agencies in the middle.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={primaryAction.to}>{primaryAction.label}</Button>
          <Button to="/artists" variant="secondary">Browse artists</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Why Book A Star">
        {PROBLEMS.map(([problem, answer]) => (
          <div key={problem} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-sm text-red-300 line-through decoration-red-400/60">{problem}</p>
            <p className="mt-2 text-white">{answer}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">How it <span className="text-gold">Works</span></h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-line bg-panel p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-bold text-ink">{index + 1}</span>
              <p className="mt-3 font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-sm text-slate-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Featured <span className="text-gold">Stars</span></h2>
          <Button to="/artists" variant="ghost">See all →</Button>
        </div>
        <div className="mt-6">
          {isLoading ? (
            <LoadingState label="Loading artists…" />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : artists.length === 0 ? (
            <EmptyState title="No artists listed yet"
              message="Be the first star on the platform."
              action={<Button to="/signup">Join as an artist</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
            </div>
          )}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-gold/30 bg-gradient-to-br from-glow/30 to-panel p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">A <span className="text-gold">Direct</span> Connection</h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-300">
          Artists keep full control of their calendar, pricing and showcase. Organizers get honest availability and real reviews.
        </p>
        {!user && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button to="/signup">I organize events</Button>
            <Button to="/signup" variant="secondary">I’m an artist</Button>
          </div>
        )}
      </section>
    </PageShell>
  )
}
