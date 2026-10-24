import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSafeRedirectPath } from '@/lib/auth/redirects'
import { getSupabaseConfig } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const destination = getSafeRedirectPath(request.nextUrl.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=confirmation_failed', request.url))
  }

  const response = NextResponse.redirect(new URL(destination, request.url))
  const { url, publishableKey } = getSupabaseConfig()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=confirmation_failed', request.url))
  }

  return response
}
