'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  applyForgeTheme,
  getStoredForgeTheme,
} from '@/lib/theme'

function isPublicRoute(pathname: string): boolean {
  const publicExact = new Set(['/', '/login', '/register', '/auth/callback', '/vaerktoejer-oversigt', '/analytics'])
  if (publicExact.has(pathname)) return true
  if (pathname.startsWith('/analytics/')) return true
  if (pathname.startsWith('/tools/')) return true
  if (pathname.startsWith('/try/')) return true
  if (pathname.startsWith('/survey/respond/')) return true
  if (pathname.startsWith('/forgot')) return true
  return false
}

export default function ThemeInitializer() {
  const pathname = usePathname()

  useEffect(() => {
    // Keep custom themes limited to authenticated app areas.
    if (isPublicRoute(pathname)) {
      applyForgeTheme('default')
      return
    }

    applyForgeTheme(getStoredForgeTheme())
  }, [pathname])

  return null
}
