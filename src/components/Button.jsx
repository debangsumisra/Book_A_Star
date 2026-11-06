import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-gold text-ink font-semibold hover:bg-gold-dark',
  secondary: 'border border-line text-white hover:border-gold',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
  ghost: 'text-gold hover:underline',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
}

// One button style for the whole app. Pass `to` to render a router Link
// that looks like a button; otherwise it is a real <button>.
export default function Button({ variant = 'primary', size = 'md', to, className = '', children, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  if (to) {
    return <Link to={to} className={classes} {...props}>{children}</Link>
  }
  // type="button" by default: a plain <button> inside a <form> would submit it.
  return <button type="button" className={classes} {...props}>{children}</button>
}
