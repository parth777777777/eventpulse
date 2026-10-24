/*
### Mandatory architecture and scope decisions

The following decisions are authoritative and must be reflected consistently in both
`docs/implementation/AUTH_IMPLEMENTATION_PLAN.md` and
`docs/implementation/AUTH_IMPLEMENTATION_STATUS.md`.

1. **Core authentication first:** Prioritize Supabase configuration, SSR browser/server
   clients, Next.js 16 `proxy.ts` session refresh, signup, login, email-confirmation
   callback, logout, safe redirects, and protected-route behavior.

2. **Public discovery:** Keep `/`, `/discover`, `/radar`, and `/events/[id]`
   accessible without authentication.

3. **Protected routes:** Protect `/saved` and organizer routes. Authentication alone
   must not grant organizer privileges or imply event ownership.

4. **Minimal architecture:** Do not implement custom JWT issuance or create a profiles
   table or application database migrations unless a demonstrated requirement
   justifies them. Supabase manages authentication tokens and sessions.

5. **Password recovery sequencing:** Explicitly defer password recovery until the core
   signup, login, session persistence, callback, logout, and route-protection flow
   passes verification. Record password recovery as the next authentication milestone.

6. **Demo-only functionality:** Clearly document that bookmarks are currently
   local/demo state and organizer forms do not persist data. Do not imply these
   features become persistent or fully authorized merely because authentication is added.

7. **UI preservation:** Reuse EventPulse's existing dark theme, styling conventions,
   and shared navigation where practical. Avoid a broad UI redesign or unrelated refactoring.

8. **Automated verification:** Include a minimal automated test setup and tests for
   safe redirects, session persistence, logout, protected routes, and public-route
   accessibility. Record which tests were actually executed and their results.

9. **TypeScript build safety:** Investigate `typescript.ignoreBuildErrors: true` in
   `next.config.mjs`. Identify pre-existing TypeScript errors separately, fix
   authentication-related errors, and remove the ignored-build-errors setting when
   feasible without silently expanding scope. Never treat a successful build with
   ignored TypeScript errors as sufficient verification.

### Planning constraints

Revise the file-by-file plan and ordered implementation steps to enforce these decisions.
Keep the tracker synchronized with the canonical plan. Planning and documentation only:
do not edit application code, install packages, or configure Supabase resources during
this planning phase.
*/

'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, Bookmark, CalendarDays, ChevronRight, CircleCheck, ExternalLink, MapPin, Plus, Radar, Search, Share2, Sparkles, Target } from 'lucide-react'
import { events, type EventItem } from './eventpulse-app'
import { AccountMenu } from './auth/account-menu'
import FullDiscoverPage from './discovery/FullDiscoverPage'

export function PageShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return <div className="app-shell"><header className="topbar"><Link href="/" className="logo"><span className="logo-mark"><span /></span><span>event<span className="logo-accent">pulse</span></span></Link><nav className="nav-links"><Link href="/">Discover</Link><Link className={title.includes('Radar') ? 'active' : ''} href="/radar"><Target size={15} /> Event Radar</Link><Link className={title.includes('Saved') ? 'active' : ''} href="/saved"><Bookmark size={15} /> Saved</Link><Link href="/organizer"><BarChart3 size={15} /> Organizer</Link></nav><div className="top-actions"><AccountMenu /></div></header><main className="main-content"><div className="breadcrumb"><Link href="/">Discover</Link> <span>/</span> {eyebrow}</div><h1>{title}</h1>{children}</main></div>
}

function Card({ event }: { event: EventItem }) { return <article className="event-card"><div className="event-image-wrap"><img src={event.image} alt="" className="event-image" /><span className={`source-badge ${event.source}`}>{event.source === 'verified' ? <><CircleCheck size={12} /> Verified organizer</> : <><Sparkles size={12} /> Found on the web</>}</span></div><div className="event-body"><div className="event-meta"><span style={{ color: event.accent }}>{event.category}</span><span>{event.distance} km away</span></div><Link href={`/events/${event.id}`} className="event-title">{event.title}</Link><div className="event-detail"><CalendarDays size={14} />{event.date} · {event.time}</div><div className="event-detail"><MapPin size={14} />{event.venue}</div><div className="event-footer"><span className={event.fee === 'Free' ? 'free' : ''}>{event.fee}</span><Link href={`/events/${event.id}`} className="arrow-button" aria-label="Open event"><ChevronRight size={17} /></Link></div></div></article> }

export function DiscoverPage() { return <PageShell title="All events" eyebrow="Browse"><div className="page-toolbar"><div className="search-bar"><Search size={18} /><input placeholder="Search events, skills, or interests" /></div><button className="button primary"><Plus size={16} /> Set preferences</button></div><div className="event-grid">{events.map(event => <Card key={event.id} event={event} />)}</div></PageShell> }

export function SavedPage() { const [saved, setSaved] = useState(events.slice(1, 3)); return <PageShell title="Saved events" eyebrow="Your collection"><p className="page-subtitle">Keep the opportunities you want to come back to in one place.</p>{saved.length ? <div className="event-grid">{saved.map(event => <div key={event.id} className="saved-wrap"><Card event={event} /><button className="text-button" onClick={() => setSaved(saved.filter(item => item.id !== event.id))}><Bookmark size={14} /> Remove from saved</button></div>)}</div> : <div className="empty-state"><Bookmark size={32} /><h2>Your saved list is empty</h2><p>Bookmark events from Discover to see them here.</p><Link className="button primary" href="/">Explore events</Link></div>}</PageShell> }

export function RadarPage() { const [radius, setRadius] = useState(10); const visible = events.filter(event => event.distance <= radius); return <PageShell title="Event Radar" eyebrow="Live in Mumbai"><div className="radar-page-intro"><div><span className="section-kicker">Demo visualization</span><p className="page-subtitle">Explore events positioned relative to Mumbai. Coordinates are demo data for this prototype.</p></div><label className="radius-control">Radius: <b>{radius} km</b><input type="range" min="3" max="15" value={radius} onChange={e => setRadius(Number(e.target.value))} /></label></div><div className="radar-layout"><div className="radar-map"><div className="radar-glow" /><div className="ring r1" /><div className="ring r2" /><div className="ring r3" /><div className="radar-cross h" /><div className="radar-cross v" /><div className="radar-center"><MapPin size={17} /></div>{visible.map((event, index) => <Link key={event.id} href={`/events/${event.id}`} className={`radar-marker marker-${index}`} title={event.title}><i /> <span>{event.title}</span></Link>)}</div><aside className="radar-list"><b>{visible.length} matching events</b>{visible.map(event => <Link href={`/events/${event.id}`} className="radar-list-item" key={event.id}><span style={{ background: event.accent }} /> <div><strong>{event.title}</strong><small>{event.distance} km · {event.category}</small></div><ChevronRight size={15} /></Link>)}</aside></div></PageShell> }

export function EventDetailPage({ id }: { id: string }) { const event = events.find(item => item.id === id) ?? events[0]; return <PageShell title={event.title} eyebrow="Event details"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to discovery</Link><div className="detail-layout"><div><img src={event.image} alt="" className="detail-image" /><div className="detail-section"><span className="section-kicker">Overview</span><h2>Make time for something worth showing up for.</h2><p>This prototype event listing brings the key details into one clear place so attendees can decide quickly and confidently.</p></div><div className="detail-section"><span className="section-kicker">Eligibility & registration</span><p>Open registration for students, professionals, and curious builders. Confirm the latest details on the original listing before attending.</p></div></div><aside className="detail-aside"><span className={`source-badge ${event.source}`}>{event.source === 'verified' ? 'Verified organizer' : 'Found on the web'}</span><div className="detail-facts"><div><CalendarDays size={16} /><span>{event.date}<small>{event.time}</small></span></div><div><MapPin size={16} /><span>{event.venue}<small>{event.distance} km from Mumbai</small></span></div><div><Sparkles size={16} /><span>{event.fee}<small>Registration fee</small></span></div></div><button className="button primary full">{event.source === 'verified' ? 'Register interest' : 'View original event'} <ExternalLink size={15} /></button><button className="button secondary full"><Share2 size={15} /> Share event</button></aside></div></PageShell> }

export function OrganizerPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organizer, setOrganizer] = useState<{
    id: string
    name: string
    description: string | null
    verification_status: string
    created_at: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadApplication() {
    setLoading(true)
    try {
      const response = await fetch('/api/organizers')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Unable to load your organizer application.')
      } else if (result.organizer) {
        setOrganizer(result.organizer)
        setName(result.organizer.name)
        setDescription(result.organizer.description ?? '')
      }
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApplication()
  }, [])

  async function submitApplication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/organizers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.organizer) {
          setOrganizer(result.organizer)
        }
        throw new Error(result.error || 'Application could not be submitted.')
      }

      setOrganizer(result.organizer)
      setNotice('Application submitted! It is awaiting moderator review.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title="Organizer workspace" eyebrow="Organizer">
      {loading ? (
        <p className="page-subtitle">Loading your organizer application…</p>
      ) : organizer ? (
        <section className="form-card">
          <span className="section-kicker">Organizer application</span>
          <h2>{organizer.name}</h2>
          <p className="page-subtitle">
            {organizer.description || 'No description provided.'}
          </p>
          <p>
            Status: <strong>{organizer.verification_status}</strong>
          </p>
          {organizer.verification_status === 'verified' ? (
            <>
              <p>Your organizer profile is verified. You can proceed to event creation.</p>
              <Link href="/organizer/events/new" className="button primary">
                <Plus size={16} /> Create an event
              </Link>
            </>
          ) : organizer.verification_status === 'rejected' ? (
            <p>Your application was rejected. Please contact the EventPulse team for next steps.</p>
          ) : (
            <p>Your application is awaiting review. Event publishing will be available after approval.</p>
          )}
          {notice && <p role="status">{notice}</p>}
        </section>
      ) : (
        <form className="form-card" onSubmit={submitApplication}>
          <span className="section-kicker">Get started</span>
          <h2>Apply as an organizer</h2>
          <p className="page-subtitle">
            Tell us about your organization. Your profile will be reviewed before you can publish events.
          </p>
          <div className="form-grid">
            <label className="wide">
              Organization name
              <input
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mumbai Tech Community"
              />
            </label>
            <label className="wide">
              Description
              <textarea
                maxLength={2000}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does your organization do?"
              />
            </label>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit application'}
              <ChevronRight size={15} />
            </button>
          </div>
        </form>
      )}
      {error && organizer && <p role="alert">{error}</p>}
    </PageShell>
  )
}
export function OrganizerFormPage({ edit = false }: { edit?: boolean }) { return <PageShell title={edit ? 'Edit event' : 'Create an event'} eyebrow="Organizer"><form className="form-card" onSubmit={e => e.preventDefault()}><div className="form-grid"><label>Event name<input defaultValue={edit ? events[0].title : ''} placeholder="e.g. Community Design Workshop" /></label><label>Category<select defaultValue="Design"><option>AI & ML</option><option>Design</option><option>Startups</option><option>Culture</option></select></label><label className="wide">Description<textarea placeholder="Tell attendees what makes this event worth attending." /></label><label>Start date<input type="datetime-local" /></label><label>Registration deadline<input type="date" /></label><label>Venue<input placeholder="Venue name" /></label><label>Registration fee<input placeholder="Free or amount" /></label></div><div className="form-actions"><Link href="/organizer" className="button secondary">Cancel</Link><button className="button primary" type="submit">{edit ? 'Save changes' : 'Publish event'} <ChevronRight size={15} /></button></div></form></PageShell> }
