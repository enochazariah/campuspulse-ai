import { useMemo, useState } from 'react'
import { FIELDS, LEVELS, OPPORTUNITY_TYPES, SKILLS, labelOf } from '../data/taxonomy'
import { groupResults, rankOpportunities } from '../lib/matching'
import type { LoadedData } from '../lib/opportunities'
import type { MatchResult, StudentProfile } from '../types'
import { formatDate } from '../lib/dates'
import { ScoreLedger, MethodNote } from './Method'
import { OpportunityCard } from './OpportunityCard'

interface Props {
  profile: StudentProfile
  data: LoadedData
  today: string
  onEdit: () => void
}

function CardList({ results }: { results: MatchResult[] }) {
  return (
    <ol className="card-list">
      {results.map((m) => (
        <li key={m.opportunity.id}>
          <OpportunityCard result={m} />
        </li>
      ))}
    </ol>
  )
}

export function Results({ profile, data, today, onEdit }: Props) {
  // Demo records are fictional, so they stay hidden unless the student asks to see them.
  const [includeDemo, setIncludeDemo] = useState(false)
  const [includeOtherTypes, setIncludeOtherTypes] = useState(false)

  const ranked = useMemo(
    () => rankOpportunities(profile, data.items, { today, includeDemo, includeOtherTypes }),
    [profile, data.items, today, includeDemo, includeOtherTypes],
  )
  const groups = useMemo(() => groupResults(ranked), [ranked])
  const { open, unconfirmed, closed, demo } = groups
  const { hidden } = ranked
  const realCount = open.length + unconfirmed.length + closed.length
  const realTotal = data.items.filter((o) => o.verification.status !== 'demo').length

  const hiddenParts = [hidden.demo > 0 ? `${hidden.demo} demo` : '', hidden.otherTypes > 0 ? `${hidden.otherTypes} of other types` : ''].filter(Boolean)

  return (
    <div className="wrap results">
      <div className="results-head">
        <div>
          <h1 id="page-title" tabIndex={-1}>
            Your matches
          </h1>
          <ul className="chips" aria-label="Your profile">
            {profile.university && <li>{profile.university}</li>}
            <li>{labelOf(FIELDS, profile.field)}</li>
            <li>{labelOf(LEVELS, profile.level)}</li>
            {profile.skills.map((s) => (
              <li key={s}>{labelOf(SKILLS, s)}</li>
            ))}
            {profile.interests.map((t) => (
              <li key={t}>Wants: {labelOf(OPPORTUNITY_TYPES, t).toLowerCase()}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onEdit}>
          Edit profile
        </button>
      </div>

      <aside className="banner" aria-label="About these results">
        <p>
          <strong>These results come from the CampusPulse opportunity bank.</strong> It currently lists {realTotal} real{' '}
          {realTotal === 1 ? 'opportunity' : 'opportunities'}, curated by hand from official sources and last reviewed on {formatDate(data.datasetVersion)}. It is updated
          periodically and is not a complete list of what exists, so check back for new additions.
        </p>
        <p>
          <strong>A match score shows how relevant a record is to your profile. It is not confirmed eligibility or a promise of funding.</strong> Confirm
          eligibility and how to apply on the provider's official website.
        </p>
      </aside>

      <div className="filters" role="group" aria-label="Result options">
        <label className="switch">
          <input type="checkbox" checked={includeOtherTypes} onChange={(e) => setIncludeOtherTypes(e.target.checked)} />
          <span>Also show types I did not pick</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
          <span>Show fictional demo records (not real opportunities)</span>
        </label>
      </div>

      <p className="count" aria-live="polite">
        {`${open.length} open now, ${unconfirmed.length} not confirmed, ${closed.length} closed.`}
        {hiddenParts.length > 0 && ` Hidden by your options: ${hiddenParts.join(', ')}.`}
      </p>

      {realCount === 0 && (
        <div className="empty">
          <h2>No real opportunities match these options</h2>
          <p>
            Our list is small on purpose, so a narrow profile can return nothing. Try adding another opportunity type
            {hidden.otherTypes > 0 ? ' or turn on "Also show types I did not pick"' : ''}.
          </p>
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Edit profile
          </button>
        </div>
      )}

      {realCount > 0 && (
        <section className="group" aria-labelledby="open-title">
          <h2 id="open-title">Open now</h2>
          <p className="group-note">
            Open according to the official source, based on the dates we recorded on {formatDate(data.datasetVersion)}. Confirm the date on the source before you
            apply.
          </p>
          {open.length > 0 ? (
            <CardList results={open} />
          ) : (
            <p className="group-none">None of our verified records is confirmed open for this profile right now. See the groups below.</p>
          )}
        </section>
      )}

      {unconfirmed.length > 0 && (
        <section className="group" aria-labelledby="unconfirmed-title">
          <h2 id="unconfirmed-title">Open window not confirmed</h2>
          <p className="group-note">
            We could not confirm a current application window for these. They may reopen or may already be closed, so check the source before you plan around
            them.
          </p>
          <CardList results={unconfirmed} />
        </section>
      )}

      {closed.length > 0 && (
        <section className="group closed" aria-labelledby="closed-title">
          <h2 id="closed-title">Closed or not currently open</h2>
          <p className="group-note">Kept so you can plan for the next cycle. These are not available now. Dates and status may have changed, so check the source.</p>
          <CardList results={closed} />
        </section>
      )}

      {includeDemo && (
        <section className="group group-demo" aria-labelledby="demo-title">
          <h2 id="demo-title">Demo records (fictional)</h2>
          <p className="group-note">
            These are made up to show how the interface works. They are not real opportunities and are not part of the recommendations above.
          </p>
          {demo.length > 0 ? <CardList results={demo} /> : <p className="group-none">No demo records match these options.</p>}
        </section>
      )}

      <section className="method" aria-labelledby="method-title">
        <h2 id="method-title">How the ranking works</h2>
        <ScoreLedger />
        <MethodNote />
        <p className="muted">Ties are broken by fewer unmet published rules, then stronger verification, then the nearer deadline, then title.</p>
      </section>

      {data.rejected.length > 0 && (
        <p className="muted" role="status">
          {data.rejected.length} {data.rejected.length === 1 ? 'record was' : 'records were'} skipped because the data failed validation ({data.rejected.map((r) => r.id).join(', ')}).
        </p>
      )}
    </div>
  )
}
