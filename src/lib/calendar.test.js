import { describe, expect, it } from 'vitest'
import { buildMonthGrid, monthRange, shiftMonth } from './calendar.js'

describe('buildMonthGrid', () => {
  it('always returns 42 cells starting on a Monday', () => {
    const cells = buildMonthGrid(2026, 9) // October 2026 starts on a Thursday
    expect(cells).toHaveLength(42)
    expect(cells[0].iso).toBe('2026-09-28') // the Monday before
    expect(cells[3]).toMatchObject({ iso: '2026-10-01', day: 1, inMonth: true })
  })
  it('marks days outside the month', () => {
    const cells = buildMonthGrid(2026, 9)
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31)
  })
})

describe('monthRange / shiftMonth', () => {
  it('handles February in a leap year', () => {
    expect(monthRange(2028, 1)).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
  it('wraps across years', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 })
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 })
  })
})
