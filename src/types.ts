import type { FieldId, LevelId, SkillId, OpportunityType, WorkExperience } from './data/taxonomy'

export type { FieldId, LevelId, SkillId, OpportunityType, WorkExperience }

/** What the student tells us. Everything is self-reported and never leaves the browser. */
export interface StudentProfile {
  /** Optional, free text. Shown on the results page only; it does not affect matching. */
  university: string
  field: FieldId
  level: LevelId
  workExperience: WorkExperience
  skills: SkillId[]
  interests: OpportunityType[]
}

/** Form state before validation: required selects may still be empty. */
export interface ProfileDraft {
  university: string
  field: FieldId | ''
  level: LevelId | ''
  workExperience: WorkExperience | ''
  skills: SkillId[]
  interests: OpportunityType[]
}

/** 'published' = the source states this rule. 'curated' = our tagging for fit, not a rule. */
export type Basis = 'published' | 'curated'

export interface Audience<T extends string> {
  allowed: T[] | 'any'
  basis: Basis
}

export type VerificationStatus = 'primary' | 'secondary' | 'demo'
export type DeadlineStatus = 'dated' | 'rolling' | 'closed' | 'unknown'

export interface Opportunity {
  id: string
  title: string
  organisation: string
  type: OpportunityType
  summary: string
  fields: Audience<FieldId>
  levels: Audience<LevelId>
  /** Published minimum years of work experience gained after graduating. */
  minWorkYears?: number
  /** Published skill requirements that a self-reported skill can satisfy. */
  requiredSkills?: SkillId[]
  /** Skills that are relevant to the opportunity (curator judgement). */
  relevantSkills: SkillId[]
  /** Requirements we could not confirm or cannot check from the form. */
  unknowns: string[]
  deadline: { date: string | null; status: DeadlineStatus; note: string }
  sourceUrl: string | null
  applyUrl: string | null
  verification: { status: VerificationStatus; checkedOn: string | null; note: string }
}

export interface ScorePart {
  key: 'field' | 'level' | 'skills' | 'interest'
  label: string
  points: number
  max: number
}

export type CycleState = 'open' | 'rolling' | 'closed' | 'unknown' | 'demo'

export interface CycleInfo {
  state: CycleState
  label: string
  daysLeft?: number
}

export interface MatchResult {
  opportunity: Opportunity
  /** 0 to 100, after deductions. */
  score: number
  parts: ScorePart[]
  /** Points removed for unmet published requirements. */
  penalty: number
  unmetPublished: number
  reasons: string[]
  met: string[]
  gaps: string[]
  unknowns: string[]
  cycle: CycleInfo
}
