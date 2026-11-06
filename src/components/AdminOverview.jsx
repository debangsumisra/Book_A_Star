import StatCard from './StatCard.jsx'
import StatusBadge from './StatusBadge.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { useAdminStats, useAllBookings, useAllUsers } from '../hooks/useAdmin.js'
import { formatDate, formatDateTime, formatPrice, humanize } from '../lib/format.js'

export default function AdminOverview() {
  const stats = useAdminStats()
  const users = useAllUsers()
  const bookings = useAllBookings()

  return (
    <div className="space-y-8">
      {stats.isLoading ? <LoadingState /> : stats.error ? <ErrorState error={stats.error} onRetry={stats.reload} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users" value={stats.data.users} hint={`${stats.data.artists} artist profiles`} />
          <StatCard label="Events" value={stats.data.events} />
          <StatCard label="Bookings" value={stats.data.bookings} hint={`${stats.data.confirmed} confirmed or completed`} />
          <StatCard label="Needs attention" value={stats.data.openReports + stats.data.pendingVerification} accent
            hint={`${stats.data.openReports} reports · ${stats.data.pendingVerification} to verify`} />
        </div>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Recent bookings</h3>
        {bookings.isLoading ? <LoadingState /> : bookings.error ? <ErrorState error={bookings.error} onRetry={bookings.reload} /> :
          bookings.data.length === 0 ? <EmptyState title="No bookings yet" /> : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink/60 text-xs uppercase text-slate-400">
                  <tr><th className="px-3 py-2">Event</th><th className="px-3 py-2">Artist</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bookings.data.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-3 py-2 text-white">{booking.event?.title}</td>
                      <td className="px-3 py-2 text-slate-300">{booking.artist?.stage_name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">{formatDate(booking.event_date)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatPrice(booking.agreed_price ?? booking.proposed_price, booking.currency)}</td>
                      <td className="px-3 py-2"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Users</h3>
        {users.isLoading ? <LoadingState /> : users.error ? <ErrorState error={users.error} onRetry={users.reload} /> : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {users.data.map((member) => (
              <li key={member.id} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm">
                <span className="text-white">{member.full_name || '(no name)'} <span className="text-slate-500">· {member.city || '—'}</span></span>
                <span className="text-slate-400">{humanize(member.role)} · joined {formatDateTime(member.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
