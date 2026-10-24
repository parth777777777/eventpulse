
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

function parseNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseDate(value: string | null): string | null | undefined {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toISOString()
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams

  const lat = parseNumber(params.get('lat'))
  const lng = parseNumber(params.get('lng'))
  const rawRadius = parseNumber(params.get('radiusKm'))
  const rawLimit = parseNumber(params.get('limit'))

  if (
    (params.has('lat') && lat === null) ||
    (params.has('lng') && lng === null) ||
    ((lat === null) !== (lng === null))
  ) {
    return NextResponse.json(
      { error: 'Provide valid latitude and longitude together.' },
      { status: 400 },
    )
  }

  if (
    (lat !== null && (lat < -90 || lat > 90)) ||
    (lng !== null && (lng < -180 || lng > 180))
  ) {
    return NextResponse.json(
      { error: 'Coordinates are outside valid ranges.' },
      { status: 400 },
    )
  }

  if (
    rawRadius !== null &&
    (rawRadius <= 0 || rawRadius > 100)
  ) {
    return NextResponse.json(
      { error: 'radiusKm must be greater than 0 and at most 100.' },
      { status: 400 },
    )
  }

  if (
    rawLimit !== null &&
    (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100)
  ) {
    return NextResponse.json(
      { error: 'limit must be an integer from 1 to 100.' },
      { status: 400 },
    )
  }

  const from = parseDate(params.get('from'))
  const to = parseDate(params.get('to'))

  if (from === undefined || to === undefined) {
    return NextResponse.json(
      { error: 'Invalid date filter.' },
      { status: 400 },
    )
  }

  if (from && to && new Date(from) > new Date(to)) {
    return NextResponse.json(
      { error: '"from" must be before or equal to "to".' },
      { status: 400 },
    )
  }

  const category = params.get('category')?.trim() || null

  if (category && category.length > 100) {
    return NextResponse.json(
      { error: 'Category is too long.' },
      { status: 400 },
    )
  }

  const keyword = params.get('keyword')?.trim() || null

  if (keyword && keyword.length > 200) {
    return NextResponse.json(
      { error: 'Keyword is too long.' },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'nearby_published_events',
      {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: rawRadius ?? 25,
        p_category: category,
        p_from: from,
        p_to: to,
        p_limit: rawLimit ?? 50,
      },
    )

    if (error) {
      console.error('Event discovery query failed:', error.code)

      return NextResponse.json(
        { error: 'Unable to load events right now.' },
        { status: 500 },
      )
    }

    // Apply keyword filtering in JS since the RPC doesn't support it.
    // Keyword matches title, description, category, venue_name, or city.
    let rows = data ?? []
    if (keyword) {
      const kw = keyword.toLowerCase()
      rows = rows.filter((row: Record<string, unknown>) => {
        const searchText = [
          row.title,
          row.description,
          row.category,
          row.venue_name,
          row.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchText.includes(kw)
      })
    }

    return NextResponse.json({
      data: rows,
      meta: {
        count: rows.length,
        radiusKm: rawRadius ?? 25,
        locationProvided: lat !== null && lng !== null,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to load events right now.' },
      { status: 500 },
    )
  }
}
