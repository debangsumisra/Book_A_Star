import { useEffect } from 'react'
import { useQuery } from './useQuery.js'
import { fetchMessages, markMessagesRead, subscribeToMessages } from '../lib/messages.js'

// Loads the thread, then appends new messages as they arrive over Realtime.
export function useMessages(bookingId) {
  const query = useQuery(() => fetchMessages(bookingId), [bookingId], { enabled: Boolean(bookingId) })
  const { setData } = query

  useEffect(() => {
    if (!bookingId) return undefined
    const unsubscribe = subscribeToMessages(bookingId, (message) => {
      // Our own send may already be in the list after a reload; skip duplicates.
      setData((current) =>
        current && !current.some((existing) => existing.id === message.id) ? [...current, message] : current,
      )
      markMessagesRead(bookingId).catch(() => {}) // a missed read receipt is not worth an error banner
    })
    return unsubscribe
  }, [bookingId, setData])

  // Opening the thread marks what was there as read.
  useEffect(() => {
    if (bookingId && query.data) markMessagesRead(bookingId).catch(() => {})
  }, [bookingId, query.data?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return query
}
