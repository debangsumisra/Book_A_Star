import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageThread from './MessageThread.jsx'

const messages = [
  { id: 1, sender_id: 'me', body: 'Hi there', message_type: 'text', created_at: '2026-10-01T10:00:00Z', read_at: '2026-10-01T10:05:00Z' },
  { id: 2, sender_id: 'them', body: 'New offer', message_type: 'price_offer', offer_amount: 15000, created_at: '2026-10-01T11:00:00Z' },
  { id: 3, sender_id: 'them', body: 'Status changed: negotiating → accepted', message_type: 'system', created_at: '2026-10-01T12:00:00Z' },
  // Message bodies are user input. React escapes text, so this must render as text, not as HTML.
  { id: 4, sender_id: 'them', body: '<img src=x onerror=alert(1)>', message_type: 'text', created_at: '2026-10-01T13:00:00Z' },
]

describe('MessageThread', () => {
  it('renders text, offers and system lines', () => {
    render(<MessageThread messages={messages} currentUserId="me" names={{ them: 'DJ Nova' }} />)
    expect(screen.getByText('Hi there')).toBeInTheDocument()
    expect(screen.getByText(/Offer: ₹15,000/)).toBeInTheDocument()
    expect(screen.getByText(/Status changed: negotiating → accepted/)).toBeInTheDocument()
    expect(screen.getAllByText('DJ Nova').length).toBeGreaterThan(0)
    expect(screen.getByText(/Seen/)).toBeInTheDocument()
  })

  it('never renders message bodies as HTML', () => {
    const { container } = render(<MessageThread messages={messages} currentUserId="me" names={{}} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })

  it('has an empty state', () => {
    render(<MessageThread messages={[]} currentUserId="me" names={{}} />)
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument()
  })
})
