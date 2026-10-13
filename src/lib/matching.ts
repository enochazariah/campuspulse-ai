import { FIELDS, LEVELS, OPPORTUNITY_TYPES, SKILLS, WORK_EXPERIENCE, labelOf } from '../data/taxonomy'
import type { WorkExperience } from '../data/taxonomy'
import type { CycleInfo, MatchResult, Opportunity, ScorePart, StudentProfile } from '../types'
import { daysBetween, formatDate } from './dates'

/**
 * CampusPulse Match is a rule-based scorer. There is no machine learning here:
 * the same profile and the same data always produce the same ranking.
 */
export const WEIGHTS = { field: 30, level: 25, skills: 25, interest: 20 } as const
/** Points earned when an opportunity is not limited to one course or level. */
export const OPEN_POINTS = { field: 20, level: 15 } as const
/** Points earned for skills when the record lists no relevant skills. */
export const NO_SKILLS_LISTED_POINTS = 10
/** Points removed for each unmet requirement that the source itself publishes. */
export const UNMET_PUBLISHED_PENALTY = 15

const WORK_RANGE: Record<WorkExperience, { min: number; maxExclusive: number }> = {
  none: { min: 0, maxExclusive: 0.0001 },
  under2: { min: 0, maxExclusive: 2 },
  twoplus: { min: 2, maxExclusive: Number.POSITIVE_INFINITY },
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const list = (labels: string[]) => labels.join(', ')

export interface MatchOptions {
  /** Today as YYYY-MM-DD. Injected so results and tests do not depend on the clock. */
  today: string
  includeDemo: boolean
  includeOtherTypes: boolean
}

export function getCycle(opp: Opportunity, today: string): CycleInfo {
  if (opp.verification.status === 'demo') return { state: 'demo', label: 'No real deadline (demo record)' }
  const { date, status } = opp.deadline
  if (date) {
    if (date < today) return { state: 'closed', label: `Closed ${formatDate(date)}` }
    const days = daysBetween(today, date)
    const when = days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`
    return { state: 'open', label: `Closes ${formatDate(date)} (${when})`, daysLeft: days }
  }
  if (status === 'rolling') return { state: 'rolling', label: 'Rolling applications' }
  if (status === 'closed') return { state: 'closed', label: 'Reported closed when last checked' }
  return { state: 'unknown', label: 'Deadline not confirmed' }
}

export function scoreOpportunity(profile: StudentProfile, opp: Opportunity, today: string): MatchResult {
  const fieldLabel = labelOf(FIELDS, profile.field)
  const levelLabel = labelOf(LEVELS, profile.level)
  const reasons: string[] = []
  const met: string[] = []
  const gaps: string[] = []
  const unknowns: string[] = []
  let unmetPublished = 0

  // Course of study
  let fieldPoints: number
  if (opp.fields.allowed === 'any') {
    fieldPoints = OPEN_POINTS.field
    reasons.push('Not limited to a particular course in our records.')
  } else if (opp.fields.allowed.includes(profile.field)) {
    fieldPoints = WEIGHTS.field
    if (opp.fields.basis === 'published') {
      reasons.push(`Its published criteria include your course (${fieldLabel}).`)
      met.push('Course of study is within the published criteria.')
    } else {
      reasons.push(`Your course (${fieldLabel}) is one of the courses it is tagged for.`)
    }
  } else {
    fieldPoints = 0
    const wanted = list(opp.fields.allowed.map((f) => labelOf(FIELDS, f)))
    if (opp.fields.basis === 'published') {
      unmetPublished += 1
      gaps.push(`Published criteria limit this to: ${wanted}. Your course is ${fieldLabel}.`)
    } else {
      gaps.push(`Tagged for: ${wanted}. Your course is ${fieldLabel}. This is our tagging, not a published rule.`)
    }
  }

  // Academic level
  let levelPoints: number
  if (opp.levels.allowed === 'any') {
    levelPoints = OPEN_POINTS.level
    reasons.push('Not limited to a particular level in our records.')
  } else if (opp.levels.allowed.includes(profile.level)) {
    levelPoints = WEIGHTS.level
    if (opp.levels.basis === 'published') {
      reasons.push(`Its published criteria include your level (${levelLabel}).`)
      met.push('Academic level is within the published criteria.')
    } else {
      reasons.push(`Your level (${levelLabel}) is one of the levels it is aimed at.`)
    }
  } else {
    levelPoints = 0
    const wanted = list(opp.levels.allowed.map((l) => labelOf(LEVELS, l)))
    if (opp.levels.basis === 'published') {
      unmetPublished += 1
      gaps.push(`Published criteria are for: ${wanted}. Your level is ${levelLabel}.`)
    } else {
      gaps.push(`Aimed at: ${wanted}. Your level is ${levelLabel}. This is our tagging, not a published rule.`)
    }
  }

  // Published work-experience rule
  if (opp.minWorkYears !== undefined && opp.minWorkYears > 0) {
    const range = WORK_RANGE[profile.workExperience]
    const reported = lower(labelOf(WORK_EXPERIENCE, profile.workExperience))
    const need = `${opp.minWorkYears} ${opp.minWorkYears === 1 ? 'year' : 'years'}`
    if (range.min >= opp.minWorkYears) {
      met.push(`Work experience: at least ${need} required, and you reported ${reported}.`)
    } else if (range.maxExclusive <= opp.minWorkYears) {
      unmetPublished += 1
      gaps.push(`Published rule: at least ${need} of work experience. You reported: ${reported}.`)
    } else {
      unknowns.push(`Published rule: at least ${need} of work experience. Your answer (${reported}) does not settle it.`)
    }
  }

  // Published skill requirements, checked against self-reported skills
  for (const skill of opp.requiredSkills ?? []) {
    const label = lower(labelOf(SKILLS, skill))
    if (profile.skills.includes(skill)) {
      met.push(`Required skill: ${label} (you listed it).`)
    } else {
      unmetPublished += 1
      gaps.push(`Published requirement: ${label}. You did not list it.`)
    }
  }

  // Skills overlap
  const relevant = opp.relevantSkills
  const shared = relevant.filter((s) => profile.skills.includes(s))
  const skillPoints = relevant.length === 0 ? NO_SKILLS_LISTED_POINTS : Math.round((WEIGHTS.skills * shared.length) / relevant.length)
  if (shared.length > 0) {
    reasons.push(`You listed ${list(shared.map((s) => lower(labelOf(SKILLS, s))))}, which ${shared.length === 1 ? 'is' : 'are'} relevant here.`)
  }

  // Interest in the opportunity type
  const wantsType = profile.interests.includes(opp.type)
  const interestPoints = wantsType ? WEIGHTS.interest : 0
  if (wantsType) reasons.push(`You asked for ${lower(labelOf(OPPORTUNITY_TYPES, opp.type))}.`)

  const parts: ScorePart[] = [
    { key: 'field', label: 'Course of study', points: fieldPoints, max: WEIGHTS.field },
    { key: 'level', label: 'Academic level', points: levelPoints, max: WEIGHTS.level },
    { key: 'skills', label: 'Skills', points: skillPoints, max: WEIGHTS.skills },
    { key: 'interest', label: 'Opportunity type', points: interestPoints, max: WEIGHTS.interest },
  ]
  const penalty = unmetPublished * UNMET_PUBLISHED_PENALTY
  const raw = parts.reduce((sum, p) => sum + p.points, 0) - penalty
  const score = Math.max(0, Math.min(100, raw))

  // Unknown requirements are listed for the student but never change the score.
  return {
    opportunity: opp,
    score,
    parts,
    penalty,
    unmetPublished,
    reasons,
    met,
    gaps,
    unknowns: [...unknowns, ...opp.unknowns],
    cycle: getCycle(opp, today),
  }
}

const verificationRank = { primary: 0, secondary: 1, demo: 2 } as const

export function compareResults(a: MatchResult, b: MatchResult): number {
  return (
    b.score - a.score ||
    a.unmetPublished - b.unmetPublished ||
    verificationRank[a.opportunity.verification.status] - verificationRank[b.opportunity.verification.status] ||
    (a.cycle.daysLeft ?? Number.POSITIVE_INFINITY) - (b.cycle.daysLeft ?? Number.POSITIVE_INFINITY) ||
    a.opportunity.title.localeCompare(b.opportunity.title)
  )
}

export interface RankedResults {
  /** Open, rolling, unconfirmed and demo records, best match first. */
  matches: MatchResult[]
  /** Records whose application window has closed, kept for planning the next cycle. */
  closed: MatchResult[]
  hidden: { demo: number; otherTypes: number }
}

export function rankOpportunities(profile: StudentProfile, items: Opportunity[], options: MatchOptions): RankedResults {
  let hiddenDemo = 0
  let hiddenOtherTypes = 0
  const candidates: Opportunity[] = []
  for (const opp of items) {
    if (opp.verification.status === 'demo' && !options.includeDemo) {
      hiddenDemo += 1
      continue
    }
    if (!options.includeOtherTypes && !profile.interests.includes(opp.type)) {
      hiddenOtherTypes += 1
      continue
    }
    candidates.push(opp)
  }
  const results = candidates.map((opp) => scoreOpportunity(profile, opp, options.today)).sort(compareResults)
  return {
    matches: results.filter((r) => r.cycle.state !== 'closed'),
    closed: results.filter((r) => r.cycle.state === 'closed'),
    hidden: { demo: hiddenDemo, otherTypes: hiddenOtherTypes },
  }
}

export interface GroupedResults {
  /** Real records with an official-source window that is open (dated and not past, or rolling) at the date checked. */
  open: MatchResult[]
  /** Real records for which no current open window could be confirmed. */
  unconfirmed: MatchResult[]
  /** Real records whose window has closed. */
  closed: MatchResult[]
  /** Fictional demo records. Always kept apart from real recommendations. */
  demo: MatchResult[]
}

/**
 * Splits ranked results by what we can actually evidence. A record counts as open only if it was
 * read on an official source (verification 'primary') and its recorded window has not passed.
 * Order inside each group is the ranking order.
 */
export function groupResults(ranked: RankedResults): GroupedResults {
  const grouped: GroupedResults = { open: [], unconfirmed: [], closed: [], demo: [] }
  for (const r of ranked.matches) {
    if (r.opportunity.verification.status === 'demo') grouped.demo.push(r)
    else if ((r.cycle.state === 'open' || r.cycle.state === 'rolling') && r.opportunity.verification.status === 'primary') grouped.open.push(r)
    else grouped.unconfirmed.push(r)
  }
  grouped.closed = ranked.closed.filter((r) => r.opportunity.verification.status !== 'demo')
  grouped.demo.push(...ranked.closed.filter((r) => r.opportunity.verification.status === 'demo'))
  return grouped
}

/** Plain-language band for a score. The thresholds are fixed, not learned. */
export function fitBand(score: number): string {
  if (score >= 75) return 'Strong profile fit'
  if (score >= 50) return 'Partial profile fit'
  return 'Weak profile fit'
}
