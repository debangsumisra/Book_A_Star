import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split the big libraries into their own files. The browser caches them
    // separately, so a change to our own code does not re-download React.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    // jsdom = a fake browser (document, window) inside Node, so components
    // can render in tests without opening Chrome.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Tests never talk to the real database: lib/supabase.js is mocked in
    // setup.js. These dummy values only satisfy its startup check.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    include: ['src/**/*.test.{js,jsx}'],
  },
})
