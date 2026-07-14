import { describe, it, expect } from 'vitest'
import { generateTimeOptions, timeToMinutes, rangesOverlap } from './time'

describe('timeToMinutes', () => {
  it('converts HH:MM to minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:45')).toBe(1425)
  })
})

describe('generateTimeOptions', () => {
  it('generates slots at the given step within the hour range', () => {
    const options = generateTimeOptions(9, 10, 30)
    expect(options).toEqual(['09:00', '09:30', '10:00'])
  })

  it('defaults to 08:00-21:00 in 15 minute steps', () => {
    const options = generateTimeOptions()
    expect(options[0]).toBe('08:00')
    expect(options[options.length - 1]).toBe('21:00')
  })
})

describe('rangesOverlap', () => {
  it('detects overlapping ranges', () => {
    expect(rangesOverlap('10:00', '11:00', '10:30', '11:30')).toBe(true)
  })

  it('detects ranges that do not overlap', () => {
    expect(rangesOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false)
    expect(rangesOverlap('10:00', '11:00', '08:00', '09:00')).toBe(false)
  })

  it('treats a range fully contained within another as overlapping', () => {
    expect(rangesOverlap('10:00', '12:00', '10:30', '11:00')).toBe(true)
  })
})
