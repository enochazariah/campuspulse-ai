import { OPPORTUNITY_TYPES, labelOf } from '../data/taxonomy'
import type { CycleInfo, Opportunity } from '../types'

const VERIFICATION_LABEL = {
  primary: 'Read on the official source',
  secondary: 'Read on a secondary source',
  demo: 'Demo record (fictional)',
} as const

export function TypeBadge({ type }: { type: Opportunity['type'] }) {
  return <span className="badge badge-type">{labelOf(OPPORTUNITY_TYPES.map((t) => ({ id: t.id, label: t.singular })), type)}</span>
}

export function VerificationBadge({ status }: { status: Opportunity['verification']['status'] }) {
  return <span className={`badge badge-${status}`}>{VERIFICATION_LABEL[status]}</span>
}

export function CycleBadge({ cycle }: { cycle: CycleInfo }) {
  return <span className={`badge badge-cycle-${cycle.state}`}>{cycle.label}</span>
}
