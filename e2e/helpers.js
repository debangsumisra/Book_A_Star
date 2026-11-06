import { expect } from '@playwright/test'

export const ARTIST_ID = 'e2e00000-0000-4000-8000-000000000002'
export const ARTIST_NAME = 'E2E The Band'
export const ARTIST_CITY = 'E2E City'

export const accounts = {
  organizer: () => ({ email: process.env.E2E_ORGANIZER_EMAIL, password: process.env.E2E_PASSWORD }),
  artist: () => ({ email: process.env.E2E_ARTIST_EMAIL, password: process.env.E2E_PASSWORD }),
  stranger: () => ({ email: process.env.E2E_STRANGER_EMAIL, password: process.env.E2E_PASSWORD }),
}

export async function logIn(page, { email, password }) {
  if (!email || !password) throw new Error('Missing E2E credentials. Create .env.e2e — see e2e/README.md.')
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

// A random date 2–8 years out, so repeated runs never collide on the
// double-booking index for the shared test artist.
export function randomFutureDate() {
  const date = new Date()
  date.setDate(date.getDate() + 730 + Math.floor(Math.random() * 2000))
  return date.toISOString().slice(0, 10)
}
