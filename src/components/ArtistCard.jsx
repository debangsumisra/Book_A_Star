import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import StarRating from './StarRating.jsx'
import VerifiedBadge from './VerifiedBadge.jsx'
import { formatPrice, humanize } from '../lib/format.js'

export default function ArtistCard({ artist }) {
  return (
    <Link to={`/artists/${artist.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-panel p-5 transition hover:-translate-y-0.5 hover:border-gold/60">
      <div className="flex items-center gap-4">
        <Avatar src={artist.avatar_url} name={artist.stage_name} size="h-14 w-14 text-lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white group-hover:text-gold">{artist.stage_name}</p>
          <p className="text-sm text-slate-400">{humanize(artist.category)} · {artist.base_city || '—'}</p>
          {artist.is_verified && <VerifiedBadge className="mt-1" />}
        </div>
      </div>
      {artist.bio && <p className="mt-4 line-clamp-2 text-sm text-slate-300">{artist.bio}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <StarRating value={artist.rating_avg} count={artist.rating_count} size="text-sm" />
        <span className="text-sm font-semibold text-gold">from {formatPrice(artist.price_min, artist.currency)}</span>
      </div>
    </Link>
  )
}
