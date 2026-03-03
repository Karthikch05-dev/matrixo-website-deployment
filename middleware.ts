import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Create response with pathname header for layout detection
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  // Handle team-auth.matrixo.in subdomain
  // Only allow /employee-portal routes on this subdomain
  if (hostname === 'team-auth.matrixo.in' || hostname === 'www.team-auth.matrixo.in') {
    // If accessing root on team-auth subdomain, redirect to employee-portal
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/employee-portal', request.url))
    }
    
    // Only allow employee-portal routes on this subdomain
    if (!pathname.startsWith('/employee-portal') && 
        !pathname.startsWith('/_next') && 
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/logos') &&
        !pathname.startsWith('/team') &&
        !pathname.includes('.')) {
      return NextResponse.redirect(new URL('/employee-portal', request.url))
    }
  }

  // ── Careers admin route protection ────────────────────────
  // /careers/admin/* and /careers/dashboard are employee-only pages.
  // Middleware cannot check Firestore auth, but blocking unauthenticated
  // crawlers / bots that hit these paths directly adds a layer of defence.
  // Actual auth is enforced in the components themselves.
  if (
    pathname.startsWith('/careers/admin') ||
    pathname.startsWith('/careers/dashboard')
  ) {
    // No cookie/session check possible at edge without JWT,
    // but we set a cache-control to prevent caching of admin pages.
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.headers.set('x-careers-admin', '1')
  }

  // ── Careers preview access ──────────────────────────────
  // Allow ?preview=matrixo-admin-preview to bypass status checks
  // (handled in page.tsx server component, but we tag the response
  //  so CDN / cache layers don't cache a preview render for public users)
  if (pathname.startsWith('/careers/apply/') && request.nextUrl.searchParams.get('preview')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.headers.set('x-careers-preview', '1')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
