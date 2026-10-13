import { describe, expect, it } from 'vitest'
import { daysBetween, formatDate, isISODate, toISODate } from './dates'

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('28/02/2026')).toBe(false)
    expect(isISODate(null)).toBe(false)
  })

  it('formats and compares calendar dates without time-zone drift', () => {
    expect(formatDate('2026-03-01')).toBe('1 Mar 2026')
    expect(daysBetween('2026-10-12', '2026-10-15')).toBe(3)
    expect(daysBetween('2026-10-12', '2026-10-12')).toBe(0)
  })

  it('formats a local date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
