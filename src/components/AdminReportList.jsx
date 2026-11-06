import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'
import { useReports } from '../hooks/useAdmin.js'
import { updateReport } from '../lib/admin.js'
import { friendlyError } from '../lib/errors.js'
import { formatDateTime, humanize } from '../lib/format.js'

const STATUS_STYLE = {
  open: 'text-red-300', reviewing: 'text-gold', resolved: 'text-emerald-300', dismissed: 'text-slate-400',
}

function ReportRow({ report, adminId, onChanged }) {
  const [notes, setNotes] = useState(report.admin_notes ?? '')
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function setStatus(status) {
    setErrorMessage('')
    setIsBusy(true)
    try {
      await updateReport(report.id, adminId, { status, adminNotes: notes.trim() })
      onChanged()
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{humanize(report.reason)}</p>
        <span className={`text-xs font-semibold uppercase ${STATUS_STYLE[report.status]}`}>{report.status}</span>
      </div>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{report.details}</p>
      <p className="mt-1 text-xs text-slate-500">
        Filed {formatDateTime(report.created_at)}
        {report.reported_booking_id && <> · <Link to={`/bookings/${report.reported_booking_id}`} className="text-gold hover:underline">booking</Link></>}
        {report.reported_user_id && <> · <Link to={`/artists/${report.reported_user_id}`} className="text-gold hover:underline">reported profile</Link></>}
      </p>
      <label className="mt-3 block text-xs text-slate-400">Admin notes
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:border-gold focus:outline-none" />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {['reviewing', 'resolved', 'dismissed'].map((status) => (
          <Button key={status} size="sm" variant={status === 'resolved' ? 'primary' : 'secondary'}
            disabled={isBusy || report.status === status} onClick={() => setStatus(status)}>
            {humanize(status)}
          </Button>
        ))}
      </div>
      {errorMessage && <p role="alert" className="mt-2 text-sm text-danger">{errorMessage}</p>}
    </li>
  )
}

export default function AdminReportList({ adminId }) {
  const { data: reports, isLoading, error, reload } = useReports()
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (reports.length === 0) return <EmptyState title="No reports" message="When users report a problem it lands here." />
  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <ReportRow key={report.id} report={report} adminId={adminId} onChanged={() => reload({ silent: true })} />
      ))}
    </ul>
  )
}
