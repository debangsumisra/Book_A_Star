import { test, expect } from '@playwright/test'
import { ARTIST_CITY, ARTIST_NAME, accounts, logIn, randomFutureDate } from './helpers.js'

// The brief's definition of done, in one story:
// an organizer posts an event, finds an available artist, negotiates, and
// confirms — while the artist answers from their own browser, and a third
// user is kept out.

test('organizer and artist negotiate and confirm a booking', async ({ browser }) => {
  const eventDate = randomFutureDate()
  const eventTitle = `E2E Gala ${Date.now()}`

  const organizerContext = await browser.newContext()
  const artistContext = await browser.newContext()
  const strangerContext = await browser.newContext()
  const organizer = await organizerContext.newPage()
  const artist = await artistContext.newPage()
  const stranger = await strangerContext.newPage()
  // window.confirm / window.prompt dialogs: say yes.
  for (const page of [organizer, artist]) page.on('dialog', (dialog) => dialog.accept())

  await test.step('organizer posts an event', async () => {
    await logIn(organizer, accounts.organizer())
    await organizer.goto('/events/new')
    await organizer.getByLabel('Event title').fill(eventTitle)
    await organizer.getByLabel('Date').fill(eventDate)
    await organizer.getByLabel('City').fill(ARTIST_CITY)
    await organizer.getByLabel('Budget from (₹)').fill('15000')
    await organizer.getByLabel('Budget up to (₹)').fill('30000')
    await organizer.getByRole('button', { name: 'Post event' }).click()
    await expect(organizer).toHaveURL(/\/events$/)
    await expect(organizer.getByText(eventTitle)).toBeVisible()
  })

  let bookingUrl
  await test.step('organizer finds the available artist and sends a request', async () => {
    await organizer.goto(`/artists?city=${encodeURIComponent(ARTIST_CITY)}&date=${eventDate}`)
    await organizer.getByRole('link', { name: new RegExp(ARTIST_NAME) }).click()
    const eventOption = organizer.locator('option', { hasText: eventTitle })
    await organizer.getByRole('combobox').selectOption(await eventOption.getAttribute('value'))
    await organizer.getByLabel('Your offer (₹)').fill('22000')
    await organizer.getByRole('button', { name: 'Send booking request' }).click()
    await expect(organizer).toHaveURL(/\/bookings\/[0-9a-f-]{36}$/)
    await expect(organizer.getByText('Requested', { exact: true }).first()).toBeVisible()
    bookingUrl = new URL(organizer.url()).pathname
  })

  await test.step('artist sees the request and counter-offers', async () => {
    await logIn(artist, accounts.artist())
    await artist.goto(bookingUrl)
    await expect(artist.getByRole('heading', { name: eventTitle })).toBeVisible()
    await artist.getByRole('button', { name: 'Counter-offer' }).click()
    await artist.getByLabel(/New price/).fill('24000')
    await artist.getByRole('button', { name: 'Send offer' }).click()
    await expect(artist.getByText('Negotiating', { exact: true }).first()).toBeVisible()
    // Having made the latest offer, the artist can no longer accept it.
    await expect(artist.getByRole('button', { name: 'Accept offer' })).toHaveCount(0)
  })

  await test.step('messages arrive in real time', async () => {
    await organizer.goto(bookingUrl)
    await artist.getByRole('textbox', { name: 'Message' }).fill('Hello from the band!')
    await artist.getByRole('button', { name: 'Send', exact: true }).click()
    // No reload on the organizer page: this is Supabase Realtime at work.
    await expect(organizer.getByText('Hello from the band!')).toBeVisible()
  })

  await test.step('an unrelated user cannot open the booking', async () => {
    await logIn(stranger, accounts.stranger())
    await stranger.goto(bookingUrl)
    await expect(stranger.getByText('Booking not found')).toBeVisible()
  })

  await test.step('organizer accepts the counter-offer and confirms', async () => {
    await organizer.getByRole('button', { name: 'Accept offer' }).click()
    await expect(organizer.getByText('Accepted', { exact: true }).first()).toBeVisible()
    await organizer.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(organizer.getByText('Confirmed', { exact: true }).first()).toBeVisible()
    await expect(organizer.getByText('₹24,000').first()).toBeVisible()
  })

  await test.step('the artist sees the confirmation live and gets a notification', async () => {
    await expect(artist.getByText('Confirmed', { exact: true }).first()).toBeVisible()
    await artist.goto('/notifications')
    await expect(artist.getByText('Booking confirmed').first()).toBeVisible()
  })

  await test.step('the artist is no longer listed as available on that date', async () => {
    await organizer.goto(`/artists?city=${encodeURIComponent(ARTIST_CITY)}&date=${eventDate}`)
    await expect(organizer.getByText('No artists match')).toBeVisible()
  })

  await test.step('the booking shows on the organizer dashboard', async () => {
    await organizer.goto('/dashboard')
    await expect(organizer.getByText(eventTitle).first()).toBeVisible()
  })

  await Promise.all([organizerContext.close(), artistContext.close(), strangerContext.close()])
})

test('artist blocks and unblocks a date on the calendar', async ({ page }) => {
  await logIn(page, accounts.artist())
  await page.goto('/calendar')
  // Next month, the 15th: always in the future, always inside the grid.
  await page.getByRole('button', { name: 'Next month' }).click()
  const next = new Date()
  next.setDate(1)
  next.setMonth(next.getMonth() + 1)
  const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-15`

  await page.getByRole('button', { name: iso, exact: true }).click()
  await expect(page.getByRole('button', { name: `${iso}, blocked` })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByRole('button', { name: `${iso}, blocked` })).toBeVisible()

  await page.getByRole('button', { name: `${iso}, blocked` }).click()
  await expect(page.getByRole('button', { name: iso, exact: true })).toBeVisible()
})
