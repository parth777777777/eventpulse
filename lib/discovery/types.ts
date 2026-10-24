/**
 * Canonical event type for discovery, cards, map markers, and detail pages.
 * All fields come from the nearby_published_events RPC response.
 */
export type DiscoveryEvent = {
  id: string
  title: string
  description: string | null
  category: string
  starts_at: string
  ends_at: string | null
  timezone: string
  format: 'in_person' | 'online' | 'hybrid' | string
  venue_name: string | null
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  registration_url: string | null
  fee_amount: number | null
  currency: string
  source_attribution: string | null
  verification_status: string
  distance_km: number | null
}

/** Search state that drives discovery on both home and /discover pages. */
export type SearchState = {
  lat: number | null
  lng: number | null
  radiusKm: number
  category: string | null
  from: string | null
  to: string | null
  keyword: string
  locationLabel: string | null
}

/** Geocoding result from a place search. */
export type GeocodedPlace = {
  lat: number
  lng: number
  label: string
}

export const DEFAULT_RADIUS_KM = 25
