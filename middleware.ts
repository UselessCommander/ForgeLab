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
  const publicRoutes = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route)
  
  // API routes that don't require authentication (tracking endpoints)
  const publicApiRoutes = ['/api/track', '/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // If accessing protected route without authentication
  if (!isPublicRoute && !isPublicApiRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If accessing login/register page while authenticated, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
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
