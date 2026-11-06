// The "loading" of the three states every fetch must handle (rule 7).
export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold" aria-hidden="true" />
      {label}
    </div>
  )
}
