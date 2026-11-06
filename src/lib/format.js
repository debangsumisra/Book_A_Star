// Display helpers. Pure functions: same input, same output, no network.

export function formatPrice(amount, currency = 'INR') {
  if (amount === null || amount === undefined || amount === '') return '—'
  const symbol = currency === 'INR' ? '₹' : `${currency} `
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`
}

// Postgres `date` columns arrive as 'YYYY-MM-DD'. `new Date('2026-11-14')`
// would parse that as UTC midnight, which shows as the PREVIOUS day anywhere
// west of UTC. Building the date from its parts keeps it in local time.
export function parseDateOnly(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  return parseDateOnly(isoDate).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// 'college_fest' -> 'College fest'
export function humanize(enumValue) {
  if (!enumValue) return ''
  const text = enumValue.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}
