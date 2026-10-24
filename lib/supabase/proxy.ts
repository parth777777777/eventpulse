import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getLoginRedirectPath } from '@/lib/auth/redirects'
import { isProtectedPath } from '@/lib/auth/routes'
import { getSupabaseConfig } from './config'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })
  const { url, publishableKey } = getSupabaseConfig()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`
    const redirectResponse = NextResponse.redirect(
      new URL(getLoginRedirectPath(destination), request.url),
    )
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      redirectResponse.headers.set('set-cookie', setCookie)
    }
    return redirectResponse
  }

  return response
}
