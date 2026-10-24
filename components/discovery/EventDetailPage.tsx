import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Compass,
  ExternalLink,
  MapPin,
  Share2,
  Sparkles,
} from 'lucide-react'
import { fetchPublishedEvent } from '@/lib/discovery/event-detail'
import { AccountMenu } from '@/components/auth/account-menu'

function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark"><span /></span>
      <span>event<span className="logo-accent">pulse</span></span>
    </Link>
  )
}

function formatDatetime(value: string | null, tz = 'Asia/Kolkata') {
  if (!value) return { date: 'Date TBA', time: '' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: 'Date TBA', time: '' }
  return {
    date: new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: tz,
    }).format(d),
    time: new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).format(d),
  }
}

function formatFee(amount: number | null, currency: string) {
  if (amount === null || amount === 0) return 'Free'
  if (currency === 'INR') return `₹${Number(amount).toLocaleString('en-IN')}`
  return `${currency} ${Number(amount).toLocaleString()}`
}

/**
 * Validate that a registration URL is safe to render as an external link.
 * Accepts only https and http URLs; blocks javascript: and other schemes.
 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

interface EventDetailPageProps {
  id: string
}

export async function EventDetailPageServer({ id }: EventDetailPageProps) {
  const result = await fetchPublishedEvent(id)

  if (result.type === 'not_found') {
    notFound()
  }

  if (result.type === 'not_published') {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Logo />
          <div className="top-actions"><AccountMenu /></div>
        </header>
        <main className="main-content">
          <div className="breadcrumb">
            <Link href="/">Discover</Link> <span>/</span> Event
          </div>
          <div className="empty-state" style={{ marginTop: 40 }}>
            <MapPin size={32} />
            <h2>Event not available</h2>
            <p>This event is not currently published or is pending review.</p>
            <Link className="button primary" href="/">Back to discovery</Link>
          </div>
        </main>
      </div>
    )
  }

  if (result.type === 'error') {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Logo />
          <div className="top-actions"><AccountMenu /></div>
        </header>
        <main className="main-content">
          <div className="breadcrumb">
            <Link href="/">Discover</Link> <span>/</span> Event
          </div>
          <div className="empty-state" style={{ marginTop: 40 }}>
            <Sparkles size={32} />
            <h2>Unable to load event</h2>
            <p>{result.message}</p>
            <Link className="button secondary" href="/">Back to discovery</Link>
          </div>
        </main>
      </div>
    )
  }

  const { event } = result
  const isVerified = event.verification_status === 'verified'
  const { date: startDate, time: startTime } = formatDatetime(event.starts_at, event.timezone)
  const { date: endDate, time: endTime } = formatDatetime(event.ends_at ?? null, event.timezone)
  const { date: deadlineDate } = formatDatetime(event.registration_deadline ?? null, event.timezone)
  const fee = formatFee(event.fee_amount, event.currency)
  const hasRegistrationUrl = event.registration_url && isSafeUrl(event.registration_url)

  const venue =
    event.format === 'online'
      ? 'Online event'
      : [event.venue_name, event.address, event.city, event.country]
          .filter(Boolean)
          .join(', ') || 'Location TBA'

  const mapsUrl =
    event.latitude !== null && event.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}&zoom=15`
      : null

  const categoryImages: Record<string, string> = {
    'AI & ML': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    Design: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    Startups: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    Robotics: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
  }
  const heroImage =
    categoryImages[event.category] ??
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'

  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <nav className="nav-links">
          <Link href="/">Discover</Link>
          <Link href="/discover">All events</Link>
        </nav>
        <div className="top-actions"><AccountMenu /></div>
      </header>

      <main className="main-content">
        <div className="breadcrumb">
          <Link href="/">Discover</Link> <span>/</span>{' '}
          <Link href="/discover">Events</Link> <span>/</span> {event.title}
        </div>

        <Link href="/discover" className="back-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
          <ArrowLeft size={15} /> Back to discovery
        </Link>

        <div className="detail-layout">
          {/* Main column */}
          <div>
            <img src={heroImage} alt="" className="detail-image" />

            <div className="detail-section">
              <span className="section-kicker">{event.category}</span>
              <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 500, letterSpacing: '-1px', margin: '10px 0 16px', lineHeight: 1.1 }}>
                {event.title}
              </h1>
              {event.description && (
                <p className="page-subtitle" style={{ whiteSpace: 'pre-line' }}>{event.description}</p>
              )}
            </div>

            {/* Event details */}
            <div className="detail-section">
              <span className="section-kicker">Event details</span>
              <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
                <div className="detail-facts" style={{ margin: 0 }}>
                  <div>
                    <CalendarDays size={16} />
                    <span>
                      {startDate}
                      {startTime && <small>{startTime}</small>}
                      {event.ends_at && (
                        <small style={{ display: 'block' }}>Ends: {endDate}{endTime && `, ${endTime}`}</small>
                      )}
                    </span>
                  </div>
                  <div>
                    <MapPin size={16} />
                    <span>
                      {venue}
                      {mapsUrl && (
                        <small>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#9275ff' }}
                          >
                            View on map
                          </a>
                        </small>
                      )}
                    </span>
                  </div>
                  <div>
                    <Sparkles size={16} />
                    <span>
                      {fee}
                      <small>Registration fee</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source attribution */}
            {event.source_attribution && (
              <div className="detail-section">
                <span className="section-kicker">Source</span>
                <p className="page-subtitle" style={{ marginTop: 8 }}>{event.source_attribution}</p>
              </div>
            )}
          </div>

          {/* Aside */}
          <aside className="detail-aside">
            <span className={`source-badge ${isVerified ? 'verified' : 'web'}`} style={{ position: 'static', marginBottom: 16, display: 'inline-flex' }}>
              {isVerified ? <><CircleCheck size={12} /> Verified organizer</> : <><Compass size={12} /> Found on the web</>}
            </span>

            <div className="detail-facts">
              <div>
                <CalendarDays size={16} />
                <span>
                  {startDate}
                  <small>{startTime}</small>
                </span>
              </div>
              <div>
                <MapPin size={16} />
                <span>
                  {event.format === 'online' ? 'Online event' : (event.city ?? venue)}
                  <small>{event.format === 'in_person' ? 'In person' : event.format === 'hybrid' ? 'Hybrid' : 'Online'}</small>
                </span>
              </div>
              <div>
                <Sparkles size={16} />
                <span>
                  {fee}
                  <small>Registration fee</small>
                </span>
              </div>
              {event.registration_deadline && (
                <div>
                  <CalendarDays size={16} style={{ color: '#e2a55d' }} />
                  <span style={{ color: 'var(--ink)' }}>
                    {deadlineDate}
                    <small style={{ color: 'var(--muted-ink)' }}>Registration deadline</small>
                  </span>
                </div>
              )}
              {event.registration_status && event.registration_status !== 'unknown' && (
                <div style={{ fontSize: 10 }}>
                  <span style={{ color: 'var(--muted-ink)' }}>Status:</span>{' '}
                  <span className="status-chip">{event.registration_status}</span>
                </div>
              )}
            </div>

            {/* Registration action */}
            {hasRegistrationUrl ? (
              <a
                href={event.registration_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="button primary full"
              >
                {isVerified ? 'Register now' : 'View original event'} <ExternalLink size={15} />
              </a>
            ) : (
              <div
                className="button secondary full"
                style={{ opacity: 0.5, cursor: 'default', pointerEvents: 'none' }}
                aria-disabled="true"
                title="No registration link available"
              >
                Registration link unavailable
              </div>
            )}

            {/* Share button */}
            <button
              className="button secondary full"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({ title: event.title, url: window.location.href })
                } else {
                  void navigator.clipboard?.writeText(window.location.href)
                }
              }}
            >
              <Share2 size={15} /> Share event
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
