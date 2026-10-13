import { useEffect, useRef, useState } from 'react'
import { Footer, Header } from './components/Header'
import { Landing } from './components/Landing'
import { ProfileForm } from './components/ProfileForm'
import { Results } from './components/Results'
import { useOpportunities } from './hooks/useOpportunities'
import { toISODate } from './lib/dates'
import type { ProfileDraft, StudentProfile } from './types'

type View = 'landing' | 'form' | 'results'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [draft, setDraft] = useState<ProfileDraft | undefined>(undefined)
  const { state, retry } = useOpportunities()
  const [today] = useState(() => toISODate(new Date()))
  const mainRef = useRef<HTMLElement>(null)

  // After a view change (not on first load), scroll to the top and move focus to the page heading.
  const shownView = useRef(view)
  useEffect(() => {
    if (shownView.current === view) return
    shownView.current = view
    window.scrollTo(0, 0)
    mainRef.current?.querySelector<HTMLElement>('#page-title')?.focus({ preventScroll: true })
  }, [view])

  let body
  if (view === 'landing') {
    body = <Landing onStart={() => setView('form')} />
  } else if (view === 'form') {
    body = (
      <ProfileForm
        initial={draft}
        onSubmit={(p, d) => {
          setProfile(p)
          setDraft(d)
          setView('results')
        }}
      />
    )
  } else if (!profile) {
    // Results are only reachable through the form, so this is a safety net.
    body = <Landing onStart={() => setView('form')} />
  } else if (state.status === 'loading') {
    body = (
      <div className="wrap status" role="status">
        <h1 id="page-title" tabIndex={-1}>
          Loading opportunities
        </h1>
        <div className="skeleton" aria-hidden="true" />
        <div className="skeleton" aria-hidden="true" />
      </div>
    )
  } else if (state.status === 'error') {
    body = (
      <div className="wrap status" role="alert">
        <h1 id="page-title" tabIndex={-1}>
          We could not load the opportunity list
        </h1>
        <p>{state.message}</p>
        <p className="muted">Check your connection and try again. Your profile is still saved on this page.</p>
        <button type="button" className="btn btn-primary" onClick={retry}>
          Try again
        </button>
      </div>
    )
  } else if (profile) {
    body = <Results profile={profile} data={state.data} today={today} onEdit={() => setView('form')} />
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header onHome={() => setView('landing')} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        {body}
      </main>
      <Footer />
    </>
  )
}
