import { useState } from 'react'
import Button from './Button.jsx'
import { REPORT_REASONS, fileReport } from '../lib/reports.js'
import { friendlyError } from '../lib/errors.js'
import { humanize } from '../lib/format.js'

// Collapsed by default: reporting should be available, not prominent.
export default function ReportForm({ reporterId, reportedUserId, reportedBookingId, label = 'Report a problem' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('other')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [errorMessage, setErrorMessage] = useState('')

  if (status === 'sent') return <p className="text-sm text-emerald-300">Thanks — an admin will review your report.</p>
  if (!isOpen) {
    return <button type="button" onClick={() => setIsOpen(true)} className="text-xs text-slate-400 hover:text-danger">{label}</button>
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (details.trim().length < 10) return setErrorMessage('Describe what happened (at least 10 characters).')
    setErrorMessage('')
    setStatus('sending')
    try {
      await fileReport({ reporterId, reportedUserId, reportedBookingId, reason, details })
      setStatus('sent')
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
      setStatus('idle')
    }
  }

  const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white focus:border-gold focus:outline-none'
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-danger/30 p-4" noValidate>
      <label className="block text-sm text-slate-300">Reason
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass}>
          {REPORT_REASONS.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
        </select>
      </label>
      <label className="block text-sm text-slate-300">What happened?
        <textarea rows={3} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} className={fieldClass} />
      </label>
      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send report'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}
