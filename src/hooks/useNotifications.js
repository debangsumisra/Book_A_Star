import { useEffect } from 'react'
import { useQuery } from './useQuery.js'
import { fetchNotifications, subscribeToNotifications } from '../lib/notifications.js'

export function useNotifications(userId) {
  const query = useQuery(() => fetchNotifications(userId), [userId], { enabled: Boolean(userId) })
  const { setData } = query

  useEffect(() => {
    if (!userId) return undefined
    return subscribeToNotifications(userId, (notification) => {
      setData((current) => [notification, ...(current ?? [])])
    })
  }, [userId, setData])

  const unreadCount = (query.data ?? []).filter((notification) => !notification.is_read).length
  return { ...query, unreadCount }
}
