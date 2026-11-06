// A labelled on/off switch. It is a real checkbox underneath, so keyboard
// and screen readers work without any extra code.
export default function ToggleField({ label, description, id, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input id={id} type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold
        after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && <span className="block text-xs text-slate-400">{description}</span>}
      </span>
    </label>
  )
}
