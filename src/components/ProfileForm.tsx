import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { FIELDS, LEVELS, OPPORTUNITY_TYPES, SKILLS, WORK_EXPERIENCE, isGraduateStage } from '../data/taxonomy'
import type { OpportunityType, SkillId } from '../data/taxonomy'
import { EMPTY_DRAFT, MAX_UNIVERSITY_LENGTH, validateProfile } from '../lib/validation'
import type { ProfileErrors } from '../lib/validation'
import type { ProfileDraft, StudentProfile } from '../types'

interface Props {
  initial?: ProfileDraft
  onSubmit: (profile: StudentProfile, draft: ProfileDraft) => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function ProfileForm({ initial = EMPTY_DRAFT, onSubmit }: Props) {
  const [draft, setDraft] = useState<ProfileDraft>(initial)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const summaryRef = useRef<HTMLDivElement>(null)
  const graduate = isGraduateStage(draft.level)
  const errorCount = Object.keys(errors).length

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateProfile(draft)
    if (!result.ok) {
      setErrors(result.errors)
      // Move focus to the summary so screen-reader and keyboard users hear what to fix.
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setErrors({})
    onSubmit(result.profile, draft)
  }

  return (
    <form className="wrap form" onSubmit={handleSubmit} noValidate aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1}>
        Tell us about you
      </h1>
      <p className="lead">Your answers stay in this browser. Nothing is sent or stored.</p>

      <div ref={summaryRef} tabIndex={-1} className="error-summary" role="alert" hidden={errorCount === 0}>
        {errorCount > 0 && (
          <>
            <strong>{errorCount === 1 ? 'One thing needs fixing:' : `${errorCount} things need fixing:`}</strong>
            <ul>
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="field">
        <label htmlFor="university">University (optional)</label>
        <p id="university-hint" className="hint">
          Type the name of your university. It is shown on your results and does not change the matching.
        </p>
        <input
          id="university"
          type="text"
          className="text-input"
          value={draft.university}
          maxLength={MAX_UNIVERSITY_LENGTH + 20}
          autoComplete="off"
          aria-invalid={Boolean(errors.university)}
          aria-describedby={errors.university ? 'university-hint university-error' : 'university-hint'}
          onChange={(e) => setDraft({ ...draft, university: e.target.value })}
        />
        {errors.university && (
          <p id="university-error" className="field-error">
            {errors.university}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="field">Course of study</label>
        <select
          id="field"
          value={draft.field}
          aria-invalid={Boolean(errors.field)}
          aria-describedby={errors.field ? 'field-error' : undefined}
          onChange={(e) => setDraft({ ...draft, field: e.target.value as ProfileDraft['field'] })}
        >
          <option value="">Choose a course</option>
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        {errors.field && (
          <p id="field-error" className="field-error">
            {errors.field}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="level">Current level</label>
        <select
          id="level"
          value={draft.level}
          aria-invalid={Boolean(errors.level)}
          aria-describedby={errors.level ? 'level-error' : undefined}
          onChange={(e) => setDraft({ ...draft, level: e.target.value as ProfileDraft['level'] })}
        >
          <option value="">Choose a level</option>
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        {errors.level && (
          <p id="level-error" className="field-error">
            {errors.level}
          </p>
        )}
      </div>

      {graduate && (
        <fieldset className="field" aria-describedby={errors.workExperience ? 'work-error' : 'work-hint'}>
          <legend>Work experience since graduating</legend>
          <p id="work-hint" className="hint">
            Some scholarships publish a minimum. Experience gained while studying usually does not count.
          </p>
          <div className="choice-row">
            {WORK_EXPERIENCE.map((w) => (
              <label key={w.id} className="choice">
                <input
                  type="radio"
                  name="work"
                  value={w.id}
                  checked={draft.workExperience === w.id}
                  onChange={() => setDraft({ ...draft, workExperience: w.id })}
                />
                <span>{w.label}</span>
              </label>
            ))}
          </div>
          {errors.workExperience && (
            <p id="work-error" className="field-error">
              {errors.workExperience}
            </p>
          )}
        </fieldset>
      )}

      <fieldset className="field">
        <legend>Skills (optional)</legend>
        <p className="hint">Pick the ones you could honestly list on a CV.</p>
        <div className="choice-grid">
          {SKILLS.map((s) => (
            <label key={s.id} className="choice">
              <input
                type="checkbox"
                checked={draft.skills.includes(s.id)}
                onChange={() => setDraft({ ...draft, skills: toggle<SkillId>(draft.skills, s.id) })}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field" aria-describedby={errors.interests ? 'interests-error' : undefined}>
        <legend>What are you looking for?</legend>
        <div className="choice-grid">
          {OPPORTUNITY_TYPES.map((t) => (
            <label key={t.id} className="choice">
              <input
                type="checkbox"
                checked={draft.interests.includes(t.id)}
                onChange={() => setDraft({ ...draft, interests: toggle<OpportunityType>(draft.interests, t.id) })}
              />
              <span>
                {t.label}
                <small>{t.hint}</small>
              </span>
            </label>
          ))}
        </div>
        {errors.interests && (
          <p id="interests-error" className="field-error">
            {errors.interests}
          </p>
        )}
      </fieldset>

      <button type="submit" className="btn btn-primary">
        Find my matches
      </button>
    </form>
  )
}
