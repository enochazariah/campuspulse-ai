export function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <button type="button" className="brand" onClick={onHome} aria-label="CampusPulse AI, back to start">
          <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="currentColor" />
            <path d="M8 34h13l5-14 8 28 6-20 4 6h12" fill="none" stroke="#F5C518" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>CampusPulse AI</span>
        </button>
        <span className="header-tag">Built for WarriorHacks 2.0 (MVP)</span>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>
          CampusPulse Match compares what you tell us with the CampusPulse opportunity bank, a small list curated by hand from official sources and updated
          periodically. It is not a complete list. It does not confirm that you are eligible and it does not apply for you. Your answers stay in your browser
          and are never sent anywhere.
        </p>
        <p>
          Always confirm deadlines, eligibility and application steps on the official provider's website before you apply.
        </p>
        <p>
          Built by Enoch Azariah ·{' '}
          <a
            href="https://mylandingpage-alpha.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Visit my portfolio
          </a>
        </p>
      </div>
    </footer>
  )
}