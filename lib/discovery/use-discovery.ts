'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DiscoveryEvent, SearchState } from './types'
import { buildApiUrl } from './url-state'

export type DiscoveryStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'ok'; events: DiscoveryEvent[] }
  | { type: 'empty' }
  | { type: 'error'; message: string }

/**
 * Fetches discovery results whenever searchState changes.
 * Cancels in-flight requests when state changes (no race conditions).
 * Distinguishes empty results from API errors.
 */
export function useDiscovery(searchState: SearchState) {
  const [status, setStatus] = useState<DiscoveryStatus>({ type: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (state: SearchState, signal: AbortSignal) => {
    setStatus({ type: 'loading' })
    try {
      const url = buildApiUrl(state)
      const res = await fetch(url, { signal })
      if (signal.aborted) return

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setStatus({ type: 'error', message: body.error ?? 'Unable to load events.' })
        return
      }

      const body = await res.json() as { data?: unknown[] }
      if (signal.aborted) return

      const rows = Array.isArray(body.data) ? (body.data as DiscoveryEvent[]) : []
      setStatus(rows.length === 0 ? { type: 'empty' } : { type: 'ok', events: rows })
    } catch (err) {
      if (signal.aborted) return
      const message = err instanceof Error ? err.message : 'Network error.'
      setStatus({ type: 'error', message })
    }
  }, [])

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    void load(searchState, controller.signal)
    return () => controller.abort()
  }, [searchState, load])

  const retry = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    void load(searchState, controller.signal)
  }, [searchState, load])

  return { status, retry }
}
