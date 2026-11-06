// Builds the grid for a month view. Pure, so the calendar component only
// has to draw cells, and the date maths can be tested on its own.

import { toIsoDate } from './format.js'

// Returns 6 weeks x 7 days (always 42 cells, so the grid never jumps in
// height between months). Weeks start on Monday, as is common in India.
export function buildMonthGrid(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1)
  // getDay(): Sunday = 0. Shift so Monday = 0.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, monthIndex, 1 - leadingDays)

  const cells = []
  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + offset)
    cells.push({
      iso: toIsoDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
    })
  }
  return cells
}

export function monthRange(year, monthIndex) {
  return {
    from: toIsoDate(new Date(year, monthIndex, 1)),
    to: toIsoDate(new Date(year, monthIndex + 1, 0)), // day 0 of next month = last day of this one
  }
}

export function shiftMonth(year, monthIndex, delta) {
  const date = new Date(year, monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
