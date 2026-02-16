import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('forgelab_session')
  let isAuthenticated = false
  
  if (session?.value) {
    try {
      const sessionData = JSON.parse(session.value)
      isAuthenticated = !!sessionData.userId
    } catch {
      // Legacy session format
      isAuthenticated = session.value === 'authenticated'
    }
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/try/qr-generator', '/analytics', '/vaerktoejer']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route)
  const isPublicToolsExplore = request.nextUrl.pathname.startsWith('/vaerktoejer/')
  const isPublic = isPublicRoute || isPublicToolsExplore
  
  // API routes that don't require authentication (tracking endpoints)
  const publicApiRoutes = ['/api/track', '/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // If accessing protected route without authentication
  if (!isPublic && !isPublicApiRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Let login/register pages handle "already logged in" themselves (show message + link to dashboard)
  // so the user sees the page content instead of being redirected without feedback.
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
