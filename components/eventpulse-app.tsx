'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Bookmark, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Compass, ExternalLink, Filter, Heart, MapPin, Menu, MoreHorizontal, Navigation, Plus, Search, Share2, Sparkles, Target, X } from 'lucide-react'

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

export const events: EventItem[] = [
  { id: 'ai-summit', title: 'AI Builders Summit 2024', category: 'AI & ML', date: 'Sat, 16 Nov', time: '10:00 AM', venue: 'Taj Lands End, Bandra', distance: 2.4, fee: 'Free', source: 'verified', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', accent: '#9275ff', match: 'Matches your interest in AI', deadline: 'Closes tomorrow' },
  { id: 'design-weekend', title: 'Designing for Impact', category: 'Design', date: 'Sun, 17 Nov', time: '11:00 AM', venue: 'The Studio, Lower Parel', distance: 4.8, fee: '₹499', source: 'verified', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80', accent: '#36d6d2', match: 'Only 4.8 km away' },
  { id: 'founders-meet', title: 'Mumbai Founders & Funders', category: 'Startups', date: 'Thu, 21 Nov', time: '6:30 PM', venue: '91Springboard, Vikhroli', distance: 8.1, fee: 'Free', source: 'web', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80', accent: '#e2a55d', match: 'Free to attend' },
  { id: 'robotics', title: 'Robotics Open Lab', category: 'Robotics', date: 'Sat, 23 Nov', time: '2:00 PM', venue: 'IIT Bombay, Powai', distance: 12.7, fee: '₹250', source: 'web', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', accent: '#ec739a', match: 'Open registration' },
]

function Logo() { return <Link href="/" className="logo"><span className="logo-mark"><span /></span><span>event<span className="logo-accent">pulse</span></span></Link> }

function Header({ onLocation }: { onLocation: () => void }) {
  return <header className="topbar"><Logo /><nav className="nav-links"><Link className="active" href="/">Discover</Link><Link href="/radar"><Target size={15} /> Event Radar</Link><Link href="/saved"><Bookmark size={15} /> Saved</Link></nav><div className="top-actions"><button className="location-pill" onClick={onLocation}><MapPin size={15} /><span>Mumbai, India</span><ChevronDown size={14} /></button><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><div className="avatar">AR</div></div><button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button></header>
}

function EventCard({ event, saved, onSave }: { event: EventItem; saved: boolean; onSave: () => void }) {
  return <article className="event-card"><div className="event-image-wrap"><img src={event.image} alt="" className="event-image" /><div className="image-gradient" /><span className={`source-badge ${event.source}`}>{event.source === 'verified' ? <><CircleCheck size={12} /> Verified organizer</> : <><Compass size={12} /> Found on the web</>}</span><button className={`save-button ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove bookmark' : 'Bookmark event'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button><span className="date-tile"><b>{event.date.split(' ')[1].replace(',', '')}</b><small>{event.date.split(' ')[0]}</small></span></div><div className="event-body"><div className="event-meta"><span style={{ color: event.accent }}>{event.category}</span><span>{event.distance} km away</span></div><Link href={`/events/${event.id}`} className="event-title">{event.title}</Link><div className="event-detail"><CalendarDays size={14} />{event.date} · {event.time}</div><div className="event-detail"><MapPin size={14} />{event.venue}</div><div className="event-footer"><span className={event.fee === 'Free' ? 'free' : ''}>{event.fee}</span><span className="match"><Sparkles size={13} /> {event.match}</span><button className="arrow-button" aria-label="Open event"><ChevronRight size={17} /></button></div></div></article>
}

function RadarPreview() {
  return <section className="radar-preview"><div className="radar-copy"><span className="eyebrow"><span className="eyebrow-dot" /> Live in Mumbai</span><h2>See what&apos;s happening <em>near you.</em></h2><p>Explore 42 opportunities across the city, mapped to your interests.</p><Link href="/radar" className="button primary">Explore Event Radar <ChevronRight size={16} /></Link></div><div className="mini-radar"><div className="radar-glow" /><div className="ring r1" /><div className="ring r2" /><div className="ring r3" /><div className="radar-cross h" /><div className="radar-cross v" /><div className="radar-center"><MapPin size={14} /></div><span className="radar-label l1">AI Summit</span><span className="radar-label l2">Design Lab</span><span className="radar-label l3">+ 39 more</span><i className="marker m1" /><i className="marker m2" /><i className="marker m3" /></div></section>
}

export default function EventPulseApp() {
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<string[]>(['design-weekend'])
  const [locationOpen, setLocationOpen] = useState(false)
  const [filter, setFilter] = useState('All events')
  const filtered = useMemo(() => events.filter(e => `${e.title} ${e.category} ${e.venue}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All events' || (filter === 'Free' ? e.fee === 'Free' : e.category === filter))), [query, filter])
  return <div className="app-shell"><Header onLocation={() => setLocationOpen(!locationOpen)} />{locationOpen && <div className="location-popover"><div className="popover-header"><b>Choose your location</b><button onClick={() => setLocationOpen(false)}><X size={16} /></button></div><button className="detect-location"><Navigation size={15} /> Use my current location</button><label>Search a city<input autoFocus placeholder="Mumbai, India" /></label><div className="recent-location"><MapPin size={15} /> Mumbai, India <CircleCheck size={15} /></div><div className="recent-location muted"><MapPin size={15} /> Bengaluru, India</div></div>}<main className="main-content"><div className="hero-row"><div className="hero-copy"><div className="breadcrumb">Discover <span>/</span> Mumbai</div><h1>Find your next <span>opportunity.</span></h1><p>Explore events worth showing up for, right around you.</p><div className="search-bar"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, skills, or interests" /><kbd>⌘ K</kbd></div><div className="quick-searches"><span>Try searching</span><button onClick={() => setQuery('AI')}>AI hackathons this weekend</button><button onClick={() => setQuery('Design')}>Design workshops nearby</button></div></div><div className="hero-stat"><div className="stat-icon"><Sparkles size={19} /></div><strong>42</strong><span>events around you</span><small>Updated just now</small></div></div><RadarPreview /><div className="section-heading"><div><span className="section-kicker">Curated for you</span><h2>Recommended events</h2></div><Link href="/discover">View all events <ChevronRight size={15} /></Link></div><div className="filter-row"><div className="filter-tabs">{['All events', 'AI & ML', 'Design', 'Startups', 'Free'].map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="filter-button"><Filter size={15} /> More filters</button></div><div className="event-grid">{filtered.slice(0, 4).map(event => <EventCard key={event.id} event={event} saved={saved.includes(event.id)} onSave={() => setSaved(s => s.includes(event.id) ? s.filter(id => id !== event.id) : [...s, event.id])} />)}</div>{filtered.length === 0 && <div className="empty-results">No events found. Try another search.</div>}<div className="lower-grid"><section><div className="section-heading compact"><div><span className="section-kicker">Don&apos;t miss out</span><h2>Upcoming deadlines</h2></div><Link href="/discover">See calendar <ChevronRight size={15} /></Link></div><div className="deadline-list"><div className="deadline-item"><div className="deadline-date"><b>14</b><span>NOV</span></div><div><b>AI Builders Summit</b><p>Registration closes tomorrow</p></div><span className="deadline-arrow"><ChevronRight size={16} /></span></div><div className="deadline-item"><div className="deadline-date cyan"><b>18</b><span>NOV</span></div><div><b>Designing for Impact</b><p>Registration closes in 4 days</p></div><span className="deadline-arrow"><ChevronRight size={16} /></span></div></div></section><section className="category-panel"><div className="section-heading compact"><div><span className="section-kicker">Explore by interest</span><h2>Browse categories</h2></div></div><div className="category-grid">{['AI & ML','Design','Startups','Culture'].map((cat, i) => <button key={cat} className="category-chip" style={{'--chip-color': ['#9275ff','#36d6d2','#e2a55d','#ec739a'][i]} as React.CSSProperties}><span>{['✦','◒','↗','◎'][i]}</span>{cat}<ChevronRight size={14} /></button>)}</div></section></div></main><footer className="site-footer"><span>eventpulse</span><span>Discover locally. Show up meaningfully.</span><Link href="/organizer" className="organizer-link">Are you an organizer? <b>List an event</b> <Plus size={14} /></Link></footer></div>
}
