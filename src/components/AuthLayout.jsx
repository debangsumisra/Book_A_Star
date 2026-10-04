import { Link } from 'react-router-dom'

// Shared frame for Login and Signup, so both pages look identical.
// `highlight` is the gold word in the heading (brief §11).
export default function AuthLayout({ title, highlight, subtitle, children }) {
  return (
    <main className="min-h-screen bg-ink bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.35),_transparent_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-lg font-bold text-white mb-6">
          Book A <span className="text-gold">Star</span>
        </Link>

        <div className="rounded-2xl bg-panel border border-line p-6 sm:p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white">
            {title} <span className="text-gold">{highlight}</span>
          </h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  )
}
