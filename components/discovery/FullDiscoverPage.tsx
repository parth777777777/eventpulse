'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ChevronRight,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { DiscoveryCard } from './DiscoveryCard'
import LocationPicker from './LocationPicker'
import { useDiscovery } from '@/lib/discovery/use-discovery'
import type { SearchState } from '@/lib/discovery/types'
import { DEFAULT_RADIUS_KM } from '@/lib/discovery/types'
import { parseSearchParams, buildSearchParams } from '@/lib/discovery/url-state'
import type { DiscoveryEvent } from '@/lib/discovery/types'

const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 320,
        background: '#121322',
        display: 'grid',
        placeItems: 'center',
        color: '#55566a',
        fontSize: 12,
      }}
    >
      Loading map…
    </div>
  ),
})

const CATEGORIES = ['All', 'AI & ML', 'Design', 'Startups', 'Robotics', 'Culture']
const DATE_PRESETS = [
  { label: 'Any date', from: null, to: null },
  { label: 'Today', from: todayStart(), to: todayEnd() },
  { label: 'This week', from: todayStart(), to: weekEnd() },
  { label: 'This month', from: todayStart(), to: monthEnd() },
]

function todayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}
function todayEnd() {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString()
}
function weekEnd() {
  const d = new Date()
  d.setDate(d.getDate() + (7 - d.getDay()))
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}
function monthEnd() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

interface FullDiscoverPageProps {
  /** If true, show in compact "home page section" mode (no full toolbar/map shell) */
  compact?: boolean
  /** If true, show map + cards side-by-side */
  withMap?: boolean
}

export default function FullDiscoverPage({ compact = false, withMap = true }: FullDiscoverPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse initial state from URL
  const [searchState, setSearchStateRaw] = useState<SearchState>(() =>
    parseSearchParams(searchParams),
  )

  // Local UI state
  const [locationOpen, setLocationOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState(searchState.keyword)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Push search state changes to URL
  const setSearchState = useCallback(
    (update: Partial<SearchState> | ((prev: SearchState) => SearchState)) => {
      setSearchStateRaw((prev) => {
        const next = typeof update === 'function' ? update(prev) : { ...prev, ...update }
        const qs = buildSearchParams(next).toString()
        router.replace(`?${qs}`, { scroll: false })
        return next
      })
    },
    [router],
  )

  // Sync URL → state on external navigation (browser back/forward)
  useEffect(() => {
    const next = parseSearchParams(searchParams)
    setSearchStateRaw(next)
    setKeywordInput(next.keyword)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // Debounced keyword
  function handleKeywordChange(value: string) {
    setKeywordInput(value)
    if (keywordTimer.current) clearTimeout(keywordTimer.current)
    keywordTimer.current = setTimeout(() => {
      setSearchState((prev) => ({ ...prev, keyword: value.trim() }))
    }, 400)
  }

  const { status, retry } = useDiscovery(searchState)
  const events: DiscoveryEvent[] = status.type === 'ok' ? status.events : []

  // Events with valid coordinates (for map)
  const mappableEvents = useMemo(
    () => events.filter((e) => e.latitude !== null && e.longitude !== null),
    [events],
  )

  const activeCategory = searchState.category ?? 'All'
  const activeDateLabel = useMemo(() => {
    if (!searchState.from && !searchState.to) return 'Any date'
    const preset = DATE_PRESETS.find(
      (p) => p.from === searchState.from && p.to === searchState.to,
    )
    return preset?.label ?? 'Custom range'
  }, [searchState.from, searchState.to])

  const locationLabel = searchState.locationLabel ?? (searchState.lat !== null ? 'Custom location' : 'No location set')

  function setCategory(cat: string) {
    setSearchState({ category: cat === 'All' ? null : cat })
  }

  function setDatePreset(preset: (typeof DATE_PRESETS)[0]) {
    setSearchState({ from: preset.from, to: preset.to })
  }

  function handleRadiusExpand() {
    setSearchState((prev) => ({ ...prev, radiusKm: Math.min(prev.radiusKm * 2, 100) }))
  }

  function clearFilters() {
    setSearchState((prev) => ({
      ...prev,
      category: null,
      from: null,
      to: null,
      keyword: '',
    }))
    setKeywordInput('')
  }

  const hasActiveFilters =
    searchState.category !== null ||
    searchState.from !== null ||
    searchState.to !== null ||
    searchState.keyword !== ''

  return (
    <div>
      {/* Toolbar */}
      <div className="page-toolbar">
        {/* Location pill */}
        <button
          className="location-pill"
          onClick={() => setLocationOpen(!locationOpen)}
          style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '8px 11px' }}
          aria-label={`Current search location: ${locationLabel}`}
          aria-expanded={locationOpen}
        >
          <MapPin size={14} />
          <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locationLabel}
          </span>
          {searchState.lat !== null && (
            <span style={{ fontSize: 9, color: '#88889a' }}>{searchState.radiusKm} km</span>
          )}
        </button>

        {/* Keyword search */}
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} />
          <input
            value={keywordInput}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="Search events, skills, or interests"
            aria-label="Search events"
          />
          {keywordInput && (
            <button
              style={{ background: 'transparent', border: 0, color: '#88889a', cursor: 'pointer' }}
              onClick={() => { setKeywordInput(''); setSearchState((p) => ({ ...p, keyword: '' })) }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          className="filter-button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          <Filter size={15} />
          Filters
          {hasActiveFilters && (
            <span style={{ background: '#9275ff', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'grid', placeItems: 'center', fontSize: 8 }}>
              ●
            </span>
          )}
        </button>
      </div>

      {/* Location picker popover */}
      {locationOpen && (
        <LocationPicker
          state={searchState}
          onApply={(update) => setSearchState(update)}
          onClose={() => setLocationOpen(false)}
        />
      )}

      {/* Filter panel */}
      {filtersOpen && (
        <div
          style={{
            background: '#1b1c2c',
            border: '1px solid #3a3a53',
            borderRadius: 9,
            padding: 18,
            marginBottom: 18,
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          {/* Category */}
          <div>
            <p style={{ color: '#77788a', fontSize: 9, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Category
            </p>
            <div className="filter-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={activeCategory === cat ? 'selected' : ''}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p style={{ color: '#77788a', fontSize: 9, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Date
            </p>
            <div className="filter-tabs">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={activeDateLabel === preset.label ? 'selected' : ''}
                  onClick={() => setDatePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div>
            <p style={{ color: '#77788a', fontSize: 9, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Radius
            </p>
            <div className="filter-tabs">
              {[10, 25, 50, 100].map((r) => (
                <button
                  key={r}
                  className={searchState.radiusKm === r ? 'selected' : ''}
                  onClick={() => setSearchState({ radiusKm: r })}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              style={{ alignSelf: 'flex-end', background: 'transparent', border: '1px solid rgba(255,255,255,.09)', borderRadius: 6, color: '#9e99d1', fontSize: 10, padding: '8px 12px', cursor: 'pointer' }}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Category quick-filter tabs (when filter panel is closed) */}
      {!filtersOpen && (
        <div className="filter-row" style={{ marginBottom: 18 }}>
          <div className="filter-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={activeCategory === cat ? 'selected' : ''}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: '#55566a' }}>
            {activeDateLabel !== 'Any date' && `${activeDateLabel} · `}
            {searchState.radiusKm !== DEFAULT_RADIUS_KM && `${searchState.radiusKm} km`}
          </span>
        </div>
      )}

      {/* Main content: cards + map */}
      <div
        style={
          withMap
            ? { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 440px', gap: 18, alignItems: 'start' }
            : undefined
        }
        className={withMap ? 'discover-layout' : ''}
      >
        {/* Event list */}
        <div>
          {status.type === 'loading' && (
            <div className="empty-results" aria-live="polite" aria-busy="true">
              Loading events…
            </div>
          )}

          {status.type === 'error' && (
            <div
              className="empty-results"
              role="alert"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <AlertTriangle size={28} style={{ color: '#e07070' }} />
              <strong style={{ color: '#e07070' }}>Unable to load events</strong>
              <p style={{ margin: 0, fontSize: 12 }}>{status.message}</p>
              <button className="button secondary" onClick={retry}>
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          )}

          {status.type === 'empty' && (
            <div
              className="empty-results"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <MapPin size={28} style={{ color: '#9275ff' }} />
              <strong>No events match your search</strong>
              {searchState.lat !== null && searchState.radiusKm < 100 && (
                <>
                  <p style={{ margin: 0, fontSize: 12, color: '#88889a' }}>
                    Try expanding the search radius to {Math.min(searchState.radiusKm * 2, 100)} km.
                  </p>
                  <button className="button secondary" onClick={handleRadiusExpand}>
                    Expand to {Math.min(searchState.radiusKm * 2, 100)} km
                  </button>
                </>
              )}
              {hasActiveFilters && (
                <button className="button secondary" style={{ fontSize: 11 }} onClick={clearFilters}>
                  Clear filters
                </button>
              )}
              {searchState.lat === null && (
                <p style={{ margin: 0, fontSize: 12, color: '#88889a' }}>
                  Set a location to find nearby events.
                </p>
              )}
            </div>
          )}

          {status.type === 'ok' && (
            <>
              <p style={{ fontSize: 10, color: '#55566a', margin: '0 0 14px' }}>
                {events.length} event{events.length !== 1 ? 's' : ''} found
                {searchState.lat !== null && ` within ${searchState.radiusKm} km`}
              </p>
              <div className={compact ? 'event-grid' : 'event-grid'}>
                {events.map((event) => (
                  <DiscoveryCard
                    key={event.id}
                    event={event}
                    selected={selectedEventId === event.id}
                    onSelect={() => setSelectedEventId(event.id === selectedEventId ? null : event.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Map */}
        {withMap && (
          <div
            style={{
              position: 'sticky',
              top: 90,
              height: 520,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid #30304a',
            }}
            aria-label="Event locations map"
          >
            {status.type === 'error' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#121322',
                  color: '#55566a',
                  fontSize: 12,
                }}
              >
                Map unavailable
              </div>
            ) : (
              <EventMap
                events={mappableEvents}
                originLat={searchState.lat}
                originLng={searchState.lng}
                selectedId={selectedEventId}
                onSelectEvent={(id) => setSelectedEventId(id === selectedEventId ? null : id)}
                className="event-map-fill"
              />
            )}
          </div>
        )}
      </div>

      {/* Attribution for map tiles */}
      {withMap && (
        <p style={{ fontSize: 9, color: '#3a3a50', textAlign: 'right', margin: '8px 0 0' }}>
          Map: © <a href="https://www.openstreetmap.org/copyright" style={{ color: '#55566a' }}>OpenStreetMap</a> contributors
        </p>
      )}
    </div>
  )
}
