'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Search, X } from 'lucide-react'
import { isValidCoordinate } from '@/lib/discovery/geo'
import type { SearchState } from '@/lib/discovery/types'

interface LocationPickerProps {
  state: SearchState
  onApply: (update: Partial<SearchState>) => void
  onClose: () => void
}

type GeoStatus =
  | { type: 'idle' }
  | { type: 'requesting' }
  | { type: 'denied'; message: string }
  | { type: 'unavailable'; message: string }
  | { type: 'ok'; lat: number; lng: number; label: string }

type GeocodeStatus =
  | { type: 'idle' }
  | { type: 'searching' }
  | { type: 'found'; lat: number; lng: number; label: string }
  | { type: 'not_found' }
  | { type: 'error' }

export default function LocationPicker({ state, onApply, onClose }: LocationPickerProps) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>({ type: 'idle' })
  const [placeQuery, setPlaceQuery] = useState('')
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>({ type: 'idle' })
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  function requestGeolocation() {
    if (!('geolocation' in navigator)) {
      setGeoStatus({ type: 'unavailable', message: 'Geolocation is not supported by your browser.' })
      return
    }

    setGeoStatus({ type: 'requesting' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        if (!isValidCoordinate(lat, lng)) {
          setGeoStatus({ type: 'unavailable', message: 'Received invalid coordinates from browser.' })
          return
        }
        const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setGeoStatus({ type: 'ok', lat, lng, label: 'Current location' })
        onApply({ lat, lng, locationLabel: 'Current location' })
        onClose()
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus({
            type: 'denied',
            message: 'Location access denied. Search for a place below to set your location.',
          })
        } else {
          setGeoStatus({
            type: 'unavailable',
            message: 'Unable to get your location. Search for a place below.',
          })
        }
      },
      { timeout: 10000, maximumAge: 300_000 },
    )
  }

  async function searchPlace(e: React.FormEvent) {
    e.preventDefault()
    const q = placeQuery.trim()
    if (!q) return

    setGeocodeStatus({ type: 'searching' })

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const body = await res.json() as { data?: { lat: number; lng: number; label: string } | null }

      if (!body.data) {
        setGeocodeStatus({ type: 'not_found' })
        return
      }

      const { lat, lng, label } = body.data
      if (!isValidCoordinate(lat, lng)) {
        setGeocodeStatus({ type: 'error' })
        return
      }

      setGeocodeStatus({ type: 'found', lat, lng, label })
    } catch {
      setGeocodeStatus({ type: 'error' })
    }
  }

  function applyGeocode() {
    if (geocodeStatus.type !== 'found') return
    onApply({ lat: geocodeStatus.lat, lng: geocodeStatus.lng, locationLabel: geocodeStatus.label })
    onClose()
  }

  function clearLocation() {
    onApply({ lat: null, lng: null, locationLabel: null })
    onClose()
  }

  const currentLabel = state.locationLabel ?? (state.lat !== null ? 'Custom location' : null)

  return (
    <div className="location-popover" role="dialog" aria-label="Choose your search location">
      <div className="popover-header">
        <b>Choose your location</b>
        <button onClick={onClose} aria-label="Close location picker">
          <X size={16} />
        </button>
      </div>

      {currentLabel && (
        <div className="recent-location" style={{ marginBottom: 10 }}>
          <MapPin size={15} />
          <span style={{ flex: 1, fontSize: 11 }}>{currentLabel}</span>
          <button
            style={{ background: 'transparent', border: 0, color: '#88889a', fontSize: 10, cursor: 'pointer' }}
            onClick={clearLocation}
            aria-label="Clear location"
          >
            Clear
          </button>
        </div>
      )}

      {/* Geolocation */}
      <button
        className="detect-location"
        onClick={requestGeolocation}
        disabled={geoStatus.type === 'requesting'}
        aria-busy={geoStatus.type === 'requesting'}
      >
        <Navigation size={15} />
        {geoStatus.type === 'requesting' ? 'Detecting…' : 'Use my current location'}
      </button>

      {(geoStatus.type === 'denied' || geoStatus.type === 'unavailable') && (
        <p role="alert" style={{ fontSize: 10, color: '#e07070', margin: '8px 0' }}>
          {geoStatus.message}
        </p>
      )}

      {/* Place search */}
      <form onSubmit={searchPlace} style={{ marginTop: 14 }}>
        <label style={{ color: '#77788a', fontSize: 9, display: 'block', marginBottom: 6 }}>
          Search a city or place
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={searchRef}
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            placeholder="e.g. Bengaluru, India"
            style={{
              flex: 1,
              background: '#121320',
              border: '1px solid rgba(255,255,255,.09)',
              color: '#fff',
              outline: 0,
              padding: '9px 10px',
              borderRadius: 5,
              fontSize: 11,
            }}
            aria-label="Search place"
          />
          <button
            type="submit"
            disabled={geocodeStatus.type === 'searching' || !placeQuery.trim()}
            style={{
              background: '#9275ff',
              border: 0,
              color: '#fff',
              borderRadius: 5,
              padding: '9px 11px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-label="Search"
          >
            <Search size={14} />
          </button>
        </div>
      </form>

      {geocodeStatus.type === 'searching' && (
        <p style={{ fontSize: 10, color: '#88889a', margin: '8px 0' }}>Searching…</p>
      )}
      {geocodeStatus.type === 'not_found' && (
        <p role="alert" style={{ fontSize: 10, color: '#e07070', margin: '8px 0' }}>
          Place not found. Try a different search.
        </p>
      )}
      {geocodeStatus.type === 'error' && (
        <p role="alert" style={{ fontSize: 10, color: '#e07070', margin: '8px 0' }}>
          Geocoding failed. Please try again.
        </p>
      )}
      {geocodeStatus.type === 'found' && (
        <div style={{ marginTop: 10 }}>
          <div className="recent-location">
            <MapPin size={15} />
            <span style={{ flex: 1, fontSize: 10, color: '#b0b0c0', lineHeight: 1.4 }}>
              {geocodeStatus.label}
            </span>
          </div>
          <button
            className="button primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 11 }}
            onClick={applyGeocode}
          >
            Search here
          </button>
        </div>
      )}

      <p style={{ fontSize: 9, color: '#55566a', marginTop: 14, lineHeight: 1.5 }}>
        Geocoding by{' '}
        <a
          href="https://nominatim.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#77789a' }}
        >
          Nominatim
        </a>
        {' '}· © OpenStreetMap contributors
      </p>
    </div>
  )
}
