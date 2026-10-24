'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getSafeRedirectPath } from '@/lib/auth/redirects'
import { createClient } from '@/lib/supabase/browser'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('error')
    if (errorCode === 'confirmation_failed') {
      setError('That confirmation link is invalid or expired. Request a new one and try again.')
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const next = getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))
    const { error: loginError } = await createClient().auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('We could not sign you in. Check your email and password, then try again.')
      setIsSubmitting(false)
      return
    }

    window.location.assign(next)
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Link href="/" className="auth-brand">event<span>pulse</span></Link>
        <p className="section-kicker">Welcome back</p>
        <h1 id="login-title">Sign in</h1>
        <p className="auth-subtitle">Pick up where you left off and keep discovering what is happening nearby.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">New to EventPulse? <Link href="/signup">Create an account</Link></p>
      </section>
    </main>
  )
}
