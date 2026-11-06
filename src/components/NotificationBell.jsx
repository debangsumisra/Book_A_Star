import { Link } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications.js'

// Bell with a live unread count (Realtime on `notifications`, migration 018).
export default function NotificationBell({ userId }) {
  const { unreadCount } = useNotifications(userId)
  return (
    <Link to="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      className="relative rounded-lg p-2 text-slate-300 hover:text-gold">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
