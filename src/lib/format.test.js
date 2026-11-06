import { describe, expect, it } from 'vitest'
import { formatPrice, humanize, initials, parseDateOnly, toIsoDate } from './format.js'

describe('formatPrice', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(formatPrice(150000)).toBe('₹1,50,000')
  })
  it('uses a dash for missing amounts, but shows zero', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
    expect(formatPrice(0)).toBe('₹0')
  })
  it('prefixes other currencies with their code', () => {
    expect(formatPrice(10, 'USD')).toBe('USD 10')
  })
})

describe('date-only handling', () => {
  // The classic bug: new Date('2026-11-14') is UTC midnight, which is the
  // 13th in any timezone west of UTC. parseDateOnly must keep the 14th.
  it('parses YYYY-MM-DD as a local date', () => {
    const date = parseDateOnly('2026-11-14')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(10)
    expect(date.getDate()).toBe(14)
  })
  it('round-trips through toIsoDate', () => {
    expect(toIsoDate(parseDateOnly('2027-01-05'))).toBe('2027-01-05')
  })
})

describe('humanize / initials', () => {
  it('turns enum values into labels', () => {
    expect(humanize('college_fest')).toBe('College fest')
    expect(humanize('')).toBe('')
  })
  it('takes up to two initials', () => {
    expect(initials('dj nova star')).toBe('DN')
    expect(initials('')).toBe('?') // placeholder avatar, never blank
    expect(initials(null)).toBe('?')
  })
})
