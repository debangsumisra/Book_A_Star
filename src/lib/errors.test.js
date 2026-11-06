import { describe, expect, it } from 'vitest'
import { assertChanged, friendlyError } from './errors.js'

describe('friendlyError', () => {
  it('explains the double-booking index in plain words', () => {
    expect(friendlyError({ message: 'duplicate key value violates unique constraint "bookings_no_double_booking"' }))
      .toMatch(/already booked/)
  })
  it('passes trigger messages through untouched', () => {
    expect(friendlyError({ message: 'This event date has already passed' })).toBe('This event date has already passed')
  })
  it('handles network failure and RLS denial', () => {
    expect(friendlyError(new TypeError('Failed to fetch'))).toMatch(/internet/)
    expect(friendlyError({ code: '42501', message: 'permission denied' })).toMatch(/not allowed/)
  })
})

describe('assertChanged', () => {
  it('throws on an empty result (RLS silently filtered the row)', () => {
    expect(() => assertChanged([])).toThrow(/permission/)
    expect(() => assertChanged([{ id: 1 }])).not.toThrow()
  })
})
