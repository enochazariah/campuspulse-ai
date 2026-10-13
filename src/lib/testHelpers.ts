import type { Opportunity, StudentProfile } from '../types'

export const TODAY = '2026-10-12'

export function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'test-opp',
    title: 'Test opportunity',
    organisation: 'Test org',
    type: 'internship',
    summary: 'A test record.',
    fields: { allowed: 'any', basis: 'curated' },
    levels: { allowed: 'any', basis: 'curated' },
    relevantSkills: [],
    unknowns: [],
    deadline: { date: null, status: 'rolling', note: 'Rolling.' },
    sourceUrl: 'https://example.org/source',
    applyUrl: 'https://example.org/apply',
    verification: { status: 'primary', checkedOn: '2026-10-12', note: 'Test.' },
    ...overrides,
  }
}

export function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    university: '',
    field: 'cs-it',
    level: '300',
    workExperience: 'none',
    skills: ['programming'],
    interests: ['internship'],
    ...overrides,
  }
}
