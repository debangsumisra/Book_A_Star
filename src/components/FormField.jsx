// A labelled input. `...inputProps` forwards everything else (type, value,
// onChange, autoComplete...) straight to the <input>, so this stays tiny.
export default function FormField({ label, id, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg bg-ink border border-line px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
        {...inputProps}
      />
    </div>
  )
}
