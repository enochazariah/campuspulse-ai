import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT, validateProfile } from './validation'

describe('validateProfile', () => {
  it('rejects an empty form with one message per required field', () => {
    const result = validateProfile(EMPTY_DRAFT)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['field', 'interests', 'level'])
  })

  it('requires work experience only for graduate-stage levels', () => {
    const base = { ...EMPTY_DRAFT, field: 'law' as const, interests: ['scholarship' as const] }
    expect(validateProfile({ ...base, level: '300' }).ok).toBe(true)
    const grad = validateProfile({ ...base, level: 'graduate' })
    expect(grad.ok).toBe(false)
    if (!grad.ok) expect(grad.errors.workExperience).toBeTruthy()
    expect(validateProfile({ ...base, level: 'graduate', workExperience: 'twoplus' }).ok).toBe(true)
  })

  it('trims and tidies the optional university and rejects very long text', () => {
    const base = { ...EMPTY_DRAFT, field: 'law' as const, level: '300' as const, interests: ['scholarship' as const] }
    const ok = validateProfile({ ...base, university: '  Ahmadu   Bello\nUniversity ' })
    expect(ok.ok && ok.profile.university).toBe('Ahmadu Bello University')
    const blank = validateProfile(base)
    expect(blank.ok && blank.profile.university).toBe('')
    const long = validateProfile({ ...base, university: 'x'.repeat(101) })
    expect(long.ok).toBe(false)
    if (!long.ok) expect(long.errors.university).toBeTruthy()
  })

  it('ignores stale work experience for undergraduates and removes duplicates', () => {
    const result = validateProfile({
      university: '',
      field: 'cs-it',
      level: '200',
      workExperience: 'twoplus',
      skills: ['web', 'web'],
      interests: ['hackathon', 'hackathon'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.workExperience).toBe('none')
      expect(result.profile.skills).toEqual(['web'])
      expect(result.profile.interests).toEqual(['hackathon'])
    }
  })
})
