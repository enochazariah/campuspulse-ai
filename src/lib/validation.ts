import { isGraduateStage } from '../data/taxonomy'
import type { ProfileDraft, StudentProfile } from '../types'

export interface ProfileErrors {
  university?: string
  field?: string
  level?: string
  workExperience?: string
  interests?: string
}

export const MAX_UNIVERSITY_LENGTH = 100

export const EMPTY_DRAFT: ProfileDraft = { university: '', field: '', level: '', workExperience: '', skills: [], interests: [] }

export type ValidationResult = { ok: true; profile: StudentProfile } | { ok: false; errors: ProfileErrors }

export function validateProfile(draft: ProfileDraft): ValidationResult {
  const errors: ProfileErrors = {}
  const university = draft.university.replace(/\s+/g, ' ').trim()
  if (university.length > MAX_UNIVERSITY_LENGTH) errors.university = `Use ${MAX_UNIVERSITY_LENGTH} characters or fewer for the university name.`
  if (!draft.field) errors.field = 'Choose your course of study.'
  if (!draft.level) errors.level = 'Choose your current level.'
  const graduateStage = isGraduateStage(draft.level)
  if (graduateStage && !draft.workExperience) errors.workExperience = 'Choose how much work experience you have.'
  if (draft.interests.length === 0) errors.interests = 'Pick at least one type of opportunity.'

  if (Object.keys(errors).length > 0 || !draft.field || !draft.level) return { ok: false, errors }

  return {
    ok: true,
    profile: {
      university,
      field: draft.field,
      level: draft.level,
      // Undergraduates have no post-degree work experience to report.
      workExperience: graduateStage && draft.workExperience ? draft.workExperience : 'none',
      skills: [...new Set(draft.skills)],
      interests: [...new Set(draft.interests)],
    },
  }
}
