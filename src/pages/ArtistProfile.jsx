import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useArtist, useArtistReviews, usePortfolio } from '../hooks/useArtists.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import StarRating from '../components/StarRating.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import PortfolioGrid from '../components/PortfolioGrid.jsx'
import ReviewList from '../components/ReviewList.jsx'
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx'
import RequestBookingForm from '../components/RequestBookingForm.jsx'
import ReportForm from '../components/ReportForm.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatPrice, humanize } from '../lib/format.js'

// Public: works logged out. The query never selects phone or email — those
// live in profiles_private, which anon cannot read at all (step 19).
export default function ArtistProfile() {
  const { artistId } = useParams()
  const { user, role } = useAuth()
  const artistQuery = useArtist(artistId)
  const portfolioQuery = usePortfolio(artistId)
  const reviewsQuery = useArtistReviews(artistId)
  const artist = artistQuery.data

  if (artistQuery.isLoading) return <PageShell><LoadingState label="Loading artist…" /></PageShell>
  if (artistQuery.error) return <PageShell><ErrorState error={artistQuery.error} onRetry={artistQuery.reload} /></PageShell>
  if (!artist) {
    return (
      <PageShell>
        <EmptyState title="Artist not found" message="This profile does not exist or is not listed right now."
          action={<Button to="/artists">Back to artists</Button>} />
      </PageShell>
    )
  }

  const isOwnProfile = user?.id === artist.id
  const prices = [
    ['Starting from', artist.price_min],
    ['Per event', artist.price_per_event],
    ['Per hour', artist.price_per_hour],
  ].filter(([, amount]) => amount !== null && amount !== undefined)

  return (
    <PageShell>
      {isOwnProfile && !artist.is_published && (
        <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          This is a preview. Your profile is hidden from the directory until you publish it.
        </p>
      )}

      <section className="flex flex-col gap-6 rounded-3xl border border-line bg-panel p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar src={artist.avatar_url} name={artist.stage_name} size="h-24 w-24 text-3xl" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-white">{artist.stage_name}</h1>
            {artist.is_verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-slate-300">
            {humanize(artist.category)} · {artist.base_city}
            {artist.travels_outside_city && ' · travels for shows'}
            {artist.experience_years !== null && ` · ${artist.experience_years} yrs experience`}
          </p>
          {artist.languages?.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">Performs in {artist.languages.join(', ')}</p>
          )}
          <div className="mt-2"><StarRating value={artist.rating_avg} count={artist.rating_count} /></div>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-slate-400">from</p>
          <p className="text-3xl font-bold text-gold">{formatPrice(artist.price_min, artist.currency)}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {artist.bio && (
            <Card title="The" highlight="Story">
              <p className="whitespace-pre-line text-slate-300">{artist.bio}</p>
            </Card>
          )}

          <Card title="Portfolio">
            {portfolioQuery.isLoading ? <LoadingState /> : portfolioQuery.error ? (
              <ErrorState error={portfolioQuery.error} onRetry={portfolioQuery.reload} />
            ) : portfolioQuery.data.length === 0 ? (
              <EmptyState title="No portfolio items yet" />
            ) : (
              <PortfolioGrid items={portfolioQuery.data} />
            )}
          </Card>

          <Card title="Reviews" actions={<span className="text-sm text-slate-400">{artist.rating_count} total</span>}>
            {reviewsQuery.isLoading ? <LoadingState /> : reviewsQuery.error ? (
              <ErrorState error={reviewsQuery.error} onRetry={reviewsQuery.reload} />
            ) : reviewsQuery.data.length === 0 ? (
              <EmptyState title="No reviews yet" message="Reviews appear after completed bookings." />
            ) : (
              <ReviewList reviews={reviewsQuery.data} />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Book" highlight={artist.stage_name}>
            {!user ? (
              <div className="space-y-3 text-sm text-slate-300">
                <p>Log in as an organizer to send a booking request.</p>
                <Button to="/login" state={{ from: `/artists/${artist.id}` }} className="w-full">Log in to book</Button>
              </div>
            ) : role === 'organizer' ? (
              <RequestBookingForm artist={artist} organizerId={user.id} />
            ) : isOwnProfile ? (
              <Button to="/profile" variant="secondary" className="w-full">Edit your profile</Button>
            ) : (
              <p className="text-sm text-slate-400">Only organizers can send booking requests.</p>
            )}
          </Card>

          <Card title="Pricing">
            <dl className="space-y-2 text-sm">
              {prices.map(([label, amount]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-semibold text-white">{formatPrice(amount, artist.currency)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Availability">
            <AvailabilityCalendar artistId={artist.id} />
          </Card>

          {user && !isOwnProfile && (
            <ReportForm reporterId={user.id} reportedUserId={artist.id} label="Report this profile" />
          )}
        </div>
      </div>
    </PageShell>
  )
}
