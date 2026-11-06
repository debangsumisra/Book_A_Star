// Labelled <select>. Option values are enum strings like 'event_agency';
// the label replaces underscores so users see "event agency".
export default function SelectField({ label, id, options, ...selectProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-lg bg-ink border border-line px-3 py-2 text-white capitalize focus:outline-none focus:border-gold"
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
        ))}
      </select>
    </div>
  )
}
