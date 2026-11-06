import { useState } from 'react'
import Button from './Button.jsx'
import { sendMessage } from '../lib/messages.js'
import { friendlyError } from '../lib/errors.js'

export const MAX_MESSAGE_LENGTH = 2000

export default function MessageComposer({ bookingId, senderId, onSent }) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!body.trim()) return
    setErrorMessage('')
    setIsSending(true)
    try {
      await sendMessage({ bookingId, senderId, body })
      setBody('')
      onSent?.()
    } catch (caught) {
      // Keep the text so the user does not lose what they typed.
      setErrorMessage(friendlyError(caught))
    } finally {
      setIsSending(false)
    }
  }

  // Enter sends, Shift+Enter makes a new line — the convention people expect.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-line pt-4">
      <label htmlFor="message" className="sr-only">Message</label>
      <div className="flex gap-2">
        <textarea id="message" rows={2} value={body} maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setBody(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          className="flex-1 resize-none rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none" />
        <Button type="submit" disabled={isSending || !body.trim()} className="self-end">
          {isSending ? '…' : 'Send'}
        </Button>
      </div>
      {errorMessage && <p role="alert" className="mt-2 text-sm text-danger">{errorMessage}</p>}
    </form>
  )
}
