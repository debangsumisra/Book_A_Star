import { portfolioItemUrl, youtubeEmbedUrl } from '../lib/portfolio.js'
import { formatDate } from '../lib/format.js'

function Media({ item }) {
  const url = portfolioItemUrl(item)
  if (item.media_type === 'image') {
    return <img src={url} alt={item.title || 'Portfolio image'} loading="lazy" className="aspect-video w-full rounded-lg object-cover" />
  }
  if (item.media_type === 'video') {
    const embed = youtubeEmbedUrl(url)
    if (embed) {
      return <iframe src={embed} title={item.title || 'Video'} allowFullScreen loading="lazy"
        className="aspect-video w-full rounded-lg" />
    }
    if (item.storage_path) return <video src={url} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" />
  }
  if (item.media_type === 'audio' && item.storage_path) {
    return <audio src={url} controls className="w-full" />
  }
  // Any other external link (SoundCloud, Instagram…): a safe plain link.
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex aspect-video items-center justify-center rounded-lg border border-line text-sm text-gold hover:underline">
      Open {item.media_type} ↗
    </a>
  )
}

// `onDelete` is passed only on the artist's own editor, never on the public page.
export default function PortfolioGrid({ items, onDelete, deletingId }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure key={item.id} className="rounded-xl border border-line bg-ink/40 p-3">
          <Media item={item} />
          <figcaption className="mt-2 text-sm">
            {item.title && <p className="font-medium text-white">{item.title}</p>}
            {(item.event_name || item.event_date) && (
              <p className="text-xs text-slate-400">
                {[item.event_name, item.event_date && formatDate(item.event_date)].filter(Boolean).join(' · ')}
              </p>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(item)} disabled={deletingId === item.id}
                className="mt-2 text-xs text-danger hover:underline disabled:opacity-60">
                {deletingId === item.id ? 'Removing…' : 'Remove'}
              </button>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
