import { initials } from '../lib/format.js'

export default function Avatar({ src, name, size = 'h-12 w-12 text-base' }) {
  if (src) {
    return <img src={src} alt={name ?? ''} className={`${size} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span aria-hidden="true"
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-glow to-gold/70 font-bold text-white`}>
      {initials(name)}
    </span>
  )
}
