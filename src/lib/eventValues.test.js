import { describe, expect, it } from 'vitest'
import { eventValuesToRow, rowToEventValues, validateEventValues } from './eventValues.js'

const TODAY = '2026-10-05'
const valid = () => ({ ...rowToEventValues(null), title: 'Spring Fest', eventDate: '2026-12-01', city: 'Pune' })

describe('validateEventValues', () => {
  it('accepts a minimal valid event', () => {
    expect(validateEventValues(valid(), { today: TODAY })).toBe('')
  })
  it('rejects a short title, missing date or city', () => {
    expect(validateEventValues({ ...valid(), title: 'ab' }, { today: TODAY })).toMatch(/title/)
    expect(validateEventValues({ ...valid(), eventDate: '' }, { today: TODAY })).toMatch(/date/)
    expect(validateEventValues({ ...valid(), city: '  ' }, { today: TODAY })).toMatch(/city/)
  })
  it('rejects a past date for new events but allows it when editing', () => {
    const past = { ...valid(), eventDate: '2026-01-01' }
    expect(validateEventValues(past, { today: TODAY })).toMatch(/past/)
    expect(validateEventValues(past, { today: TODAY, isNew: false })).toBe('')
  })
  it('rejects an inverted budget range', () => {
    expect(validateEventValues({ ...valid(), budgetMin: '50000', budgetMax: '10000' }, { today: TODAY })).toMatch(/Maximum budget/)
  })
  it('rejects a fractional audience size', () => {
    expect(validateEventValues({ ...valid(), audienceSize: '10.5' }, { today: TODAY })).toMatch(/Audience/)
  })
})

describe('row conversion', () => {
  it('turns blank optional fields into null, not 0', () => {
    const row = eventValuesToRow(valid())
    expect(row.budget_min).toBeNull()
    expect(row.venue).toBeNull()
    expect(row.start_time).toBeNull()
  })
  it('round-trips a database row', () => {
    const row = { title: 'X fest', event_type: 'concert', event_date: '2026-12-01', start_time: '19:30:00',
      duration_hours: 2.5, city: 'Goa', venue: 'Beach', budget_min: 1000, budget_max: 2000,
      audience_size: 300, requirements: 'Loud', status: 'open' }
    expect(eventValuesToRow(rowToEventValues(row))).toEqual({ ...row, start_time: '19:30' })
  })
})
