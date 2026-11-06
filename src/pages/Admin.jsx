import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import AdminOverview from '../components/AdminOverview.jsx'
import AdminVerificationList from '../components/AdminVerificationList.jsx'
import AdminReportList from '../components/AdminReportList.jsx'

const TABS = [
  ['overview', 'Overview'],
  ['verification', 'Artist verification'],
  ['reports', 'Reports'],
]

// Reachable only through RoleRoute allow={['admin']} — and even if someone
// forced their way onto this page, RLS returns only their own rows.
export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')

  return (
    <PageShell title="Admin" highlight="Panel">
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === key ? 'bg-gold font-semibold text-ink' : 'border border-line text-slate-300 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>
      <Card>
        {tab === 'overview' && <AdminOverview />}
        {tab === 'verification' && <AdminVerificationList />}
        {tab === 'reports' && <AdminReportList adminId={user.id} />}
      </Card>
    </PageShell>
  )
}
