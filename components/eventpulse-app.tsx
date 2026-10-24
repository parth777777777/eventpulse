// @ts-nocheck
'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bell, Bookmark, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Compass, Filter, MapPin, Menu, Navigation, Plus, Search, Sparkles, Target, X } from 'lucide-react'
import { AccountMenu } from './auth/account-menu'
import LocationPicker from './discovery/LocationPicker'
import { useDiscovery } from '@/lib/discovery/use-discovery'
import { parseSearchParams, buildSearchParams } from '@/lib/discovery/url-state'
import type { DiscoveryEvent, SearchState } from '@/lib/discovery/types'
import { DEFAULT_RADIUS_KM } from '@/lib/discovery/types'

// Re-export legacy type and empty array for backward-compatibility with eventpulse-pages.tsx
export type EventItem = {
  id: string
  title: string
  category: string
  date: string
  time: string
  venue: string
  distance: number
  fee: string
  source: 'verified' | 'web'
  image: string
  accent: string
  match: string
  deadline?: string
}
export const events: EventItem[] = []

// Category visual styles (shared with DiscoveryCard)
const categoryStyles: Record<string, { image: string; accent: string }> = {
  'AI & ML': { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', accent: '#9275ff' },
  Design: { image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80', accent: '#36d6d2' },
  Startups: { image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80', accent: '#e2a55d' },
  Robotics: { image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', accent: '#ec739a' },
  Culture: { image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80', accent: '#ec739a' },
}
const defaultStyle = { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', accent: '#9275ff' }

function formatDate(value: string, tz = 'Asia/Kolkata') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: 'Date TBA', time: 'Time TBA' }
  return {
    date: new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(date),
    time: new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(date),
  }
}

function toEventItem(row: DiscoveryEvent): EventItem {
  const category = String(row.category || 'Other')
  const style = categoryStyles[category] || defaultStyle
  const { date, time } = formatDate(row.starts_at, row.timezone)
  const amount = row.fee_amount == null ? 0 : Number(row.fee_amount)
  const source: EventItem['source'] = row.source_attribution === 'web' ? 'web' : 'verified'
  const venue = [row.venue_name, row.city].filter(Boolean).join(', ') || (row.format === 'online' ? 'Online event' : row.address || 'Location TBA')
  const distanceValue = Number(row.distance_km ?? 0)
  return {
    id: String(row.id),
    title: String(row.title || 'Untitled event'),
    category,
    date,
    time,
    venue,
    distance: Number.isFinite(distanceValue) ? Math.round(distanceValue * 10) / 10 : 0,
    fee: amount === 0 ? 'Free' : `₹${amount.toLocaleString('en-IN')}`,
    source,
    image: style.image,
    accent: style.accent,
    match: amount === 0 ? 'Free to attend' : 'Registration open',
    deadline: row.registration_deadline || undefined,
  }
}

function Logo() { return <Link href="/" className="logo"><span className="logo-mark"><span /></span><span>event<span className="logo-accent">pulse</span></span></Link> }

function Header({ onLocation, locationLabel }: { onLocation: () => void; locationLabel: string }) {
  return <header className="topbar"><Logo /><nav className="nav-links"><Link className="active" href="/">Discover</Link><Link href="/radar"><Target size={15} /> Event Radar</Link><Link href="/saved"><Bookmark size={15} /> Saved</Link></nav><div className="top-actions"><button className="location-pill" onClick={onLocation}><MapPin size={15} /><span>{locationLabel}</span><ChevronDown size={14} /></button><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><AccountMenu /></div><button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button></header>
}

function EventCard({ event, saved, onSave }: { event: EventItem; saved: boolean; onSave: () => void }) {
  return <article className="event-card"><div className="event-image-wrap"><img src={event.image} alt="" className="event-image" /><div className="image-gradient" /><span className={`source-badge ${event.source}`}>{event.source === 'verified' ? <><CircleCheck size={12} /> Verified organizer</> : <><Compass size={12} /> Found on the web</>}</span><button className={`save-button ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove bookmark' : 'Bookmark event'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button><span className="date-tile"><b>{event.date.split(' ')[1]?.replace(',', '') || '—'}</b><small>{event.date.split(' ')[0]}</small></span></div><div className="event-body"><div className="event-meta"><span style={{ color: event.accent }}>{event.category}</span><span>{event.distance > 0 ? `${event.distance} km away` : 'Nearby'}</span></div><Link href={`/events/${event.id}`} className="event-title">{event.title}</Link><div className="event-detail"><CalendarDays size={14} />{event.date} · {event.time}</div><div className="event-detail"><MapPin size={14} />{event.venue}</div><div className="event-footer"><span className={event.fee === 'Free' ? 'free' : ''}>{event.fee}</span><span className="match"><Sparkles size={13} /> {event.match}</span><Link href={`/events/${event.id}`} className="arrow-button" aria-label="Open event"><ChevronRight size={17} /></Link></div></div></article>
}

function RadarPreview({ count }: { count: number }) {
  return <section className="radar-preview"><div className="radar-copy"><span className="eyebrow"><span className="eyebrow-dot" /> Live nearby</span><h2>See what&apos;s happening <em>near you.</em></h2><p>Explore {count} published {count === 1 ? 'event' : 'events'} near your location.</p><Link href="/discover" className="button primary">View all events <ChevronRight size={16} /></Link></div><div className="mini-radar"><div className="radar-glow" /><div className="ring r1" /><div className="ring r2" /><div className="ring r3" /><div className="radar-cross h" /><div className="radar-cross v" /><div className="radar-center"><MapPin size={14} /></div><span className="radar-label l1">Nearby events</span><span className="radar-label l2">Live listings</span><span className="radar-label l3">{count} total</span><i className="marker m1" /><i className="marker m2" /><i className="marker m3" /></div></section>
}

function EmptyState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-results">
      {message}
      <p>Set a search location to discover nearby events, or browse all listings.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        {onRetry && <button className="button secondary" onClick={onRetry}><Plus size={14} /> Retry</button>}
        <Link className="button secondary" href="/discover">Browse all events <ChevronRight size={14} /></Link>
      </div>
    </div>
  )
}

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function EventPulseAppInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchState, setSearchStateRaw] = useState<SearchState>(() => parseSearchParams(searchParams))
  const [locationOpen, setLocationOpen] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
  const [filter, setFilter] = useState('All events')
  const [keywordInput, setKeywordInput] = useState(searchState.keyword)
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setSearchState = useCallback((update: Partial<SearchState>) => {
    setSearchStateRaw((prev) => {
      const next = { ...prev, ...update }
      const qs = buildSearchParams(next).toString()
      router.replace(`?${qs}`, { scroll: false })
      return next
    })
  }, [router])

  // Sync URL → state on navigation
  useEffect(() => {
    const next = parseSearchParams(searchParams)
    setSearchStateRaw(next)
    setKeywordInput(next.keyword)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  function handleKeywordChange(value: string) {
    setKeywordInput(value)
    if (keywordTimer.current) clearTimeout(keywordTimer.current)
    keywordTimer.current = setTimeout(() => {
      setSearchState({ keyword: value.trim() })
    }, 400)
  }

  const { status, retry } = useDiscovery(searchState)
  const apiEvents = status.type === 'ok' ? status.events : []
  const loading = status.type === 'loading'
  const loadError = status.type === 'error' ? status.message : ''

  const displayEvents = useMemo(() =>
    apiEvents
      .map(toEventItem)
      .filter((e) =>
        `${e.title} ${e.category} ${e.venue}`.toLowerCase().includes(keywordInput.toLowerCase()) &&
        (filter === 'All events' || (filter === 'Free' ? e.fee === 'Free' : e.category === filter))
      ),
    [apiEvents, keywordInput, filter]
  )

  const locationLabel = searchState.locationLabel ?? (searchState.lat !== null ? 'Custom location' : 'Set location')

  return (
    <div className="app-shell">
      <Header onLocation={() => setLocationOpen(!locationOpen)} locationLabel={locationLabel} />

      {locationOpen && (
        <LocationPicker
          state={searchState}
          onApply={(update) => setSearchState(update)}
          onClose={() => setLocationOpen(false)}
        />
      )}

      <main className="main-content">
        <div className="hero-row">
          <div className="hero-copy">
            <div className="breadcrumb">Discover <span>/</span> {locationLabel}</div>
            <h1>Find your next <span>opportunity.</span></h1>
            <p>Explore events worth showing up for, right around you.</p>
            <div className="search-bar">
              <Search size={19} />
              <input
                value={keywordInput}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder="Search events, skills, or interests"
                aria-label="Search events"
              />
              <kbd>⌘ K</kbd>
            </div>
            <div className="quick-searches">
              <span>Try searching</span>
              <button onClick={() => handleKeywordChange('hackathon')}>Hackathons nearby</button>
              <button onClick={() => handleKeywordChange('Design')}>Design workshops nearby</button>
            </div>
          </div>
          <div className="hero-stat">
            <div className="stat-icon"><Sparkles size={19} /></div>
            <strong>{loading ? '…' : apiEvents.length}</strong>
            <span>published events {searchState.lat !== null ? 'nearby' : 'found'}</span>
            <small>{loading ? 'Loading live listings' : 'Live from EventPulse'}</small>
          </div>
        </div>

        <RadarPreview count={apiEvents.length} />

        <div className="section-heading">
          <div>
            <span className="section-kicker">Curated for you</span>
            <h2>Recommended events</h2>
          </div>
          <Link href="/discover">View all events <ChevronRight size={15} /></Link>
        </div>

        <div className="filter-row">
          <div className="filter-tabs">
            {['All events', 'AI & ML', 'Design', 'Startups', 'Free'].map((item) => (
              <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
          <button className="filter-button"><Filter size={15} /> More filters</button>
        </div>

        {loading ? (
          <div className="empty-results" aria-live="polite" aria-busy="true">Loading published events…</div>
        ) : loadError ? (
          <EmptyState message={loadError} onRetry={retry} />
        ) : (
          <div className="event-grid">
            {displayEvents.slice(0, 4).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                saved={saved.includes(event.id)}
                onSave={() => setSaved((s) => s.includes(event.id) ? s.filter((id) => id !== event.id) : [...s, event.id])}
              />
            ))}
          </div>
        )}

        {!loading && !loadError && displayEvents.length === 0 && (
          <EmptyState
            message={
              apiEvents.length
                ? 'No events match your filters.'
                : searchState.lat === null
                ? 'Set a location to find nearby events.'
                : 'No published events found nearby.'
            }
          />
        )}

        <div className="lower-grid">
          <section>
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">Next step</span>
                <h2>Organizer opportunities</h2>
              </div>
              <Link href="/organizer">Organizer workspace <ChevronRight size={15} /></Link>
            </div>
            <p className="page-subtitle">Have an event to share? Submit it for review and help people discover opportunities nearby.</p>
          </section>
          <section className="category-panel">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">Explore by interest</span>
                <h2>Browse categories</h2>
              </div>
            </div>
            <div className="category-grid">
              {['AI & ML', 'Design', 'Startups', 'Culture'].map((cat, i) => (
                <button
                  key={cat}
                  className="category-chip"
                  style={{ '--chip-color': ['#9275ff', '#36d6d2', '#e2a55d', '#ec739a'][i] } as React.CSSProperties}
                  onClick={() => setFilter(cat)}
                >
                  <span>{['✦', '◒', '↗', '◎'][i]}</span>{cat}<ChevronRight size={14} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <span>eventpulse</span>
        <span>Discover locally. Show up meaningfully.</span>
        <Link href="/organizer" className="organizer-link">Are you an organizer? <b>List an event</b> <Plus size={14} /></Link>
      </footer>
    </div>
  )
}

export default function EventPulseApp() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#55566a', fontSize: 13 }}>Loading…</div>}>
      <EventPulseAppInner />
    </Suspense>
  )
}
