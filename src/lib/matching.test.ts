import { describe, expect, it } from 'vitest'
import raw from '../../public/data/opportunities.json?raw'
import { compareResults, getCycle, groupResults, rankOpportunities, scoreOpportunity } from './matching'
import { parseOpportunities } from './opportunities'
import { TODAY, makeOpp, makeProfile } from './testHelpers'

const options = { today: TODAY, includeDemo: true, includeOtherTypes: true }

describe('scoreOpportunity', () => {
  it('gives partial points to records that are open to any course and level', () => {
    // 20 (any course) + 15 (any level) + 10 (no skills listed) + 20 (type wanted)
    expect(scoreOpportunity(makeProfile(), makeOpp(), TODAY).score).toBe(65)
  })

  it('gives full marks for a tagged course and level, all skills and a wanted type', () => {
    const opp = makeOpp({
      fields: { allowed: ['cs-it'], basis: 'curated' },
      levels: { allowed: ['300'], basis: 'curated' },
      relevantSkills: ['programming'],
    })
    const result = scoreOpportunity(makeProfile(), opp, TODAY)
    expect(result.score).toBe(100)
    expect(result.gaps).toEqual([])
  })

  it('scores skills by the share of listed skills the student has', () => {
    const opp = makeOpp({ relevantSkills: ['programming', 'data'] })
    const skills = scoreOpportunity(makeProfile(), opp, TODAY).parts.find((p) => p.key === 'skills')
    expect(skills?.points).toBe(13)
  })

  it('gives no interest points when the type was not requested', () => {
    const result = scoreOpportunity(makeProfile({ interests: ['scholarship'] }), makeOpp(), TODAY)
    expect(result.parts.find((p) => p.key === 'interest')?.points).toBe(0)
  })

  it('deducts points for an unmet published rule and lists a gap', () => {
    const opp = makeOpp({ levels: { allowed: ['100', '200'], basis: 'published' } })
    const result = scoreOpportunity(makeProfile({ skills: [] }), opp, TODAY)
    // 20 + 0 + 10 + 20 - 15
    expect(result.score).toBe(35)
    expect(result.penalty).toBe(15)
    expect(result.unmetPublished).toBe(1)
    expect(result.gaps[0]).toMatch(/Published criteria/)
  })

  it('does not deduct points when a mismatch is only our own tagging, and says so', () => {
    const opp = makeOpp({ levels: { allowed: ['100', '200'], basis: 'curated' } })
    const result = scoreOpportunity(makeProfile({ skills: [] }), opp, TODAY)
    expect(result.score).toBe(50)
    expect(result.penalty).toBe(0)
    expect(result.gaps[0]).toMatch(/our tagging/)
  })

  it('treats a published work-experience minimum as met, unmet or unknown', () => {
    const opp = makeOpp({ minWorkYears: 2 })
    const grad = { level: 'graduate' } as const
    const met = scoreOpportunity(makeProfile({ ...grad, workExperience: 'twoplus' }), opp, TODAY)
    expect(met.met.join(' ')).toMatch(/Work experience/)
    expect(met.unmetPublished).toBe(0)

    const unmet = scoreOpportunity(makeProfile({ ...grad, workExperience: 'under2' }), opp, TODAY)
    expect(unmet.unmetPublished).toBe(1)
    expect(unmet.gaps.join(' ')).toMatch(/at least 2 years/)

    const unknown = scoreOpportunity(makeProfile({ ...grad, workExperience: 'under2' }), makeOpp({ minWorkYears: 1 }), TODAY)
    expect(unknown.unmetPublished).toBe(0)
    expect(unknown.unknowns.join(' ')).toMatch(/does not settle it/)
  })

  it('checks published skill requirements against the student skills', () => {
    const opp = makeOpp({ requiredSkills: ['data'], relevantSkills: ['data'] })
    const without = scoreOpportunity(makeProfile(), opp, TODAY)
    expect(without.unmetPublished).toBe(1)
    const withSkill = scoreOpportunity(makeProfile({ skills: ['data'] }), opp, TODAY)
    expect(withSkill.unmetPublished).toBe(0)
    expect(withSkill.met.join(' ')).toMatch(/Required skill/)
  })

  it('never returns a score below 0 or above 100', () => {
    const opp = makeOpp({
      type: 'grant',
      fields: { allowed: ['law'], basis: 'published' },
      levels: { allowed: ['100'], basis: 'published' },
      requiredSkills: ['design'],
      relevantSkills: ['design'],
    })
    expect(scoreOpportunity(makeProfile(), opp, TODAY).score).toBe(0)
  })

  it('never lets unknown requirements change the score', () => {
    const a = scoreOpportunity(makeProfile(), makeOpp({ unknowns: [] }), TODAY)
    const b = scoreOpportunity(makeProfile(), makeOpp({ unknowns: ['Age limit not confirmed.', 'Country rules not confirmed.'] }), TODAY)
    expect(b.score).toBe(a.score)
    expect(b.unknowns).toHaveLength(2)
  })

  it('is deterministic', () => {
    const opp = makeOpp({ relevantSkills: ['programming', 'web'] })
    expect(scoreOpportunity(makeProfile(), opp, TODAY)).toEqual(scoreOpportunity(makeProfile(), opp, TODAY))
  })
})

describe('getCycle', () => {
  it('reports dated deadlines as open or closed relative to today', () => {
    const open = getCycle(makeOpp({ deadline: { date: '2026-10-15', status: 'dated', note: '' } }), TODAY)
    expect(open).toMatchObject({ state: 'open', daysLeft: 3 })
    const today = getCycle(makeOpp({ deadline: { date: TODAY, status: 'dated', note: '' } }), TODAY)
    expect(today).toMatchObject({ state: 'open', daysLeft: 0 })
    const past = getCycle(makeOpp({ deadline: { date: '2026-03-01', status: 'dated', note: '' } }), TODAY)
    expect(past.state).toBe('closed')
  })

  it('handles rolling, closed, unknown and demo records', () => {
    expect(getCycle(makeOpp(), TODAY).state).toBe('rolling')
    expect(getCycle(makeOpp({ deadline: { date: null, status: 'closed', note: '' } }), TODAY).state).toBe('closed')
    expect(getCycle(makeOpp({ deadline: { date: null, status: 'unknown', note: '' } }), TODAY).state).toBe('unknown')
    const demo = makeOpp({ sourceUrl: null, applyUrl: null, verification: { status: 'demo', checkedOn: null, note: '' } })
    expect(getCycle(demo, TODAY).state).toBe('demo')
  })
})

describe('rankOpportunities', () => {
  const demo = (id: string) =>
    makeOpp({ id, title: id, sourceUrl: null, applyUrl: null, verification: { status: 'demo', checkedOn: null, note: '' } })

  it('sorts best match first', () => {
    const strong = makeOpp({ id: 'strong', title: 'Strong', fields: { allowed: ['cs-it'], basis: 'curated' }, relevantSkills: ['programming'] })
    const weak = makeOpp({ id: 'weak', title: 'Weak' })
    const { matches } = rankOpportunities(makeProfile(), [weak, strong], options)
    expect(matches.map((m) => m.opportunity.id)).toEqual(['strong', 'weak'])
  })

  it('moves closed records to their own list', () => {
    const closed = makeOpp({ id: 'closed', deadline: { date: '2026-01-01', status: 'dated', note: '' } })
    const rolling = makeOpp({ id: 'rolling' })
    const ranked = rankOpportunities(makeProfile(), [closed, rolling], options)
    expect(ranked.matches.map((m) => m.opportunity.id)).toEqual(['rolling'])
    expect(ranked.closed.map((m) => m.opportunity.id)).toEqual(['closed'])
  })

  it('hides demo records and other types on request and counts them', () => {
    const items = [makeOpp({ id: 'real' }), demo('demo-1'), makeOpp({ id: 'other', type: 'scholarship' })]
    const ranked = rankOpportunities(makeProfile(), items, { today: TODAY, includeDemo: false, includeOtherTypes: false })
    expect(ranked.matches.map((m) => m.opportunity.id)).toEqual(['real'])
    expect(ranked.hidden).toEqual({ demo: 1, otherTypes: 1 })
  })

  it('breaks ties by fewer unmet rules, then verification, then title', () => {
    const a = scoreOpportunity(makeProfile(), makeOpp({ id: 'a', title: 'B title' }), TODAY)
    const b = scoreOpportunity(makeProfile(), makeOpp({ id: 'b', title: 'A title' }), TODAY)
    expect(compareResults(a, b)).toBeGreaterThan(0)

    const secondary = scoreOpportunity(
      makeProfile(),
      makeOpp({ id: 's', title: 'A', verification: { status: 'secondary', checkedOn: '2026-10-12', note: '' } }),
      TODAY,
    )
    const primary = scoreOpportunity(makeProfile(), makeOpp({ id: 'p', title: 'Z' }), TODAY)
    expect(compareResults(primary, secondary)).toBeLessThan(0)
  })

  it('ranks the shipped dataset consistently for a computing student', () => {
    const { items } = parseOpportunities(JSON.parse(raw))
    const profile = makeProfile({ level: '400', skills: ['programming', 'open-source'], interests: ['fellowship', 'hackathon'] })
    const first = rankOpportunities(profile, items, options)
    const second = rankOpportunities(profile, items, options)
    expect(first).toEqual(second)
    const scores = first.matches.map((m) => m.score)
    expect(scores).toEqual([...scores].sort((x, y) => y - x))
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true)
    // MLH Fellowship publishes a programming requirement and should surface for this profile.
    expect(first.matches.map((m) => m.opportunity.id)).toContain('mlh-fellowship')
  })
})

describe('groupResults', () => {
  const dated = (id: string, date: string, extra: Partial<Parameters<typeof makeOpp>[0]> = {}) =>
    makeOpp({ id, title: id, deadline: { date, status: 'dated', note: '' }, ...extra })
  const demoOpp = makeOpp({ id: 'demo', title: 'Demo: x', sourceUrl: null, applyUrl: null, verification: { status: 'demo', checkedOn: null, note: '' } })

  it('puts only official-source records with a live window in the open group', () => {
    const items = [
      dated('open-primary', '2026-10-20'),
      dated('open-secondary', '2026-10-20', { verification: { status: 'secondary', checkedOn: '2026-10-12', note: '' } }),
      makeOpp({ id: 'rolling' }),
      makeOpp({ id: 'unknown', deadline: { date: null, status: 'unknown', note: '' } }),
      dated('closed', '2026-03-31'),
      demoOpp,
    ]
    const g = groupResults(rankOpportunities(makeProfile(), items, options))
    expect(g.open.map((r) => r.opportunity.id).sort()).toEqual(['open-primary', 'rolling'])
    expect(g.unconfirmed.map((r) => r.opportunity.id).sort()).toEqual(['open-secondary', 'unknown'])
    expect(g.closed.map((r) => r.opportunity.id)).toEqual(['closed'])
    expect(g.demo.map((r) => r.opportunity.id)).toEqual(['demo'])
  })

  it('never lets a demo record into a real group', () => {
    const g = groupResults(rankOpportunities(makeProfile(), [demoOpp], options))
    expect(g.open.length + g.unconfirmed.length + g.closed.length).toBe(0)
  })

  it('stops calling a record open once its deadline has passed', () => {
    const items = [dated('c', '2026-10-20')]
    const before = groupResults(rankOpportunities(makeProfile(), items, { ...options, today: '2026-10-20' }))
    expect(before.open).toHaveLength(1)
    const after = groupResults(rankOpportunities(makeProfile(), items, { ...options, today: '2026-10-21' }))
    expect(after.open).toHaveLength(0)
    expect(after.closed).toHaveLength(1)
  })
})
