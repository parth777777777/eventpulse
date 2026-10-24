'use client'

import Link from 'next/link'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/browser'
import { getSafeRedirectPath } from '@/lib/auth/redirects'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const next = getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('next', next)
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callback.toString() },
    })

    if (signupError) {
      setError('We could not create your account. Check your details and try again.')
      setIsSubmitting(false)
      return
    }

    if (data.session) {
      window.location.assign(next)
      return
    }

    setMessage('Account created. Check your email to confirm your address before signing in.')
    setIsSubmitting(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <Link href="/" className="auth-brand">event<span>pulse</span></Link>
        <p className="section-kicker">Join EventPulse</p>
        <h1 id="signup-title">Create your account</h1>
        <p className="auth-subtitle">Save opportunities and keep your discovery experience in sync.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
          <label htmlFor="signup-confirmation">Confirm password</label>
          <input id="signup-confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="button primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
    </main>
  )
}
