import type { GeocodedPlace } from './types'
import { isValidCoordinate } from './geo'

const MIN_REQUEST_INTERVAL_MS = 1000
const MAX_CACHE_ENTRIES = 100
const resultCache = new Map<string, GeocodedPlace | null>()
let nextRequestAt = 0

/**
 * Geocode a place name using Nominatim (OpenStreetMap).
 *
 * Provider: Nominatim (https://nominatim.openstreetmap.org)
 * License: ODbL — results must attribute OpenStreetMap contributors.
 * Usage: The public service requires no more than 1 request per second per
 * application, a descriptive User-Agent, and caching of repeated queries.
 * The public endpoint is policy-limited and not a production SLA; use a
 * self-hosted or commercial provider for higher-volume production traffic.
 * Keys: None required.
 *
 * NOTE: Nominatim must only be called server-side or from a proxy
 * to control the User-Agent and avoid CORS issues in some browsers.
 */
export async function geocodePlace(
  query: string,
): Promise<GeocodedPlace | null> {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!normalizedQuery || normalizedQuery.length > 300) return null
  if (resultCache.has(normalizedQuery)) return resultCache.get(normalizedQuery) ?? null

  const now = Date.now()
  const requestAt = Math.max(now, nextRequestAt)
  nextRequestAt = requestAt + MIN_REQUEST_INTERVAL_MS
  if (requestAt > now) {
    await new Promise((resolve) => setTimeout(resolve, requestAt - now))
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', normalizedQuery)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '0')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'EventPulse/1.0 (https://eventpulse.app)',
        Accept: 'application/json',
      },
      // Nominatim is external — enforce a reasonable timeout via AbortSignal
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null

    const results = await res.json() as Array<{
      lat: string
      lon: string
      display_name: string
    }>

    if (!results.length) return null

    const first = results[0]
    const lat = Number(first.lat)
    const lng = Number(first.lon)
    const result =
      typeof first.display_name === 'string' &&
      isValidCoordinate(lat, lng)
        ? { lat, lng, label: first.display_name }
        : null

    if (resultCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = resultCache.keys().next().value
      if (oldestKey) resultCache.delete(oldestKey)
    }
    resultCache.set(normalizedQuery, result)
    return result
  } catch {
    return null
  }
}
