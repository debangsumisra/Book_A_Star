// The rounded panel with a subtle border used across the app (brief §11).
export default function Card({ title, highlight, actions, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-semibold text-white">
              {title} {highlight && <span className="text-gold">{highlight}</span>}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
