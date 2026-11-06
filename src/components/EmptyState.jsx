// The "empty" state: there is no data, and that is not an error. Tell the
// user what would fill this space and, if possible, how to do it.
export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-medium text-white">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
