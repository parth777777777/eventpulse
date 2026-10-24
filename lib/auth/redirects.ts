const DEFAULT_REDIRECT = '/'

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const parsed = new URL(value, 'http://eventpulse.local')
    if (parsed.origin !== 'http://eventpulse.local') {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function getLoginRedirectPath(destination: string) {
  const safeDestination = getSafeRedirectPath(destination)
  return `/login?next=${encodeURIComponent(safeDestination)}`
}
