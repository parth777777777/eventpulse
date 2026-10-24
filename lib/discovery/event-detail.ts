import { createClient } from '@/lib/supabase/server'

export type EventDetail = {
  id: string
  title: string
  description: string | null
  category: string
  starts_at: string
  ends_at: string | null
  timezone: string
  status: string
  format: string
  venue_name: string | null
  address: string | null
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  registration_url: string | null
  registration_deadline: string | null
  registration_status: string
  fee_amount: number | null
  currency: string
  source_attribution: string | null
  verification_status: string
  organizer_id: string | null
}

export type FetchEventResult =
  | { type: 'ok'; event: EventDetail }
  | { type: 'not_found' }
  | { type: 'not_published' }
  | { type: 'error'; message: string }

/**
 * Fetch a single published event by ID from Supabase.
 * Draft/unverified events are never returned to anonymous callers
 * because the row-level security policy on the events table enforces
 * status = 'published' for anon role.
 * We additionally check status here for defense-in-depth.
 */
export async function fetchPublishedEvent(id: string): Promise<FetchEventResult> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return { type: 'not_found' }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select(
        'id, title, description, category, starts_at, ends_at, timezone, status, format, venue_name, address, city, country, latitude, longitude, registration_url, registration_deadline, registration_status, fee_amount, currency, source_attribution, verification_status, organizer_id',
      )
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Event detail fetch error:', error.code)
      return { type: 'error', message: 'Unable to load event details.' }
    }

    if (!data) {
      return { type: 'not_found' }
    }

    // Defense-in-depth: RLS allows organizers to read their own drafts,
    // but the public detail page must only show published events.
    if (data.status !== 'published') {
      return { type: 'not_published' }
    }

    return { type: 'ok', event: data as EventDetail }
  } catch {
    return { type: 'error', message: 'Unable to load event details.' }
  }
}
