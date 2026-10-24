import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    }

    const { data: organizer, error: organizerError } = await supabase
      .from('organizers')
      .select('id')
      .eq('owner_id', user.id)
      .eq('verification_status', 'verified')
      .maybeSingle()

    if (organizerError || !organizer) {
      return NextResponse.json(
        { error: 'A verified organizer profile is required to create events.' },
        { status: 403 },
      )
    }

    let body: Record<string, unknown>
    try {
      const parsed: unknown = await request.json()
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid body')
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const readText = (key: string, max: number) => {
      const value = body[key]
      return typeof value === 'string' && value.trim().length <= max
        ? value.trim()
        : ''
    }

    const title = readText('title', 160)
    const category = readText('category', 100)
    const description = readText('description', 5000)
    const format = readText('format', 20)
    const rawStart = readText('starts_at', 100)
    const rawEnd = readText('ends_at', 100)
    const rawDeadline = readText('registration_deadline', 100)
    const venue = readText('venue', 200)
    const address = readText('address', 300)
    const city = readText('city', 120)
    const registrationUrl = readText('registration_url', 1000)

    const start = new Date(rawStart)
    const end = rawEnd ? new Date(rawEnd) : null
    const deadline = rawDeadline ? new Date(rawDeadline) : null

    if (title.length < 3 || !category || !rawStart || Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Provide an event title, category, and valid start date.' },
        { status: 400 },
      )
    }

    if (!['in_person', 'online', 'hybrid'].includes(format)) {
      return NextResponse.json({ error: 'Invalid event format.' }, { status: 400 })
    }

    if (end && (Number.isNaN(end.getTime()) || end < start)) {
      return NextResponse.json(
        { error: 'End date must be after the start date.' },
        { status: 400 },
      )
    }

    if (deadline && Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: 'Invalid registration deadline.' }, { status: 400 })
    }

    const parseCoordinate = (key: string): number | null | undefined => {
      const value = body[key]
      if (value === '' || value === null || value === undefined) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }

    const latitude = parseCoordinate('latitude')
    const longitude = parseCoordinate('longitude')

    if (
      latitude === undefined ||
      longitude === undefined ||
      (latitude !== null && (latitude < -90 || latitude > 90)) ||
      (longitude !== null && (longitude < -180 || longitude > 180)) ||
      ((latitude === null) !== (longitude === null))
    ) {
      return NextResponse.json(
        { error: 'Provide valid latitude and longitude together.' },
        { status: 400 },
      )
    }

    if (format !== 'online' && (latitude === null || longitude === null)) {
      return NextResponse.json(
        { error: 'In-person and hybrid events require latitude and longitude.' },
        { status: 400 },
      )
    }

    const rawFee = body.fee_amount
    const fee = rawFee === '' || rawFee === null || rawFee === undefined
      ? null
      : Number(rawFee)

    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) {
      return NextResponse.json({ error: 'Fee must be zero or greater.' }, { status: 400 })
    }

    if (registrationUrl) {
      try {
        const url = new URL(registrationUrl)
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid protocol')
      } catch {
        return NextResponse.json(
          { error: 'Registration URL must be a valid HTTP(S) URL.' },
          { status: 400 },
        )
      }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        organizer_id: organizer.id,
        title,
        description: description || null,
        category,
        starts_at: start.toISOString(),
        ends_at: end?.toISOString() ?? null,
        timezone: 'Asia/Kolkata',
        format,
        venue_name: venue || null,
        address: address || null,
        city: city || null,
        country: 'India',
        latitude,
        longitude,
        registration_url: registrationUrl || null,
        registration_deadline: deadline?.toISOString() ?? null,
        fee_amount: fee,
        currency: 'INR',
      })
      .select('id, title, status, verification_status, created_at')
      .single()

if (error) {
  console.error('Event creation failed:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
      return NextResponse.json(
        { error: 'Unable to create event. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ event: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Unable to create event right now.' },
      { status: 500 },
    )
  }
}
