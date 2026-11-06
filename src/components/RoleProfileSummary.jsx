// Read-only view of an artist or organizer profile row.
// Receives plain data (rule 6) — it never fetches anything itself.

function formatPrice(currency, amount) {
  if (amount === null || amount === undefined) return ''
  return `${currency} ${Number(amount).toLocaleString('en-IN')}`
}

export default function RoleProfileSummary({ role, roleProfile }) {
  const rows =
    role === 'artist'
      ? [
          ['Stage name', roleProfile.stage_name],
          ['Category', roleProfile.category],
          ['City', roleProfile.base_city + (roleProfile.travels_outside_city ? ' (travels)' : '')],
          ['Languages', roleProfile.languages.join(', ')],
          ['Experience', roleProfile.experience_years !== null ? `${roleProfile.experience_years} years` : ''],
          ['Price from', formatPrice(roleProfile.currency, roleProfile.price_min)],
          ['Per event', formatPrice(roleProfile.currency, roleProfile.price_per_event)],
          ['Per hour', formatPrice(roleProfile.currency, roleProfile.price_per_hour)],
        ]
      : [
          ['Organization', roleProfile.organization_name],
          ['Type', roleProfile.organizer_type?.replaceAll('_', ' ')],
          ['City', roleProfile.city],
          ['Website', roleProfile.website],
        ]

  return (
    <div>
      {role === 'artist' && (
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            roleProfile.is_published ? 'bg-gold/15 text-gold' : 'bg-line text-slate-300'}`}>
            {roleProfile.is_published ? '● Listed in directory' : '○ Hidden from directory'}
          </span>
        </div>
      )}
      <dl className="divide-y divide-line rounded-xl border border-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right text-white">{value || '—'}</dd>
          </div>
        ))}
      </dl>
      {role === 'artist' && roleProfile.bio && (
        <p className="mt-4 whitespace-pre-line text-sm text-slate-300">{roleProfile.bio}</p>
      )}
    </div>
  )
}
