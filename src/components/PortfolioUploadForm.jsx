import { useState } from 'react'
import Button from './Button.jsx'
import { addPortfolioLink, isValidHttpUrl, uploadPortfolioFile, validateUpload } from '../lib/portfolio.js'
import { friendlyError } from '../lib/errors.js'

const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-gold focus:outline-none'

// Two ways to add work: upload a file to Storage, or paste a link (YouTube,
// SoundCloud…). Links cost no storage and play from the source.
export default function PortfolioUploadForm({ userId, onAdded }) {
  const [mode, setMode] = useState('file') // 'file' | 'link'
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [mediaType, setMediaType] = useState('video')
  const [title, setTitle] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    const problem = mode === 'file' ? validateUpload(file) : isValidHttpUrl(url.trim()) ? '' : 'Paste a full link starting with https://'
    if (problem) return setErrorMessage(problem)

    setIsSaving(true)
    try {
      const details = { title: title.trim(), eventName: eventName.trim(), eventDate }
      if (mode === 'file') await uploadPortfolioFile(userId, file, details)
      else await addPortfolioLink(userId, { ...details, url: url.trim(), mediaType })
      setFile(null)
      setUrl('')
      setTitle('')
      setEventName('')
      setEventDate('')
      event.target.reset()
      onAdded()
    } catch (caught) {
      setErrorMessage(friendlyError(caught))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-line p-4" noValidate>
      <div className="flex gap-2" role="tablist">
        {[['file', 'Upload a file'], ['link', 'Add a link']].map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${mode === value ? 'bg-gold text-ink font-semibold' : 'border border-line text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <label className="block text-sm text-slate-300">Image, video or audio (max 10 MB)
          <input type="file" accept="image/*,video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-2 file:text-white" />
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-slate-300 sm:col-span-2">Link
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className={fieldClass} />
          </label>
          <label className="block text-sm text-slate-300">Type
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className={fieldClass}>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
            </select>
          </label>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-slate-300">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm text-slate-300">Past event (optional)
          <input value={eventName} onChange={(e) => setEventName(e.target.value)} maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm text-slate-300">Event date
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={fieldClass} />
        </label>
      </div>

      {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
      <Button type="submit" size="sm" disabled={isSaving}>{isSaving ? 'Saving…' : 'Add to portfolio'}</Button>
    </form>
  )
}
