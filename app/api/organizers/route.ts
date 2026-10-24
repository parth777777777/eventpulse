import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('organizers')
    .select('id, name, description, verification_status, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Organizer lookup failed:', error.code)
    return NextResponse.json(
      { error: 'Unable to load organizer application.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ organizer: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const description =
    typeof input.description === 'string' ? input.description.trim() : ''

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: 'Organization name must be 2–120 characters.' },
      { status: 400 },
    )
  }

  if (description.length > 2000) {
    return NextResponse.json(
      { error: 'Description must be 2,000 characters or fewer.' },
      { status: 400 },
    )
  }

  const { data: existing, error: lookupError } = await supabase
    .from('organizers')
    .select('id, verification_status')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error('Organizer duplicate check failed:', lookupError.code)
    return NextResponse.json(
      { error: 'Unable to check existing applications.' },
      { status: 500 },
    )
  }

  if (existing) {
    return NextResponse.json(
      {
        error: 'You already have an organizer profile or application.',
        organizer: existing,
      },
      { status: 409 },
    )
  }

  // The database defaults verification_status to "unverified".
  // Never accept owner_id or verification_status from the request body.
  const { data, error } = await supabase
    .from('organizers')
    .insert({
      owner_id: user.id,
      name,
      description: description || null,
    })
    .select('id, name, description, verification_status, created_at')
    .single()

  if (error) {
    console.error('Organizer application failed:', error.code)
    return NextResponse.json(
      { error: 'Unable to submit your application.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ organizer: data }, { status: 201 })
}
