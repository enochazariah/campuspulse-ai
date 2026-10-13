# CampusPulse AI (WarriorHacks 2.0 MVP)

CampusPulse Match helps Nigerian university students find scholarships, internships, hackathons and fellowships that fit their course, level and skills.

It is a static React + Vite + TypeScript app. There is no backend, no login, no paid API and no secret. Student answers stay in the browser and are never sent anywhere.

The form asks for course, level, optional skills, the kinds of opportunity wanted, and an optional free-text university name. The university name is only shown on the results page; it does not change the matching because no verified university-specific rules exist yet. The app does not collect names, student or matriculation numbers, emails or passwords.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and user-journey tests
npm run lint
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

## Deploy

`npm run build`, then upload `dist/` to Netlify, Vercel or any static host (the build uses relative paths, so it also works from a sub-path).

## Android app

CampusPulse AI can also run as an Android app using Capacitor.

Live site: https://campuspulse-ai-smoky.vercel.app/

Test APK download: https://campuspulse-ai-smoky.vercel.app/downloads/campuspulse-ai.apk

### Requirements

- Node.js and npm
- Java and Android SDK configured for Android builds

### Build the Android app

```bash
npm install
npm run build
npx cap sync android
```

On Windows, build the debug APK with:

```powershell
.\android\gradlew.bat -p android assembleDebug
```

The APK is generated at:

`android/app/build/outputs/apk/debug/app-debug.apk`

This debug APK is intended for testing and direct installation. A signed release build is required for production distribution. The web app remains available and can still be deployed independently using the steps above.

## How matching works

Rule-based and deterministic. No machine learning. Rules live in `src/lib/matching.ts` and are shown in the app from the same constants.

| Part | Points |
| --- | --- |
| Course of study | 30 if tagged for it, 20 if open to any course |
| Academic level | 25 if included, 15 if open to any level |
| Skills | up to 25, share of listed skills the student has (10 if none listed) |
| Opportunity type | 20 if the student asked for it |
| Unmet published rule | -15 each |

Only rules the source itself publishes (`basis: "published"`) cost points. Our own tagging (`basis: "curated"`) is shown as a gap but never penalised. Unconfirmed requirements are listed as "Not confirmed" and never change the score.

## What the results show

Real records are grouped by what the evidence supports, best match first inside each group:

1. **Open now**: read on an official source (`verification.status: "primary"`) and the recorded deadline has not passed (or the source says applications are rolling).
2. **Open window not confirmed**: no current open window could be confirmed.
3. **Closed or not currently open**: kept for planning the next cycle.

Fictional demo records are hidden by default. If a student turns them on they appear in a separate "Demo records (fictional)" section and are never mixed into the real groups.

"Open now" is computed from the date in the data and today's date in the browser, so a record moves to "Closed" by itself after its deadline. Re-check `checkedOn` and the source before demo day.

## The opportunity bank

CampusPulse shows only what is in `public/data/opportunities.json`, the CampusPulse opportunity bank. The bank is curated by hand from official sources and updated periodically. It is not a complete list of what exists, and the website says so on the landing page, the results page and the footer. A match score shows relevance to a profile, never confirmed eligibility or funding.

Every record is checked when the page loads (`src/lib/opportunities.ts`). A record that fails the checks is skipped and reported on the results page instead of breaking the app.

### Record types

- `primary`: read on the provider's own official page on `checkedOn`. Needs an https `sourceUrl` and a `checkedOn` date. Only `primary` records can appear under "Open now".
- `secondary`: read on a non-official page. Shown as "Open window not confirmed" at best. Prefer to find the official source instead.
- `demo`: fictional, titled "Demo:", no links, no dates. Hidden by default and shown only in their own section if the student turns them on. Never use demo status for a real opportunity.

### Add an opportunity

1. Open the provider's official page and read the eligibility rules and the application dates there. Do not copy details from news sites or social posts.
2. Copy an existing real record in `opportunities.json` and change every field. The shape is:

```json
{
  "id": "short-unique-slug",
  "title": "Name of the opportunity",
  "organisation": "Who runs it",
  "type": "scholarship",
  "summary": "One or two plain sentences taken from the source.",
  "fields": { "allowed": "any", "basis": "curated" },
  "levels": { "allowed": ["400", "500"], "basis": "curated" },
  "minWorkYears": 2,
  "requiredSkills": ["programming"],
  "relevantSkills": ["research"],
  "unknowns": ["Anything the source states that the form cannot check, or that you could not confirm."],
  "deadline": { "date": "2027-03-31", "status": "dated", "note": "What the source says about dates, in plain words." },
  "sourceUrl": "https://official.example/page-you-read",
  "applyUrl": "https://official.example/apply-page-or-null",
  "verification": { "status": "primary", "checkedOn": "2026-10-12", "note": "What you read, on which page." }
}
```

   `minWorkYears` and `requiredSkills` are optional and only for rules the source itself publishes.

3. Allowed values: `type` is one of `scholarship`, `internship`, `hackathon`, `fellowship`, `grant`. `fields`, `levels` and skills must use the ids in `src/data/taxonomy.ts`. Use `"allowed": "any"` when there is no restriction.
4. `basis` matters. Use `"published"` only when the source itself states the rule (an unmet published rule lowers the score and is shown as a gap). Use `"curated"` for your own judgement of fit (shown as a gap but never penalised).
5. Deadlines: use `"status": "dated"` with a `YYYY-MM-DD` date only when the source gives a date. If the source gives no date, use `"status": "unknown"` and `"date": null`. Use `"rolling"` only when the source itself says applications are rolling and a window is currently open. Only `dated` records may have a date; every other status needs `"date": null` (the tests enforce this). Never guess a date or reuse last year's date for a new cycle.
6. Set `applyUrl` to `null` if you have not seen an official application page. The card then says no application link is recorded.
7. Update `datasetVersion` at the top of the file to today's date, then run `npm test`. The tests fail if a record is malformed, a link is not https, a demo record has a link, or a dated deadline has no date.

### Update an opportunity

Open the official page again, change only what the source now says, set `verification.checkedOn` to today, and update `datasetVersion`. When a new cycle opens, replace the old `deadline` with the new dated one. Do not leave an old date in place and do not move a date forward without a source.

### Close an opportunity

- If the record has a past date and `"status": "dated"`, it moves to "Closed or not currently open" by itself when that date passes. You do not need to edit anything, but you can add the next cycle's details later.
- If the source says applications are closed but gives no date, set `"status": "closed"` and `"date": null` and explain in `deadline.note`.
- To remove a record completely, delete its object from the `opportunities` array and update `datasetVersion`. Keep closed records only while they help students plan for the next cycle.

### How "Open now" is decided

A record is listed under "Open now" only if it is `primary`, and either it is `rolling`, or it is `dated` and today's date (in the visitor's browser) is on or before the date. Everything else that is not closed is listed as "Open window not confirmed". This is computed from the data, so check `checkedOn` and the source again before a demo.

## Structure

```
src/lib/        matching, validation, data loading, dates (pure, tested)
src/components/ landing, form, results, cards
src/hooks/      data loading hook
public/data/    opportunities.json
```
