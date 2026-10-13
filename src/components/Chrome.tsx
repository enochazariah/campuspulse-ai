export function SiteHeader({ onHome }: { onHome: () => void }) {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <a
          className="brand"
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            onHome()
          }}
        >
          <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="#F5C518" />
            <path d="M8 34h13l5-14 8 28 6-20 4 6h12" fill="none" stroke="#0F3D2E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>CampusPulse AI</span>
        </a>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>
          CampusPulse AI is an MVP built for WarriorHacks 2.0. Despite the name, matching in this version is rule-based and uses no
          machine learning or AI model.
        </p>
        <p>
          Scores describe how well your profile fits what we know about an opportunity. They do not confirm that you are eligible.
          Always check the organiser&apos;s own page before you apply.
        </p>
      </div>
    </footer>
  )
}
