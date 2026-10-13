import { FIELDS, LEVELS, OPPORTUNITY_TYPES, SKILLS } from '../data/taxonomy'
import type { Audience, DeadlineStatus, Opportunity, VerificationStatus } from '../types'
import { isISODate } from './dates'

export interface RejectedRecord {
  id: string
  reason: string
}

export interface LoadedData {
  items: Opportunity[]
  rejected: RejectedRecord[]
  datasetVersion: string
}

const FIELD_IDS: readonly string[] = FIELDS.map((f) => f.id)
const LEVEL_IDS: readonly string[] = LEVELS.map((l) => l.id)
const SKILL_IDS: readonly string[] = SKILLS.map((s) => s.id)
const TYPE_IDS: readonly string[] = OPPORTUNITY_TYPES.map((t) => t.id)
const DEADLINE_STATUSES: readonly DeadlineStatus[] = ['dated', 'rolling', 'closed', 'unknown']
const VERIFICATION_STATUSES: readonly VerificationStatus[] = ['primary', 'secondary', 'demo']

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

function audienceError(v: unknown, ids: readonly string[], name: string): string | null {
  if (!isObj(v)) return `${name} must be an object`
  if (v.basis !== 'published' && v.basis !== 'curated') return `${name}.basis must be 'published' or 'curated'`
  if (v.allowed === 'any') return null
  if (!isStringArray(v.allowed) || v.allowed.length === 0) return `${name}.allowed must be 'any' or a non-empty list`
  if (!v.allowed.every((x) => ids.includes(x))) return `${name}.allowed contains an unknown value`
  return null
}

/** Returns the first problem found with a raw record, or null when it is safe to use. */
export function recordError(raw: unknown): string | null {
  if (!isObj(raw)) return 'record is not an object'
  for (const key of ['id', 'title', 'organisation', 'summary']) {
    if (!isText(raw[key])) return `${key} is missing`
  }
  if (typeof raw.type !== 'string' || !TYPE_IDS.includes(raw.type)) return 'type is not recognised'

  const fieldErr = audienceError(raw.fields, FIELD_IDS, 'fields')
  if (fieldErr) return fieldErr
  const levelErr = audienceError(raw.levels, LEVEL_IDS, 'levels')
  if (levelErr) return levelErr

  if (raw.minWorkYears !== undefined && (typeof raw.minWorkYears !== 'number' || raw.minWorkYears < 0)) {
    return 'minWorkYears must be a non-negative number'
  }
  for (const key of ['requiredSkills', 'relevantSkills']) {
    const list = raw[key]
    if (list === undefined && key === 'requiredSkills') continue
    if (!isStringArray(list) || !list.every((s) => SKILL_IDS.includes(s))) return `${key} contains an unknown skill`
  }
  if (!isStringArray(raw.unknowns)) return 'unknowns must be a list of text'

  const d = raw.deadline
  if (!isObj(d)) return 'deadline is missing'
  if (!DEADLINE_STATUSES.includes(d.status as DeadlineStatus)) return 'deadline.status is not recognised'
  if (d.date !== null && !isISODate(d.date)) return 'deadline.date must be null or YYYY-MM-DD'
  if (!isText(d.note)) return 'deadline.note is missing'

  const v = raw.verification
  if (!isObj(v)) return 'verification is missing'
  if (!VERIFICATION_STATUSES.includes(v.status as VerificationStatus)) return 'verification.status is not recognised'
  if (!isText(v.note)) return 'verification.note is missing'

  if (v.status === 'demo') {
    // Demo records must never look like real, linkable listings.
    if (raw.sourceUrl !== null || raw.applyUrl !== null) return 'demo records must not have links'
    if (v.checkedOn !== null) return 'demo records must not have a checkedOn date'
    if (d.date !== null) return 'demo records must not have a deadline date'
  } else {
    if (!isHttpsUrl(raw.sourceUrl)) return 'a verified record needs an https sourceUrl'
    if (raw.applyUrl !== null && !isHttpsUrl(raw.applyUrl)) return 'applyUrl must be null or https'
    if (!isISODate(v.checkedOn)) return 'a verified record needs a checkedOn date'
  }
  return null
}

export function parseOpportunities(json: unknown): LoadedData {
  if (!isObj(json) || !Array.isArray(json.opportunities)) throw new Error('The data file has an unexpected shape.')
  const items: Opportunity[] = []
  const rejected: RejectedRecord[] = []
  const seen = new Set<string>()
  for (const raw of json.opportunities as unknown[]) {
    const id = isObj(raw) && typeof raw.id === 'string' ? raw.id : '(no id)'
    const problem = recordError(raw) ?? (seen.has(id) ? 'duplicate id' : null)
    if (problem) {
      rejected.push({ id, reason: problem })
      continue
    }
    seen.add(id)
    items.push(raw as unknown as Opportunity)
  }
  const datasetVersion = typeof json.datasetVersion === 'string' ? json.datasetVersion : 'unknown'
  return { items, rejected, datasetVersion }
}

export async function loadOpportunities(fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<LoadedData> {
  const response = await fetchImpl(`${import.meta.env.BASE_URL}data/opportunities.json`, { signal })
  if (!response.ok) throw new Error(`The opportunity list could not be loaded (HTTP ${response.status}).`)
  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error('The opportunity list is not valid JSON.')
  }
  const data = parseOpportunities(json)
  if (data.items.length === 0) throw new Error('The opportunity list has no valid records.')
  return data
}

export type { Audience }
