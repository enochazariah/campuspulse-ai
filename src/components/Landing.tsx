import { ScoreLedger, MethodNote } from './Method'

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1 id="page-title" tabIndex={-1}>
              Find scholarships, internships and hackathons that fit your course, level and skills
            </h1>
            <p className="lead">
              Nigerian students often miss opportunities because the requirements are scattered across many sites. Tell us about yourself and
              CampusPulse Match ranks the opportunities in the CampusPulse opportunity bank, shows you why each one fits, and points out what you still
              need to confirm.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={onStart}>
                Build my profile
              </button>
              <span className="hero-aside">Takes about a minute. No account needed.</span>
            </div>
          </div>
          <div className="hero-ledger" aria-label="The scoring rules">
            <ScoreLedger />
            <MethodNote />
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          <li>
            <h3>Describe yourself</h3>
            <p>Pick your course, level, skills and the kinds of opportunity you want.</p>
          </li>
          <li>
            <h3>Get a ranked list</h3>
            <p>Each record gets a score out of 100 from the rules shown above, with reasons you can read.</p>
          </li>
          <li>
            <h3>Check the source</h3>
            <p>Every real record links to its source, shows its deadline status and says how we verified it.</p>
          </li>
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="android-title">
        <h2 id="android-title">Get the Android app</h2>
        <p>
          CampusPulse Match also runs as an Android app. It uses the same matching rules and the same opportunity bank as this website, and
          your answers stay on your phone.
        </p>
        <p>
          <a
            className="btn btn-primary"
            href={`${import.meta.env.BASE_URL}downloads/campuspulse-ai.apk`}
            download="campuspulse-ai.apk"
          >
            Download for Android (APK, about 5 MB)
          </a>
        </p>
        <ul className="plain-list">
          <li>This is a test build for the hackathon, not a Play Store release.</li>
          <li>
            Android will ask you to allow installs from your browser or file manager, and Play Protect may show a warning because the app is not
            from the Play Store. Install it only if you trust this site.
          </li>
          <li>The website works the same way if you would rather not install anything.</li>
        </ul>
      </section>

      <section className="wrap section" aria-labelledby="bank-title">
        <h2 id="bank-title">About the CampusPulse opportunity bank</h2>
        <ul className="plain-list">
          <li>Results come only from the opportunities currently listed in the CampusPulse opportunity bank.</li>
          <li>We curate the bank by hand from official sources and update it periodically. Come back to see new additions.</li>
          <li>The bank is not a complete list of every opportunity that exists. A missing opportunity does not mean it is unavailable.</li>
          <li>Always confirm eligibility and how to apply on the official provider's website before you rely on anything here.</li>
        </ul>
      </section>

      <section className="wrap section" aria-labelledby="trust-title">
        <h2 id="trust-title">A match is not an eligibility decision</h2>
        <div className="compare">
          <div className="compare-col">
            <h3>Profile match</h3>
            <p>What CampusPulse shows. It compares your answers with tags and published rules and gives a score. It can be wrong or out of date.</p>
          </div>
          <div className="compare-col">
            <h3>Confirmed eligibility</h3>
            <p>Only the organiser can give this. We list requirements we could not check, such as age, nationality or degree class, so you know what to read.</p>
          </div>
        </div>
        <p className="muted">
          The data also holds a few fictional demo records. They are hidden by default, are never mixed into real results, and exist only to show the interface.
        </p>
      </section>
    </>
  )
}