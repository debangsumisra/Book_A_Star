import { useQuery } from './useQuery.js'
import { fetchEvent, fetchMyEvents, fetchMyOpenEvents, fetchOpenGigs } from '../lib/events.js'

export function useMyEvents(userId) {
  return useQuery(() => fetchMyEvents(userId), [userId], { enabled: Boolean(userId) })
}

export function useMyOpenEvents(userId, { enabled = true } = {}) {
  return useQuery(() => fetchMyOpenEvents(userId), [userId], { enabled: Boolean(userId) && enabled })
}

export function useOpenGigs(filters) {
  const key = JSON.stringify(filters)
  return useQuery(() => fetchOpenGigs(JSON.parse(key)), [key])
}

export function useEvent(eventId) {
  return useQuery(() => fetchEvent(eventId), [eventId], { enabled: Boolean(eventId) })
}
