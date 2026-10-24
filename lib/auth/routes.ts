const protectedPrefixes = ['/saved', '/organizer']

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
