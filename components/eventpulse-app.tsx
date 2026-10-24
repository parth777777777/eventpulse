// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Bookmark, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Compass, Filter, MapPin, Menu, Navigation, Plus, Search, Sparkles, Target, X } from 'lucide-react'

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

const categoryStyles: Record<string, { image: string; accent: string }> = {
  'AI & ML': { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', accent: '#9275ff' },
  Design: { image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80', accent: '#36d6d2' },
  Startups: { image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80', accent: '#e2a55d' },
  Robotics: { image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', accent: '#ec739a' },
}
const defaultStyle = { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', accent: '#9275ff' }

type ApiEvent = Record<string, any>

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: 'Date TBA', time: 'Time TBA' }
  return {
    date: new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(date),
    time: new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(date),
  }
}

function mapApiEvent(row: ApiEvent): EventItem {
  const category = String(row.category || 'Other')
  const style = categoryStyles[category] || defaultStyle
  const { date, time } = formatDate(row.starts_at)
  const amount = row.fee_amount == null ? 0 : Number(row.fee_amount)
  const source: EventItem['source'] = row.source_type === 'web' || row.source_attribution === 'web' ? 'web' : 'verified'
  const venue = [row.venue_name || row.venue, row.city].filter(Boolean).join(', ') || (row.format === 'online' ? 'Online event' : row.address || 'Location details to be announced')
  const distanceValue = Number(row.distance_km ?? row.distance ?? row.distance_km_away ?? 0)
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

export const events: EventItem[] = []

function Logo() { return <Link href="/" className="logo"><span className="logo-mark"><span /></span><span>event<span className="logo-accent">pulse</span></span></Link> }

function Header({ onLocation }: { onLocation: () => void }) {
  return <header className="topbar"><Logo /><nav className="nav-links"><Link className="active" href="/">Discover</Link><Link href="/radar"><Target size={15} /> Event Radar</Link><Link href="/saved"><Bookmark size={15} /> Saved</Link></nav><div className="top-actions"><button className="location-pill" onClick={onLocation}><MapPin size={15} /><span>Mumbai, India</span><ChevronDown size={14} /></button><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><div className="avatar">AR</div></div><button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button></header>
}

function EventCard({ event, saved, onSave }: { event: EventItem; saved: boolean; onSave: () => void }) {
  return <article className="event-card"><div className="event-image-wrap"><img src={event.image} alt="" className="event-image" /><div className="image-gradient" /><span className={`source-badge ${event.source}`}>{event.source === 'verified' ? <><CircleCheck size={12} /> Verified organizer</> : <><Compass size={12} /> Found on the web</>}</span><button className={`save-button ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove bookmark' : 'Bookmark event'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button><span className="date-tile"><b>{event.date.split(' ')[1]?.replace(',', '') || '—'}</b><small>{event.date.split(' ')[0]}</small></span></div><div className="event-body"><div className="event-meta"><span style={{ color: event.accent }}>{event.category}</span><span>{event.distance > 0 ? `${event.distance} km away` : 'Nearby'}</span></div><Link href={`/events/${event.id}`} className="event-title">{event.title}</Link><div className="event-detail"><CalendarDays size={14} />{event.date} · {event.time}</div><div className="event-detail"><MapPin size={14} />{event.venue}</div><div className="event-footer"><span className={event.fee === 'Free' ? 'free' : ''}>{event.fee}</span><span className="match"><Sparkles size={13} /> {event.match}</span><Link href={`/events/${event.id}`} className="arrow-button" aria-label="Open event"><ChevronRight size={17} /></Link></div></div></article>
}

function RadarPreview({ count }: { count: number }) {
  return <section className="radar-preview"><div className="radar-copy"><span className="eyebrow"><span className="eyebrow-dot" /> Live in Mumbai</span><h2>See what&apos;s happening <em>near you.</em></h2><p>Explore {count} published {count === 1 ? 'event' : 'events'} around Mumbai.</p><Link href="/radar" className="button primary">Explore Event Radar <ChevronRight size={16} /></Link></div><div className="mini-radar"><div className="radar-glow" /><div className="ring r1" /><div className="ring r2" /><div className="ring r3" /><div className="radar-cross h" /><div className="radar-cross v" /><div className="radar-center"><MapPin size={14} /></div><span className="radar-label l1">Nearby events</span><span className="radar-label l2">Live listings</span><span className="radar-label l3">{count} total</span><i className="marker m1" /><i className="marker m2" /><i className="marker m3" /></div></section>
}

function EmptyEvents({ message }: { message: string }) {
  return <div className="empty-results">{message}<p>Approved events will appear here once they are published.</p><Link className="button secondary" href="/organizer">List an event <Plus size={14} /></Link></div>
}

export default function EventPulseApp() {
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [locationOpen, setLocationOpen] = useState(false)
  const [filter, setFilter] = useState('All events')
  const [apiEvents, setApiEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    async function loadEvents() {
      try {
        const response = await fetch('/api/events?lat=19.0760&lng=72.8777&radiusKm=25&limit=50')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load events.')
        if (active) setApiEvents(Array.isArray(result.data) ? result.data.map(mapApiEvent) : [])
      } catch {
        if (active) setLoadError('Could not load live events. Please refresh to try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadEvents()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => apiEvents.filter(e =>
    `${e.title} ${e.category} ${e.venue}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'All events' || (filter === 'Free' ? e.fee === 'Free' : e.category === filter))
  ), [apiEvents, query, filter])

  return <div className="app-shell"><Header onLocation={() => setLocationOpen(!locationOpen)} />{locationOpen && <div className="location-popover"><div className="popover-header"><b>Choose your location</b><button onClick={() => setLocationOpen(false)}><X size={16} /></button></div><button className="detect-location"><Navigation size={15} /> Use my current location</button><label>Search a city<input autoFocus placeholder="Mumbai, India" /></label><div className="recent-location"><MapPin size={15} /> Mumbai, India <CircleCheck size={15} /></div><div className="recent-location muted"><MapPin size={15} /> Bengaluru, India</div></div>}<main className="main-content"><div className="hero-row"><div className="hero-copy"><div className="breadcrumb">Discover <span>/</span> Mumbai</div><h1>Find your next <span>opportunity.</span></h1><p>Explore events worth showing up for, right around you.</p><div className="search-bar"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, skills, or interests" /><kbd>⌘ K</kbd></div><div className="quick-searches"><span>Try searching</span><button onClick={() => setQuery('hackathon')}>Hackathons nearby</button><button onClick={() => setQuery('Design')}>Design workshops nearby</button></div></div><div className="hero-stat"><div className="stat-icon"><Sparkles size={19} /></div><strong>{loading ? '…' : apiEvents.length}</strong><span>published events nearby</span><small>{loading ? 'Loading live listings' : 'Live from EventPulse'}</small></div></div><RadarPreview count={apiEvents.length} /><div className="section-heading"><div><span className="section-kicker">Curated for you</span><h2>Recommended events</h2></div><Link href="/discover">View all events <ChevronRight size={15} /></Link></div><div className="filter-row"><div className="filter-tabs">{['All events', 'AI & ML', 'Design', 'Startups', 'Free'].map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="filter-button"><Filter size={15} /> More filters</button></div>{loading ? <div className="empty-results">Loading published events…</div> : loadError ? <EmptyEvents message={loadError} /> : <div className="event-grid">{filtered.slice(0, 4).map(event => <EventCard key={event.id} event={event} saved={saved.includes(event.id)} onSave={() => setSaved(s => s.includes(event.id) ? s.filter(id => id !== event.id) : [...s, event.id])} />)}</div>}{!loading && !loadError && filtered.length === 0 && <EmptyEvents message={apiEvents.length ? 'No events match your filters.' : 'No published events found near Mumbai yet.'} />}<div className="lower-grid"><section><div className="section-heading compact"><div><span className="section-kicker">Next step</span><h2>Organizer opportunities</h2></div><Link href="/organizer">Organizer workspace <ChevronRight size={15} /></Link></div><p className="page-subtitle">Have an event to share? Submit it for review and help people discover opportunities nearby.</p></section><section className="category-panel"><div className="section-heading compact"><div><span className="section-kicker">Explore by interest</span><h2>Browse categories</h2></div></div><div className="category-grid">{['AI & ML','Design','Startups','Culture'].map((cat, i) => <button key={cat} className="category-chip" style={{'--chip-color': ['#9275ff','#36d6d2','#e2a55d','#ec739a'][i]} as React.CSSProperties} onClick={() => setFilter(cat)}><span>{['✦','◒','↗','◎'][i]}</span>{cat}<ChevronRight size={14} /></button>)}</div></section></div></main><footer className="site-footer"><span>eventpulse</span><span>Discover locally. Show up meaningfully.</span><Link href="/organizer" className="organizer-link">Are you an organizer? <b>List an event</b> <Plus size={14} /></Link></footer></div>
}
