import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup instead of getting confusing "fetch failed" errors later.
if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill it in, then restart `npm run dev`.'
  )
}

export const supabase = createClient(url, anonKey)
