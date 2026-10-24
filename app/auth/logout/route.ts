import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    return NextResponse.json({ error: 'Unable to sign out' }, { status: 500 })
  }
  return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: NextRequest) {
  return GET(request)
}
