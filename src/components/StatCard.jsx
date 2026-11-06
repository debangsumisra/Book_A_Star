export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-gold' : 'text-white'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
