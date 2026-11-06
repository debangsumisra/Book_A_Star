import { supabase } from './supabase.js'

export async function fetchMessages(bookingId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, booking_id, sender_id, body, message_type, offer_amount, read_at, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage({ bookingId, senderId, body }) {
  const { error } = await supabase
    .from('messages')
    .insert({ booking_id: bookingId, sender_id: senderId, body: body.trim() })
  if (error) throw error
}

// The only way to set read_at (see 009_messages.sql for why).
export async function markMessagesRead(bookingId) {
  const { error } = await supabase.rpc('mark_messages_read', { p_booking_id: bookingId })
  if (error) throw error
}

// Realtime: calls onInsert for each new message in this thread.
// Returns an unsubscribe function for useEffect's cleanup.
// RLS applies to realtime too, so a stranger subscribing gets nothing.
// The random suffix gives every subscriber its own channel, so two
// components watching one thread never cut each other off on unmount.
export function subscribeToMessages(bookingId, onInsert) {
  const channel = supabase
    .channel(`messages:${bookingId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToBooking(bookingId, onChange) {
  const channel = supabase
    .channel(`booking:${bookingId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
      () => onChange(),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
