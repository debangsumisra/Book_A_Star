import { test, expect } from '@playwright/test'
import { ARTIST_CITY, ARTIST_ID, ARTIST_NAME } from './helpers.js'

// Logged-out visitor. Runs on desktop and at 375px (mobile project).

test('landing page loads with the gold-highlight heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Star')
  await expect(page.getByRole('link', { name: /Browse artists/ })).toBeVisible()
})

test('directory filters by city and opens a public profile', async ({ page }) => {
  await page.goto(`/artists?city=${encodeURIComponent(ARTIST_CITY)}`)
  await page.getByRole('link', { name: new RegExp(ARTIST_NAME) }).click()
  await expect(page).toHaveURL(new RegExp(`/artists/${ARTIST_ID}`))
  await expect(page.getByRole('heading', { level: 1, name: ARTIST_NAME })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Log in to book' })).toBeVisible()
})

test('public profile response contains no phone or email', async ({ page }) => {
  const responses = []
  page.on('response', async (response) => {
    if (response.url().includes('/rest/v1/')) responses.push(await response.text().catch(() => ''))
  })
  await page.goto(`/artists/${ARTIST_ID}`)
  await expect(page.getByRole('heading', { level: 1, name: ARTIST_NAME })).toBeVisible()
  const body = responses.join('\n')
  expect(body).not.toMatch(/"phone"/)
  expect(body).not.toMatch(/@bookastar\.test/)
})

test('protected pages redirect to login', async ({ page }) => {
  await page.goto('/bookings')
  await expect(page).toHaveURL(/\/login/)
})

test('no horizontal scrolling on the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflows).toBe(false)
})
