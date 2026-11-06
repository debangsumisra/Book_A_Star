import { STATUS_STYLES } from '../lib/bookingRules.js'
import { humanize } from '../lib/format.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-line text-slate-300'}`}>
      {humanize(status)}
    </span>
  )
}
