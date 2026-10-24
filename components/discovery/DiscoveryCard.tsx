'use client'

import Link from 'next/link'
import { CalendarDays, ChevronRight, CircleCheck, Compass, MapPin } from 'lucide-react'
import type { DiscoveryEvent } from '@/lib/discovery/types'

const categoryStyles: Record<string, { image: string; accent: string }> = {
  'AI & ML': {
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    accent: '#9275ff',
  },
  Design: {
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
    accent: '#36d6d2',
  },
  Startups: {
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    accent: '#e2a55d',
  },
  Robotics: {
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    accent: '#ec739a',
  },
  Culture: {
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    accent: '#ec739a',
  },
}
const defaultStyle = {
  image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  accent: '#9275ff',
}

export function formatDatetime(value: string, tz = 'Asia/Kolkata') {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: 'Date TBA', time: '' }
  return {
    date: new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: tz,
    }).format(d),
    time: new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).format(d),
  }
}

export function formatFee(amount: number | null, currency: string) {
  if (amount === null || amount === 0) return 'Free'
  if (currency === 'INR') return `₹${Number(amount).toLocaleString('en-IN')}`
  return `${currency} ${Number(amount).toLocaleString()}`
}

interface DiscoveryCardProps {
  event: DiscoveryEvent
  selected?: boolean
  onSelect?: () => void
}

export function DiscoveryCard({ event, selected, onSelect }: DiscoveryCardProps) {
  const style = categoryStyles[event.category] ?? defaultStyle
  const { date, time } = formatDatetime(event.starts_at, event.timezone)
  const fee = formatFee(event.fee_amount, event.currency)
  const isVerified = event.verification_status === 'verified'

  const venue =
    [event.venue_name, event.city].filter(Boolean).join(', ') ||
    (event.format === 'online' ? 'Online event' : event.address || 'Location details TBA')

  const distanceText =
    event.distance_km !== null
      ? `${Math.round(event.distance_km * 10) / 10} km away`
      : event.format === 'online'
      ? 'Online'
      : null

  return (
    <article
      className="event-card"
      style={selected ? { borderColor: '#9275ff', outline: '2px solid #9275ff33' } : undefined}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect() } : undefined}
      aria-label={`${event.title}${selected ? ' (selected)' : ''}`}
    >
      <div className="event-image-wrap">
        <img src={style.image} alt="" className="event-image" />
        <div className="image-gradient" />
        <span className={`source-badge ${isVerified ? 'verified' : 'web'}`}>
          {isVerified ? <><CircleCheck size={12} /> Verified organizer</> : <><Compass size={12} /> Found on the web</>}
        </span>
        <span className="date-tile">
          <b>{date.split(' ')[1]?.replace(',', '') || '—'}</b>
          <small>{date.split(' ')[0]}</small>
        </span>
      </div>
      <div className="event-body">
        <div className="event-meta">
          <span style={{ color: style.accent }}>{event.category}</span>
          {distanceText && <span>{distanceText}</span>}
        </div>
        <Link href={`/events/${event.id}`} className="event-title" onClick={(e) => e.stopPropagation()}>
          {event.title}
        </Link>
        <div className="event-detail">
          <CalendarDays size={14} />
          {date}{time && ` · ${time}`}
        </div>
        <div className="event-detail">
          <MapPin size={14} />
          {venue}
        </div>
        <div className="event-footer">
          <span className={fee === 'Free' ? 'free' : ''}>{fee}</span>
          <Link
            href={`/events/${event.id}`}
            className="arrow-button"
            aria-label="Open event"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}
