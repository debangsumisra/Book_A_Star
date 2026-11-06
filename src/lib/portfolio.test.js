import { describe, expect, it } from 'vitest'
import { isValidHttpUrl, mediaTypeForFile, validateUpload, youtubeEmbedUrl } from './portfolio.js'

const fakeFile = (type, size = 1000) => ({ type, size, name: 'x' })

describe('validateUpload', () => {
  it('accepts images, video and audio under 10 MB', () => {
    expect(validateUpload(fakeFile('image/png'))).toBe('')
    expect(validateUpload(fakeFile('audio/mpeg'))).toBe('')
  })
  it('rejects other types and big files', () => {
    expect(validateUpload(fakeFile('application/pdf'))).toMatch(/Only/)
    expect(validateUpload(fakeFile('video/mp4', 11 * 1024 * 1024))).toMatch(/10 MB/)
    expect(validateUpload(null)).toMatch(/Choose/)
  })
  it('maps MIME type to media_type', () => {
    expect(mediaTypeForFile(fakeFile('video/webm'))).toBe('video')
  })
})

describe('youtubeEmbedUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtube.com/shorts/dQw4w9WgXcQ',
  ])('embeds %s', (url) => {
    expect(youtubeEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
  it('returns null for non-YouTube links', () => {
    expect(youtubeEmbedUrl('https://soundcloud.com/x')).toBeNull()
  })
})

describe('isValidHttpUrl', () => {
  it('only allows http(s) — never javascript: links', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true)
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isValidHttpUrl('not a url')).toBe(false)
  })
})
