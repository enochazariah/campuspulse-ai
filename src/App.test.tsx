import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import raw from '../public/data/opportunities.json?raw'
import App from './App'

const realCount = (JSON.parse(raw) as { opportunities: { verification: { status: string } }[] }).opportunities.filter(
  (o) => o.verification.status !== 'demo',
).length

const okFetch = () =>
  vi.fn(async () => ({ ok: true, status: 200, json: async () => JSON.parse(raw) })) as unknown as typeof fetch

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

type User = ReturnType<typeof userEvent.setup>

async function fillProfile(user: User) {
  await user.click(screen.getByRole('button', { name: 'Build my profile' }))
  await user.type(screen.getByLabelText('University (optional)'), 'Ahmadu Bello University')
  await user.selectOptions(screen.getByLabelText('Course of study'), 'cs-it')
  await user.selectOptions(screen.getByLabelText('Current level'), '400')
  await user.click(screen.getByLabelText(/Programming/))
  await user.click(screen.getByLabelText(/Fellowships and programmes/))
  await user.click(screen.getByLabelText(/Hackathons/))
}

function section(name: string | RegExp) {
  return within(screen.getByRole('region', { name }))
}

describe('main user journey', () => {
  it('goes from landing to grouped, labelled results with demo records hidden', async () => {
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/fit your course, level and skills/)
    const bank = screen.getByRole('region', { name: 'About the CampusPulse opportunity bank' })
    expect(bank).toHaveTextContent(/only from the opportunities currently listed/)
    expect(bank).toHaveTextContent(/update it periodically/)
    expect(bank).toHaveTextContent(/not a complete list/)
    expect(bank).toHaveTextContent(/official provider's website/)
    await fillProfile(user)
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))

    expect(await screen.findByRole('heading', { name: 'Your matches' })).toBeInTheDocument()
    // The results page explains where results come from and what a score means.
    const banner = screen.getByLabelText('About these results')
    expect(banner).toHaveTextContent('These results come from the CampusPulse opportunity bank')
    expect(banner).toHaveTextContent(new RegExp(`currently lists ${realCount} real opportunities`))
    expect(banner).toHaveTextContent(/not a complete list/)
    expect(banner).toHaveTextContent(/not confirmed eligibility or a promise of funding/)
    expect(banner).toHaveTextContent(/official website/)
    // The optional university is shown but never changes the ranking.
    expect(within(screen.getByRole('list', { name: 'Your profile' })).getByText('Ahmadu Bello University')).toBeInTheDocument()

    // MLH has no confirmed open window, so it is not listed under "Open now".
    const mlh = await section('Open window not confirmed').findByRole('article', { name: 'MLH Fellowship' })
    expect(within(mlh).getByText(/Profile match only/)).toBeInTheDocument()
    expect(within(mlh).getByRole('link', { name: /Read the source/ })).toHaveAttribute('href', 'https://fellowship.mlh.com/programs/software-engineering')
    expect(within(mlh).getByText('Not confirmed')).toBeInTheDocument()
    expect(section('Open now').queryByRole('article', { name: 'MLH Fellowship' })).toBeNull()

    // Closed records stay visible but are labelled as closed.
    expect(section('Closed or not currently open').getByRole('article', { name: 'Google Summer of Code' })).toBeInTheDocument()

    // Demo records are hidden by default, then appear only in their own labelled section.
    expect(screen.queryByRole('article', { name: /Demo:/ })).toBeNull()
    await user.click(screen.getByLabelText(/Show fictional demo records/))
    const demoSection = section('Demo records (fictional)')
    const demo = demoSection.getByRole('article', { name: /Demo: Campus Health Innovation Hackathon/ })
    expect(within(demo).getByText('Demo record (fictional)')).toBeInTheDocument()
    expect(within(demo).queryByRole('link')).toBeNull()
    expect(section('Open now').queryByRole('article', { name: /Demo:/ })).toBeNull()

    await user.click(screen.getByLabelText(/Show fictional demo records/))
    expect(screen.queryByRole('article', { name: /Demo:/ })).toBeNull()
  })

  it('lists the Commonwealth Master\'s under "Open now" while its official window is open, and Chevening as closed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T10:00:00'))
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    await user.selectOptions(screen.getByLabelText('Course of study'), 'law')
    await user.selectOptions(screen.getByLabelText('Current level'), '500')
    await user.click(screen.getByLabelText(/Scholarships/))
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))
    await screen.findByRole('heading', { name: 'Your matches' })

    const cw = section('Open now').getByRole('article', { name: /Commonwealth Master/ })
    expect(within(cw).getByText(/Closes 20 Oct 2026/)).toBeInTheDocument()
    expect(within(cw).getByText(/Federal Scholarship Board/)).toBeInTheDocument()
    const chevening = section('Closed or not currently open').getByRole('article', { name: /Chevening/ })
    // No verified application page is recorded, so the card says so instead of linking to a homepage.
    expect(within(chevening).getByText(/No application link recorded/)).toBeInTheDocument()
    expect(within(chevening).queryByRole('link', { name: /application page/ })).toBeNull()
    expect(within(chevening).getByRole('link', { name: /Read the source/ })).toHaveAttribute('href', 'https://www.chevening.org/scholarships/eligibility/')
  })

  it('moves the Commonwealth Master\'s to closed once 20 October 2026 has passed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-21T10:00:00'))
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    await user.selectOptions(screen.getByLabelText('Course of study'), 'law')
    await user.selectOptions(screen.getByLabelText('Current level'), '500')
    await user.click(screen.getByLabelText(/Scholarships/))
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))
    await screen.findByRole('heading', { name: 'Your matches' })

    expect(screen.getByText(/None of our verified records is confirmed open/)).toBeInTheDocument()
    expect(section('Closed or not currently open').getByRole('article', { name: /Commonwealth Master/ })).toBeInTheDocument()
  })

  it('shows validation errors and does not advance', async () => {
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))

    expect(screen.getByRole('alert')).toHaveTextContent('3 things need fixing')
    expect(screen.getByLabelText('Course of study')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('heading', { name: 'Your matches' })).toBeNull()
  })

  it('does not ask for a student ID, name or any other personal identifier', async () => {
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByRole('textbox')).toHaveAccessibleName('University (optional)')
    expect(screen.queryByLabelText(/student id|matric|registration|password|email/i)).toBeNull()
  })

  it('asks for work experience only at graduate stage', async () => {
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    expect(screen.queryByText('Work experience since graduating')).toBeNull()
    await user.selectOptions(screen.getByLabelText('Current level'), 'graduate')
    expect(screen.getByText('Work experience since graduating')).toBeInTheDocument()
  })

  it('recovers from a data loading error', async () => {
    const failing = vi.fn(async () => {
      throw new TypeError('network down')
    }) as unknown as typeof fetch
    vi.stubGlobal('fetch', failing)
    const user = userEvent.setup()
    render(<App />)
    await fillProfile(user)
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))

    expect(await screen.findByRole('heading', { name: /could not load/ })).toBeInTheDocument()
    vi.stubGlobal('fetch', okFetch())
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Your matches' })).toBeInTheDocument())
  })

  it('shows an empty state with a way forward when no real record matches', async () => {
    vi.stubGlobal('fetch', okFetch())
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Build my profile' }))
    await user.selectOptions(screen.getByLabelText('Course of study'), 'law')
    await user.selectOptions(screen.getByLabelText('Current level'), '100')
    await user.click(screen.getByLabelText(/Hackathons/))
    await user.click(screen.getByRole('button', { name: 'Find my matches' }))
    await screen.findByRole('heading', { name: 'Your matches' })
    expect(screen.getByRole('heading', { name: 'No real opportunities match these options' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit profile' }).length).toBeGreaterThan(0)
  })
})
