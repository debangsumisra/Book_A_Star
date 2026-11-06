// Labelled <textarea>, styled to match FormField. `hint` shows under the box.
export default function TextAreaField({ label, id, hint, ...textareaProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className="w-full rounded-lg bg-ink border border-line px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
        {...textareaProps}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
