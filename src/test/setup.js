import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount whatever the previous test rendered, so tests cannot leak into each other.
afterEach(() => cleanup())

// A stand-in Supabase client. Every test that touches data mocks the specific
// lib/ function it needs, so nothing here ever reaches the network.
vi.mock('../lib/supabase.js', () => {
  const query = () => {
    const builder = {
      select: () => builder, insert: () => builder, update: () => builder, delete: () => builder,
      eq: () => builder, in: () => builder, gte: () => builder, lte: () => builder, ilike: () => builder,
      order: () => builder, limit: () => builder,
      single: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve) => resolve({ data: [], error: null }),
    }
    return builder
  }
  return {
    supabase: {
      from: query,
      rpc: async () => ({ data: [], error: null }),
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
      },
      channel: () => ({ on() { return this }, subscribe() { return this } }),
      removeChannel: () => {},
      storage: { from: () => ({ getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }) },
    },
  }
})
