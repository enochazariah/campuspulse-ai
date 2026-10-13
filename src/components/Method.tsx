import { NO_SKILLS_LISTED_POINTS, OPEN_POINTS, UNMET_PUBLISHED_PENALTY, WEIGHTS } from '../lib/matching'

const PARTS = [
  { label: 'Course of study', max: WEIGHTS.field, rule: `Full points if your course is tagged for the opportunity; ${OPEN_POINTS.field} if it is open to any course.` },
  { label: 'Academic level', max: WEIGHTS.level, rule: `Full points if your level is included; ${OPEN_POINTS.level} if it is open to any level.` },
  { label: 'Skills', max: WEIGHTS.skills, rule: `Share of the skills listed for the opportunity that you also listed. ${NO_SKILLS_LISTED_POINTS} if no skills are listed.` },
  { label: 'Opportunity type', max: WEIGHTS.interest, rule: 'Full points if you asked for this type.' },
] as const

/** The scoring rules, generated from the same constants the scorer uses. */
export function ScoreLedger() {
  return (
    <table className="ledger">
      <caption>How a score out of 100 is built</caption>
      <thead>
        <tr>
          <th scope="col">Part</th>
          <th scope="col">Up to</th>
          <th scope="col">Rule</th>
        </tr>
      </thead>
      <tbody>
        {PARTS.map((p) => (
          <tr key={p.label}>
            <th scope="row">{p.label}</th>
            <td>{p.max}</td>
            <td>{p.rule}</td>
          </tr>
        ))}
        <tr>
          <th scope="row">Unmet published rule</th>
          <td>-{UNMET_PUBLISHED_PENALTY}</td>
          <td>Removed for each requirement the source itself publishes that your answers do not meet.</td>
        </tr>
      </tbody>
    </table>
  )
}

export function MethodNote() {
  return (
    <p className="method-note">
      Rule-based scoring, not machine learning: the same profile and data always give the same ranking. Requirements we could not confirm are listed
      as unknowns and never change the score.
    </p>
  )
}
