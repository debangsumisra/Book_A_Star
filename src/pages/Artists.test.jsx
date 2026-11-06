import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Artists from './Artists.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'
import { searchArtists } from '../lib/artists.js'

vi.mock('../lib/artists.js', () => ({ searchArtists: vi.fn() }))

const nova = {
  id: 'a1', stage_name: 'DJ Nova', category: 'dj', base_city: 'Pune', price_min: 15000, currency: 'INR',
  rating_avg: 4.5, rating_count: 2, is_verified: true, bio: 'Bollywood and house',
}

// The three states every fetch must handle (rule 7), checked on a real page.
describe('Artists page', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows results', async () => {
    searchArtists.mockResolvedValue([nova])
    renderWithProviders(<Artists />, { path: '/artists' })
    expect(await screen.findByText('DJ Nova')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('1 artist')).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    searchArtists.mockResolvedValue([])
    renderWithProviders(<Artists />, { path: '/artists' })
    expect(await screen.findByText('No artists match')).toBeInTheDocument()
  })

  it('shows the error state with a retry', async () => {
    searchArtists.mockRejectedValue(new TypeError('Failed to fetch'))
    renderWithProviders(<Artists />, { path: '/artists' })
    expect(await screen.findByRole('alert')).toHaveTextContent(/internet/)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('reads filters from the URL', async () => {
    searchArtists.mockResolvedValue([])
    renderWithProviders(<Artists />, { path: '/artists?city=Pune&date=2099-01-01' })
    await screen.findByText('No artists match')
    expect(searchArtists).toHaveBeenCalledWith(expect.objectContaining({ city: 'Pune', date: '2099-01-01' }))
  })
})
