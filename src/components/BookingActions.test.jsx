import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingActions from './BookingActions.jsx'
import { counterOffer, setBookingStatus } from '../lib/bookings.js'

vi.mock('../lib/bookings.js', () => ({
  setBookingStatus: vi.fn(async () => {}),
  counterOffer: vi.fn(async () => {}),
}))

const ARTIST = 'artist-1'
const ORGANIZER = 'org-1'
const request = {
  id: 'b1', status: 'requested', initiated_by: 'organizer', last_offer_by: ORGANIZER,
  artist_id: ARTIST, organizer_id: ORGANIZER, event_date: '2099-01-01', proposed_price: 12000, currency: 'INR',
}

describe('BookingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('lets the artist accept the organizer’s offer', async () => {
    const onChanged = vi.fn()
    render(<BookingActions booking={request} role="artist" userId={ARTIST} onChanged={onChanged} />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept offer' }))
    expect(setBookingStatus).toHaveBeenCalledWith('b1', 'accepted', {})
    expect(onChanged).toHaveBeenCalled()
  })

  it('sends a counter-offer with the typed amount', async () => {
    render(<BookingActions booking={request} role="artist" userId={ARTIST} onChanged={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Counter-offer' }))
    const input = screen.getByLabelText(/New price/)
    await userEvent.clear(input)
    await userEvent.type(input, '15000')
    await userEvent.click(screen.getByRole('button', { name: 'Send offer' }))
    expect(counterOffer).toHaveBeenCalledWith('b1', 15000)
  })

  it('does not offer "Accept" to whoever made the current offer', () => {
    render(<BookingActions booking={request} role="organizer" userId={ORGANIZER} onChanged={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Accept offer' })).not.toBeInTheDocument()
    expect(screen.getByText(/waiting for the other side/)).toBeInTheDocument()
  })

  it('shows the database’s refusal instead of failing silently', async () => {
    setBookingStatus.mockRejectedValueOnce({ message: 'duplicate key value violates unique constraint "bookings_no_double_booking"' })
    render(<BookingActions booking={request} role="artist" userId={ARTIST} onChanged={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept offer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already booked/)
  })

  it('renders nothing for a terminal booking', () => {
    const { container } = render(
      <BookingActions booking={{ ...request, status: 'cancelled' }} role="artist" userId={ARTIST} onChanged={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
