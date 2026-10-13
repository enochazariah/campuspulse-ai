import { describe, expect, it } from 'vitest'
import raw from '../../public/data/opportunities.json?raw'
import { loadOpportunities, parseOpportunities, recordError } from './opportunities'
import { makeOpp } from './testHelpers'

const fakeFetch = (body: unknown, init: { ok?: boolean; status?: number; badJson?: boolean } = {}) =>
  (async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => {
      if (init.badJson) throw new SyntaxError('bad')
      return body
    },
  })) as unknown as typeof fetch

describe('recordError', () => {
  it('accepts a well-formed verified record', () => {
    expect(recordError(makeOpp())).toBeNull()
  })

  it('rejects a verified record without an https source or a check date', () => {
    expect(recordError(makeOpp({ sourceUrl: null }))).toMatch(/sourceUrl/)
    expect(recordError(makeOpp({ sourceUrl: 'http://example.org' }))).toMatch(/sourceUrl/)
    expect(recordError(makeOpp({ verification: { status: 'primary', checkedOn: null, note: 'x' } }))).toMatch(/checkedOn/)
  })

  it('rejects demo records that look real', () => {
    const demo = { sourceUrl: null, applyUrl: null, verification: { status: 'demo' as const, checkedOn: null, note: 'x' } }
    expect(recordError(makeOpp(demo))).toBeNull()
    expect(recordError(makeOpp({ ...demo, sourceUrl: 'https://example.org' }))).toMatch(/demo records must not have links/)
    expect(recordError(makeOpp({ ...demo, deadline: { date: '2027-01-01', status: 'dated', note: 'x' } }))).toMatch(/deadline date/)
  })

  it('rejects unknown tags and invalid dates', () => {
    expect(recordError({ ...makeOpp(), type: 'lottery' })).toMatch(/type/)
    expect(recordError(makeOpp({ fields: { allowed: ['astrology' as never], basis: 'curated' } }))).toMatch(/unknown value/)
    expect(recordError(makeOpp({ deadline: { date: '2026-13-40', status: 'dated', note: 'x' } }))).toMatch(/deadline/)
  })
})

describe('parseOpportunities', () => {
  it('skips bad and duplicate records instead of failing the whole list', () => {
    const good = makeOpp({ id: 'good' })
    const data = parseOpportunities({ datasetVersion: '2026-10-12', opportunities: [good, { ...good }, { id: 'broken' }] })
    expect(data.items).toHaveLength(1)
    expect(data.rejected.map((r) => r.id)).toEqual(['good', 'broken'])
  })

  it('throws when the file has the wrong shape', () => {
    expect(() => parseOpportunities({ nope: true })).toThrow(/unexpected shape/)
  })
})

describe('shipped dataset', () => {
  const data = parseOpportunities(JSON.parse(raw))

  it('has no invalid records', () => {
    expect(data.rejected).toEqual([])
    expect(data.items.length).toBeGreaterThan(0)
  })

  it('links every real record to an https source and keeps demo records link-free', () => {
    for (const o of data.items) {
      if (o.verification.status === 'demo') {
        expect(o.sourceUrl).toBeNull()
        expect(o.applyUrl).toBeNull()
        expect(o.title.startsWith('Demo:')).toBe(true)
      } else {
        expect(o.sourceUrl?.startsWith('https://')).toBe(true)
        expect(o.verification.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })

  it('keeps deadline status consistent with the date', () => {
    for (const o of data.items) {
      if (o.deadline.status === 'dated') expect(o.deadline.date).not.toBeNull()
      else expect(o.deadline.date).toBeNull()
    }
  })

  it('has unique ids', () => {
    expect(new Set(data.items.map((o) => o.id)).size).toBe(data.items.length)
  })
})

describe('loadOpportunities', () => {
  it('loads and validates the list', async () => {
    const data = await loadOpportunities(fakeFetch(JSON.parse(raw)))
    expect(data.items.length).toBeGreaterThan(0)
  })

  it('reports HTTP failures, invalid JSON and empty lists', async () => {
    await expect(loadOpportunities(fakeFetch({}, { ok: false, status: 404 }))).rejects.toThrow(/HTTP 404/)
    await expect(loadOpportunities(fakeFetch({}, { badJson: true }))).rejects.toThrow(/not valid JSON/)
    await expect(loadOpportunities(fakeFetch({ opportunities: [] }))).rejects.toThrow(/no valid records/)
  })
})
