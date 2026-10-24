import type { GeocodedPlace } from './types'

/**
 * Geocode a place name using Nominatim (OpenStreetMap).
 *
 * Provider: Nominatim (https://nominatim.openstreetmap.org)
 * License: ODbL — results must attribute OpenStreetMap contributors.
 * Usage: Max 1 req/s from a single IP; no commercial rate-limiting for
 *        light traffic. Identify your app via the User-Agent header.
 * Cost: Free.
 * Keys: None required.
 *
 * NOTE: Nominatim must only be called server-side or from a proxy
 * to control the User-Agent and avoid CORS issues in some browsers.
 */
export async function geocodePlace(
  query: string,
): Promise<GeocodedPlace | null> {
  if (!query.trim()) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
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
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      label: first.display_name,
    }
  } catch {
    return null
  }
}
