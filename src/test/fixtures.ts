import { readFileSync } from 'node:fs'
import type { Opportunity, StudentProfile } from '../types'

export const TODAY = '2026-10-12'

export function loadDatasetJson(): unknown {
  return JSON.parse(readFileSync(new URL('../../public/data/opportunities.json', import.meta.url), 'utf8'))
}

export function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'test-opp',
    title: 'Test Opportunity',
    organisation: 'Test Org',
    type: 'scholarship',
    summary: 'A test record.',
    fields: { allowed: 'any', basis: 'curated' },
    levels: { allowed: 'any', basis: 'curated' },
    relevantSkills: [],
    unknowns: [],
    deadline: { date: null, status: 'unknown', note: 'Test deadline note.' },
    sourceUrl: 'https://example.org/source',
    applyUrl: 'https://example.org/apply',
    verification: { status: 'primary', checkedOn: '2026-10-12', note: 'Test verification note.' },
    ...overrides,
  }
}

export function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    university: '',
    field: 'cs-it',
    level: '300',
    workExperience: 'none',
    skills: ['programming', 'web'],
    interests: ['scholarship', 'fellowship'],
    ...overrides,
  }
}

export function fakeFetchOk(json: unknown): typeof fetch {
  return (async () => ({ ok: true, status: 200, json: async () => json })) as unknown as typeof fetch
}
