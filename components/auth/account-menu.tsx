'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/browser'

export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  if (!email) {
    return <Link className="account-link" href="/login">Sign in</Link>
  }

  return (
    <div className="account-menu">
      <span className="account-email" title={email}>{email}</span>
      <a className="account-link" href="/auth/logout">Sign out</a>
    </div>
  )
}
