import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MonthCalendar from './MonthCalendar.jsx'

describe('MonthCalendar', () => {
  it('labels booked and blocked days for screen readers', () => {
    render(<MonthCalendar year={2099} monthIndex={0} onMonthChange={() => {}}
      blocked={new Set(['2099-01-10'])} booked={new Set(['2099-01-20'])} />)
    expect(screen.getByRole('button', { name: '2099-01-10, blocked' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2099-01-20, booked' })).toBeInTheDocument()
  })

  it('reports clicks on free future days but not on booked ones', async () => {
    const onDayClick = vi.fn()
    render(<MonthCalendar year={2099} monthIndex={0} onMonthChange={() => {}}
      blocked={new Set()} booked={new Set(['2099-01-20'])} onDayClick={onDayClick} />)
    await userEvent.click(screen.getByRole('button', { name: '2099-01-15' }))
    expect(onDayClick).toHaveBeenCalledWith('2099-01-15')
    expect(screen.getByRole('button', { name: '2099-01-20, booked' })).toBeDisabled()
  })

  it('navigates months', async () => {
    const onMonthChange = vi.fn()
    render(<MonthCalendar year={2099} monthIndex={11} onMonthChange={onMonthChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2100, monthIndex: 0 })
  })
})
