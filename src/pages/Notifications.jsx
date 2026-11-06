import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useNotifications } from '../hooks/useNotifications.js'
import PageShell from '../components/PageShell.jsx'
import Button from '../components/Button.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { markAllNotificationsRead, markNotificationRead } from '../lib/notifications.js'
import { formatDateTime } from '../lib/format.js'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: notifications, setData, isLoading, error, reload, unreadCount } = useNotifications(user.id)

  // Optimistic update: mark read on screen immediately, then tell the server.
  // If the server fails, reload to show the truth again.
  async function open(notification) {
    if (!notification.is_read) {
      setData((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)))
      markNotificationRead(notification.id).catch(() => reload({ silent: true }))
    }
    // Only follow internal links. link_url is written by our own triggers,
    // but checking costs nothing and rules out an external redirect.
    if (notification.link_url?.startsWith('/')) navigate(notification.link_url)
  }

  async function markAll() {
    setData((current) => current.map((item) => ({ ...item, is_read: true })))
    try {
      await markAllNotificationsRead(user.id)
    } catch {
      reload({ silent: true })
    }
  }

  return (
    <PageShell title="Your" highlight="Notifications" width="max-w-3xl"
      actions={unreadCount > 0 && <Button variant="secondary" size="sm" onClick={markAll}>Mark all as read</Button>}>
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : notifications.length === 0 ? (
        <EmptyState title="You're all caught up" message="Booking requests, replies and confirmations will show up here." />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button type="button" onClick={() => open(notification)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-gold/60 ${notification.is_read ? 'border-line bg-panel/50' : 'border-gold/40 bg-panel'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-gold'}`} aria-hidden="true" />
                <span className="flex-1">
                  <span className={`block text-sm ${notification.is_read ? 'text-slate-300' : 'font-semibold text-white'}`}>{notification.title}</span>
                  {notification.body && <span className="block text-sm text-slate-400">{notification.body}</span>}
                  <span className="mt-1 block text-xs text-slate-500">{formatDateTime(notification.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
