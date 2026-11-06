import { useEffect, useRef } from 'react'
import { formatDateTime, formatPrice } from '../lib/format.js'

// Renders messages only. Fetching and realtime live in useMessages.
export default function MessageThread({ messages, currentUserId, names }) {
  const bottomRef = useRef(null)

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [messages.length])

  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No messages yet. Say hello and discuss the details.</p>
  }

  return (
    <ol className="max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-label="Messages" aria-live="polite">
      {messages.map((message) => {
        if (message.message_type === 'system') {
          return (
            <li key={message.id} className="text-center text-xs text-slate-500">
              {message.body} · {formatDateTime(message.created_at)}
            </li>
          )
        }
        const isMine = message.sender_id === currentUserId
        return (
          <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-gold/90 text-ink' : 'bg-line text-white'}`}>
              {!isMine && <p className="mb-0.5 text-xs font-semibold opacity-70">{names[message.sender_id] ?? 'Them'}</p>}
              {message.message_type === 'price_offer' ? (
                <p className="font-semibold">💰 Offer: {formatPrice(message.offer_amount)}</p>
              ) : (
                <p className="whitespace-pre-line break-words">{message.body}</p>
              )}
              <p className="mt-1 text-[10px] opacity-60">
                {formatDateTime(message.created_at)}{isMine && message.read_at ? ' · Seen' : ''}
              </p>
            </div>
          </li>
        )
      })}
      <li ref={bottomRef} aria-hidden="true" />
    </ol>
  )
}
