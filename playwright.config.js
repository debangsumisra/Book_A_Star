import { readFileSync, existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Load .env.e2e (test-account credentials) without adding a dotenv dependency.
if (existsSync('.env.e2e')) {
  for (const line of readFileSync('.env.e2e', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

// End-to-end tests drive a real browser against the real app and the real
// Supabase project. They are slower than unit tests, so they only cover the
// flow the brief calls "the one that must work end to end".
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // The booking flow is one story told in order; parallel runs would race
  // each other for the same test artist.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Brief §11 / Phase E: check 375px. Only the public pages run here.
    { name: 'mobile', use: { ...devices['iPhone SE'], browserName: 'chromium' }, testMatch: /public\.spec\.js/ },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
