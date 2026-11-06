import { supabase } from './supabase.js'

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_url, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  if (error) throw error
}

// The random suffix gives every subscriber its own channel. Two components
// watching the same feed (navbar bell + notifications page) would otherwise
// share one, and the first to unmount would cut the other off.
export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications:${userId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
