import { describe, expect, it } from 'vitest'
import { artistValuesToRow, rowToArtistValues, validateArtistValues } from './artistProfileValues.js'

const valid = () => ({ ...rowToArtistValues(null), stageName: 'DJ Nova', baseCity: 'Pune', priceMin: '15000' })

describe('validateArtistValues', () => {
  it('accepts an unpublished minimal profile', () => {
    expect(validateArtistValues(valid())).toBe('')
  })
  it('requires a bio and a language before publishing', () => {
    expect(validateArtistValues({ ...valid(), isPublished: true })).toMatch(/bio/)
    expect(validateArtistValues({ ...valid(), isPublished: true, bio: 'x'.repeat(40) })).toMatch(/language/)
    expect(validateArtistValues({ ...valid(), isPublished: true, bio: 'x'.repeat(40), languages: 'Hindi' })).toBe('')
  })
  it('rejects negative prices and fractional experience', () => {
    expect(validateArtistValues({ ...valid(), priceMin: '-1' })).toMatch(/starting price/)
    expect(validateArtistValues({ ...valid(), experienceYears: '2.5' })).toMatch(/whole number/)
  })
})

describe('artistValuesToRow', () => {
  it('splits and trims languages, dropping blanks', () => {
    expect(artistValuesToRow({ ...valid(), languages: 'Hindi, English , ,Marathi' }).languages)
      .toEqual(['Hindi', 'English', 'Marathi'])
  })
  it('clears optional prices with null', () => {
    expect(artistValuesToRow(valid()).price_per_hour).toBeNull()
  })
})
