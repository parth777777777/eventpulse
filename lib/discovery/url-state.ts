'use client'

import type { SearchState } from './types.ts'
import { DEFAULT_RADIUS_KM } from './types.ts'

/**
 * Parse discovery search state from URL search parameters.
 * Invalid or out-of-range values are silently replaced with safe defaults.
 * The caller must never receive a state that would produce an invalid API request.
 */
export function parseSearchParams(params: URLSearchParams): SearchState {
  const lat = parseFiniteNumber(params.get('lat'))
  const lng = parseFiniteNumber(params.get('lng'))

  // Both must be present and in range, or neither is used.
  const validCoords =
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180

  const rawRadius = parseFiniteNumber(params.get('radius'))
  const radiusKm =
    rawRadius !== null && rawRadius > 0 && rawRadius <= 100
      ? rawRadius
      : DEFAULT_RADIUS_KM

  const category = params.get('category')?.trim() || null
  const from = parseDateParam(params.get('from'))
  const to = parseDateParam(params.get('to'))
  const keyword = params.get('q')?.trim() ?? ''
  const locationLabel = params.get('loc')?.trim() || null

  // Ensure from <= to
  const validDateRange =
    !from || !to || new Date(from) <= new Date(to)

  return {
    lat: validCoords ? lat : null,
    lng: validCoords ? lng : null,
    radiusKm,
    category: category && category.length <= 100 ? category : null,
    from: validDateRange ? from : null,
    to: validDateRange ? to : null,
    keyword: keyword.slice(0, 200),
    locationLabel,
  }
}

/**
 * Serialize search state into URL query parameters.
 * Omits null/empty values so URLs stay readable.
 */
export function buildSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams()

  if (state.lat !== null && state.lng !== null) {
    params.set('lat', state.lat.toFixed(6))
    params.set('lng', state.lng.toFixed(6))
  }

  if (state.radiusKm !== DEFAULT_RADIUS_KM) {
    params.set('radius', String(state.radiusKm))
  }

  if (state.category) {
    params.set('category', state.category)
  }

  if (state.from) {
    params.set('from', state.from)
  }

  if (state.to) {
    params.set('to', state.to)
  }

  if (state.keyword) {
    params.set('q', state.keyword)
  }

  if (state.locationLabel) {
    params.set('loc', state.locationLabel)
  }

  return params
}

/**
 * Build the /api/events query string from the active search state.
 */
export function buildApiUrl(state: SearchState): string {
  const params = new URLSearchParams()

  if (state.lat !== null && state.lng !== null) {
    params.set('lat', String(state.lat))
    params.set('lng', String(state.lng))
    params.set('radiusKm', String(state.radiusKm))
  }

  if (state.category) {
    params.set('category', state.category)
  }

  if (state.from) {
    params.set('from', state.from)
  }

  if (state.to) {
    params.set('to', state.to)
  }

  if (state.keyword) {
    params.set('keyword', state.keyword)
  }

  params.set('limit', '50')

  return `/api/events?${params.toString()}`
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseFiniteNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseDateParam(raw: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
