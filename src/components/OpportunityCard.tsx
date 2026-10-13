import type { MatchResult } from '../types'
import { formatDate } from '../lib/dates'
import { fitBand } from '../lib/matching'
import { CycleBadge, TypeBadge, VerificationBadge } from './Badges'

function Bullets({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'gap' | 'unknown' }) {
  if (items.length === 0) return null
  return (
    <div className={`bullets bullets-${tone}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function OpportunityCard({ result, headingLevel = 3 }: { result: MatchResult; headingLevel?: 2 | 3 }) {
  const { opportunity: o, score, parts, penalty } = result
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const isDemo = o.verification.status === 'demo'
  const titleId = `title-${o.id}`

  return (
    <article className={`card${isDemo ? ' card-demo' : ''}${result.cycle.state === 'closed' ? ' card-closed' : ''}`} aria-labelledby={titleId}>
      <div className="card-head">
        <div className="card-title">
          <div className="badges">
            <TypeBadge type={o.type} />
            <VerificationBadge status={o.verification.status} />
          </div>
          <Heading id={titleId}>{o.title}</Heading>
          <p className="org">{o.organisation}</p>
        </div>
        <div className="score" role="group" aria-label={`Profile match ${score} out of 100`}>
          <span className="score-num">{score}</span>
          <span className="score-of">/ 100</span>
          <span className="score-band">{fitBand(score)}</span>
        </div>
      </div>

      <p className="summary">{o.summary}</p>
      <p className="notice-inline">Profile match only. This is not confirmed eligibility.</p>

      <Bullets title="Why it matches" items={result.reasons} tone="good" />
      <Bullets title="Requirements you meet" items={result.met} tone="good" />
      <Bullets title="Eligibility gaps" items={result.gaps} tone="gap" />
      <Bullets title="Not confirmed" items={result.unknowns} tone="unknown" />

      <dl className="facts">
        <div>
          <dt>Deadline</dt>
          <dd>
            <CycleBadge cycle={result.cycle} />
            <span className="fact-note">{o.deadline.note}</span>
            {o.deadline.date && <span className="fact-note">Date on record: {formatDate(o.deadline.date)}</span>}
          </dd>
        </div>
        <div>
          <dt>Verification</dt>
          <dd>
            <span className="fact-note">{o.verification.note}</span>
            {o.verification.checkedOn && <span className="fact-note">Checked on {formatDate(o.verification.checkedOn)}</span>}
          </dd>
        </div>
      </dl>

      <details className="breakdown">
        <summary>See how the score was built</summary>
        <table>
          <caption className="sr-only">Score breakdown for {o.title}</caption>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Points</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.label}</th>
                <td>
                  {p.points} of {p.max}
                </td>
              </tr>
            ))}
            {penalty > 0 && (
              <tr>
                <th scope="row">Unmet published rules</th>
                <td>-{penalty}</td>
              </tr>
            )}
            <tr className="total">
              <th scope="row">Total</th>
              <td>{score} of 100</td>
            </tr>
          </tbody>
        </table>
      </details>

      <div className="card-actions">
        {o.sourceUrl ? (
          <a className="btn btn-secondary" href={o.sourceUrl} target="_blank" rel="noopener noreferrer">
            Read the source<span className="sr-only"> for {o.title} (opens in a new tab)</span>
          </a>
        ) : null}
        {o.applyUrl ? (
          <a className="btn btn-primary" href={o.applyUrl} target="_blank" rel="noopener noreferrer">
            Go to application page<span className="sr-only"> for {o.title} (opens in a new tab)</span>
          </a>
        ) : null}
        {isDemo && <span className="no-link">Demo record: no source or application link.</span>}
        {!isDemo && !o.applyUrl && <span className="no-link">No application link recorded. Use the source page to find it.</span>}
      </div>
    </article>
  )
}
