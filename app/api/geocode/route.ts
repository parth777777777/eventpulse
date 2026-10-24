import { NextResponse } from 'next/server'
import { geocodePlace } from '@/lib/discovery/geocode'

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'q parameter is required.' }, { status: 400 })
  }

  if (q.length > 300) {
    return NextResponse.json({ error: 'Query too long.' }, { status: 400 })
  }

  const result = await geocodePlace(q)

  if (!result) {
    return NextResponse.json({ data: null })
  }

  return NextResponse.json({ data: result })
}
