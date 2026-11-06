import Navbar from './Navbar.jsx'

// The frame every page sits in: navbar, a centred content column, footer.
// `title` + `highlight` render the brief's "bold heading, one gold word" style.
export default function PageShell({ title, highlight, subtitle, actions, width = 'max-w-6xl', children }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.22),_transparent_55%)]">
      <Navbar />
      <main className={`mx-auto w-full ${width} flex-1 px-4 py-8 sm:py-10`}>
        {(title || highlight) && (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {title} {highlight && <span className="text-gold">{highlight}</span>}
              </h1>
              {subtitle && <p className="mt-1 text-slate-400">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-slate-500">
        Book A <span className="text-gold">Star</span> · Direct bookings, no middlemen.
      </footer>
    </div>
  )
}
