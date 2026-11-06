import { useState } from 'react'
import MonthCalendar from './MonthCalendar.jsx'
import ErrorState from './ErrorState.jsx'
import { useMonthAvailability } from '../hooks/useCalendar.js'

// Read-only calendar for the public artist page. Owns only which month is shown.
export default function AvailabilityCalendar({ artistId }) {
  const now = new Date()
  const [month, setMonth] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() })
  const { data, error, reload } = useMonthAvailability(artistId, month.year, month.monthIndex)

  if (error) return <ErrorState error={error} onRetry={reload} />
  return (
    <MonthCalendar year={month.year} monthIndex={month.monthIndex} onMonthChange={setMonth}
      blocked={data?.blocked} booked={data?.booked} />
  )
}
