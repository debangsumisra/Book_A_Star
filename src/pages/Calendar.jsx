import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useMonthAvailability } from '../hooks/useCalendar.js'
import { useMyProfile } from '../hooks/useMyProfile.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import MonthCalendar from '../components/MonthCalendar.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { blockDate, unblockDate } from '../lib/availability.js'
import { friendlyError } from '../lib/errors.js'
import { formatDate } from '../lib/format.js'

// Step 20: click a free day to block it, click a blocked day to free it.
// Booked days come from bookings and cannot be toggled here.
export default function Calendar() {
  const { user } = useAuth()
  const profileQuery = useMyProfile(user.id)
  const now = new Date()
  const [month, setMonth] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() })
  const availability = useMonthAvailability(user.id, month.year, month.monthIndex, { withNotes: true })
  const [busyDay, setBusyDay] = useState(null)
  const [message, setMessage] = useState({ text: '', isError: false })

  async function handleDayClick(isoDate) {
    const isBlocked = availability.data?.blocked.has(isoDate)
    setBusyDay(isoDate)
    setMessage({ text: '', isError: false })
    try {
      if (isBlocked) await unblockDate(user.id, isoDate)
      else await blockDate(user.id, isoDate)
      await availability.reload({ silent: true })
      setMessage({ text: `${formatDate(isoDate)} is now ${isBlocked ? 'available' : 'blocked'}.`, isError: false })
    } catch (caught) {
      setMessage({ text: friendlyError(caught), isError: true })
    } finally {
      setBusyDay(null)
    }
  }

  if (profileQuery.isLoading) return <PageShell><LoadingState /></PageShell>
  if (profileQuery.error) return <PageShell><ErrorState error={profileQuery.error} onRetry={profileQuery.reload} /></PageShell>
  if (!profileQuery.roleProfile) {
    return (
      <PageShell>
        <EmptyState title="Create your artist profile first" action={<Button to="/profile">Set up profile</Button>} />
      </PageShell>
    )
  }

  return (
    <PageShell title="Availability" highlight="Calendar" width="max-w-3xl"
      subtitle="Tap a date to block it. Tap again to free it. Organizers only see that a date is unavailable — never why.">
      <Card>
        {availability.error ? <ErrorState error={availability.error} onRetry={availability.reload} /> : (
          <MonthCalendar year={month.year} monthIndex={month.monthIndex} onMonthChange={setMonth}
            blocked={availability.data?.blocked} booked={availability.data?.booked}
            onDayClick={availability.data ? handleDayClick : undefined} busyDay={busyDay} />
        )}
        {message.text && (
          <p role={message.isError ? 'alert' : 'status'} className={`mt-4 text-sm ${message.isError ? 'text-danger' : 'text-emerald-300'}`}>
            {message.text}
          </p>
        )}
      </Card>
    </PageShell>
  )
}
