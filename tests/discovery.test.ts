import assert from 'node:assert/strict'
import test from 'node:test'

// ── Geo utilities ────────────────────────────────────────────────────────────
// Import using the compiled TS pattern the project uses (--experimental-strip-types)

import { haversineKm, isValidCoordinate } from '../lib/discovery/geo.ts'
import { parseSearchParams, buildSearchParams, buildApiUrl } from '../lib/discovery/url-state.ts'
import type { SearchState } from '../lib/discovery/types.ts'
import { DEFAULT_RADIUS_KM } from '../lib/discovery/types.ts'

// ── Haversine distance ───────────────────────────────────────────────────────

test('haversineKm: same point returns 0', () => {
  assert.equal(haversineKm(19.076, 72.877, 19.076, 72.877), 0)
})

test('haversineKm: Mumbai → Pune ≈ 120 km', () => {
  const d = haversineKm(19.076, 72.877, 18.5204, 73.8567)
  assert.ok(d > 115 && d < 125, `Expected ~120, got ${d}`)
})

test('haversineKm: points within 25 km', () => {
  // ~10 km apart
  const d = haversineKm(28.6139, 77.2090, 28.7041, 77.1025)
  assert.ok(d < 25, `Expected < 25 km, got ${d}`)
})

test('haversineKm: points outside 25 km', () => {
  // Mumbai to Nashik is more than 25 km
  const d = haversineKm(19.076, 72.877, 19.9975, 73.7898)
  assert.ok(d > 25, `Expected > 25 km, got ${d}`)
})

// ── Coordinate validation ────────────────────────────────────────────────────

test('isValidCoordinate: valid pair', () => {
  assert.equal(isValidCoordinate(19.076, 72.877), true)
})

test('isValidCoordinate: pole edge cases', () => {
  assert.equal(isValidCoordinate(90, 0), true)
  assert.equal(isValidCoordinate(-90, 0), true)
  assert.equal(isValidCoordinate(0, 180), true)
  assert.equal(isValidCoordinate(0, -180), true)
})

test('isValidCoordinate: out-of-range', () => {
  assert.equal(isValidCoordinate(91, 0), false)
  assert.equal(isValidCoordinate(-91, 0), false)
  assert.equal(isValidCoordinate(0, 181), false)
  assert.equal(isValidCoordinate(0, -181), false)
})

test('isValidCoordinate: NaN / Infinity', () => {
  assert.equal(isValidCoordinate(NaN, 0), false)
  assert.equal(isValidCoordinate(0, Infinity), false)
})

// ── URL state ────────────────────────────────────────────────────────────────

test('parseSearchParams: empty URL yields safe defaults', () => {
  const state = parseSearchParams(new URLSearchParams(''))
  assert.equal(state.lat, null)
  assert.equal(state.lng, null)
  assert.equal(state.radiusKm, DEFAULT_RADIUS_KM)
  assert.equal(state.category, null)
  assert.equal(state.from, null)
  assert.equal(state.to, null)
  assert.equal(state.keyword, '')
})

test('parseSearchParams: valid coords round-trip', () => {
  const state = parseSearchParams(new URLSearchParams('lat=19.076&lng=72.877&radius=25'))
  assert.equal(state.lat, 19.076)
  assert.equal(state.lng, 72.877)
  assert.equal(state.radiusKm, 25)
})

test('parseSearchParams: malformed lat/lng are rejected', () => {
  const state = parseSearchParams(new URLSearchParams('lat=abc&lng=xyz'))
  assert.equal(state.lat, null)
  assert.equal(state.lng, null)
})

test('parseSearchParams: out-of-range coords are rejected', () => {
  const state = parseSearchParams(new URLSearchParams('lat=200&lng=400'))
  assert.equal(state.lat, null)
  assert.equal(state.lng, null)
})

test('parseSearchParams: only one of lat/lng rejects both', () => {
  const state = parseSearchParams(new URLSearchParams('lat=19.076'))
  assert.equal(state.lat, null)
  assert.equal(state.lng, null)
})

test('parseSearchParams: invalid radius falls back to default', () => {
  const state = parseSearchParams(new URLSearchParams('radius=-5'))
  assert.equal(state.radiusKm, DEFAULT_RADIUS_KM)
})

test('parseSearchParams: radius > 100 is rejected', () => {
  const state = parseSearchParams(new URLSearchParams('radius=200'))
  assert.equal(state.radiusKm, DEFAULT_RADIUS_KM)
})

test('parseSearchParams: category and keyword preserved', () => {
  const state = parseSearchParams(new URLSearchParams('category=Design&q=hackathon'))
  assert.equal(state.category, 'Design')
  assert.equal(state.keyword, 'hackathon')
})

test('parseSearchParams: invalid date rejects from/to', () => {
  const state = parseSearchParams(new URLSearchParams('from=not-a-date&to=also-invalid'))
  assert.equal(state.from, null)
  assert.equal(state.to, null)
})

test('parseSearchParams: from > to rejects both dates', () => {
  const state = parseSearchParams(new URLSearchParams('from=2030-12-31&to=2030-01-01'))
  assert.equal(state.from, null)
  assert.equal(state.to, null)
})

test('parseSearchParams: does not silently use Mumbai coords for missing location', () => {
  const state = parseSearchParams(new URLSearchParams(''))
  assert.notEqual(state.lat, 19.076)
  assert.notEqual(state.lng, 72.877)
  assert.equal(state.lat, null)
})

// ── buildSearchParams / buildApiUrl ──────────────────────────────────────────

test('buildSearchParams: no location produces no lat/lng', () => {
  const state: SearchState = {
    lat: null, lng: null, radiusKm: DEFAULT_RADIUS_KM,
    category: null, from: null, to: null, keyword: '', locationLabel: null,
  }
  const params = buildSearchParams(state)
  assert.equal(params.has('lat'), false)
  assert.equal(params.has('lng'), false)
})

test('buildSearchParams: round-trips full state', () => {
  const state: SearchState = {
    lat: 28.6139, lng: 77.2090, radiusKm: 50,
    category: 'AI & ML', from: null, to: null, keyword: 'robotics',
    locationLabel: 'New Delhi',
  }
  const params = buildSearchParams(state)
  const restored = parseSearchParams(params)
  assert.equal(restored.lat, 28.6139)
  assert.equal(restored.lng, 77.2090)
  assert.equal(restored.radiusKm, 50)
  assert.equal(restored.category, 'AI & ML')
  assert.equal(restored.keyword, 'robotics')
  assert.equal(restored.locationLabel, 'New Delhi')
})

test('buildApiUrl: includes lat/lng/radiusKm when location set', () => {
  const state: SearchState = {
    lat: 19.076, lng: 72.877, radiusKm: 25,
    category: null, from: null, to: null, keyword: '', locationLabel: null,
  }
  const url = buildApiUrl(state)
  assert.ok(url.includes('lat=19.076'), `Missing lat: ${url}`)
  assert.ok(url.includes('lng=72.877'), `Missing lng: ${url}`)
  assert.ok(url.includes('radiusKm=25'), `Missing radiusKm: ${url}`)
})

test('buildApiUrl: omits lat/lng when no location', () => {
  const state: SearchState = {
    lat: null, lng: null, radiusKm: DEFAULT_RADIUS_KM,
    category: null, from: null, to: null, keyword: '', locationLabel: null,
  }
  const url = buildApiUrl(state)
  assert.ok(!url.includes('lat='), `Should not have lat: ${url}`)
  assert.ok(!url.includes('lng='), `Should not have lng: ${url}`)
  // radiusKm also omitted when no location (RPC ignores it without coords)
  assert.ok(!url.includes('radiusKm='), `Should not have radiusKm without location: ${url}`)
})

test('buildApiUrl: includes keyword param', () => {
  const state: SearchState = {
    lat: null, lng: null, radiusKm: DEFAULT_RADIUS_KM,
    category: null, from: null, to: null, keyword: 'design', locationLabel: null,
  }
  const url = buildApiUrl(state)
  assert.ok(url.includes('keyword=design'), `Missing keyword: ${url}`)
})
