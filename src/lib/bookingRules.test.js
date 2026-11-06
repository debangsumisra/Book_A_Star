import { describe, expect, it } from 'vitest'
import { availableActions, needsAttention } from './bookingRules.js'

// These mirror the database trigger in 019_negotiation_rules.sql. The SQL
// test suite proves the database enforces the rules; these prove the UI
// offers exactly the matching buttons.

const ARTIST = 'artist-1'
const ORGANIZER = 'organizer-1'

function booking(overrides) {
  return {
    status: 'requested', initiated_by: 'organizer', last_offer_by: ORGANIZER,
    artist_id: ARTIST, organizer_id: ORGANIZER, event_date: '2099-01-01',
    ...overrides,
  }
}
const labels = (actions) => actions.map((action) => action.label)

describe('availableActions — open negotiation', () => {
  it('artist receiving a request can accept, counter or decline', () => {
    expect(labels(availableActions(booking(), 'artist', ARTIST))).toEqual(['Accept offer', 'Counter-offer', 'Decline'])
  })

  it('organizer who sent the request cannot accept their own offer, only counter or withdraw', () => {
    expect(labels(availableActions(booking(), 'organizer', ORGANIZER))).toEqual(['Counter-offer', 'Withdraw request'])
  })

  it('after the artist counters, the organizer can accept', () => {
    const countered = booking({ status: 'negotiating', last_offer_by: ARTIST })
    expect(labels(availableActions(countered, 'organizer', ORGANIZER))).toContain('Accept offer')
    expect(labels(availableActions(countered, 'artist', ARTIST))).not.toContain('Accept offer')
  })

  it('on an artist application the organizer is the responder', () => {
    const application = booking({ initiated_by: 'artist', last_offer_by: ARTIST })
    expect(labels(availableActions(application, 'organizer', ORGANIZER))).toEqual(['Accept offer', 'Counter-offer', 'Decline'])
    expect(labels(availableActions(application, 'artist', ARTIST))).toEqual(['Counter-offer', 'Withdraw request'])
  })
})

describe('availableActions — after agreement', () => {
  it('only the organizer can confirm an accepted booking', () => {
    const accepted = booking({ status: 'accepted' })
    expect(labels(availableActions(accepted, 'organizer', ORGANIZER))).toEqual(['Confirm booking', 'Cancel booking'])
    expect(labels(availableActions(accepted, 'artist', ARTIST))).toEqual(['Cancel booking'])
  })

  it('completion is offered only on or after the event date', () => {
    const confirmed = booking({ status: 'confirmed', event_date: '2026-06-10' })
    expect(labels(availableActions(confirmed, 'artist', ARTIST, '2026-06-09'))).not.toContain('Mark completed')
    expect(labels(availableActions(confirmed, 'artist', ARTIST, '2026-06-10'))).toContain('Mark completed')
  })

  it.each(['completed', 'rejected', 'cancelled'])('%s is terminal: no actions', (status) => {
    expect(availableActions(booking({ status }), 'artist', ARTIST)).toEqual([])
    expect(availableActions(booking({ status }), 'organizer', ORGANIZER)).toEqual([])
  })
})

describe('needsAttention', () => {
  it('flags an offer waiting for this user', () => {
    expect(needsAttention(booking(), 'artist', ARTIST)).toBe(true)
    expect(needsAttention(booking(), 'organizer', ORGANIZER)).toBe(false)
  })
  it('flags accepted bookings for the organizer to confirm', () => {
    expect(needsAttention(booking({ status: 'accepted' }), 'organizer', ORGANIZER)).toBe(true)
    expect(needsAttention(booking({ status: 'accepted' }), 'artist', ARTIST)).toBe(false)
  })
})
