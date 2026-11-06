import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventForm from './EventForm.jsx'

describe('EventForm', () => {
  it('shows a validation message and does not submit an incomplete form', async () => {
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Post event' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/title/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the typed values', async () => {
    const onSubmit = vi.fn(async () => {})
    render(<EventForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Event title'), 'Diwali Night')
    await userEvent.type(screen.getByLabelText('Date'), '2099-11-01')
    await userEvent.type(screen.getByLabelText('City'), 'Pune')
    await userEvent.click(screen.getByRole('button', { name: 'Post event' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Diwali Night', eventDate: '2099-11-01', city: 'Pune' }))
  })

  it('displays a save error from the page', async () => {
    render(<EventForm onSubmit={async () => { throw new Error('This event is not open for bookings') }} />)
    await userEvent.type(screen.getByLabelText('Event title'), 'Diwali Night')
    await userEvent.type(screen.getByLabelText('Date'), '2099-11-01')
    await userEvent.type(screen.getByLabelText('City'), 'Pune')
    await userEvent.click(screen.getByRole('button', { name: 'Post event' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This event is not open for bookings')
  })
})
