'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  applyForgeColorMode,
  applyForgeTheme,
  getStoredForgeColorMode,
  getStoredForgeTheme,
} from '@/lib/theme'

function isPublicRoute(pathname: string): boolean {
  const publicExact = new Set(['/', '/login', '/register', '/auth/callback'])
  if (publicExact.has(pathname)) return true
  if (pathname.startsWith('/vaerktoejer/')) return true
  if (pathname.startsWith('/tools/ab-test/v/')) return true
  if (pathname.startsWith('/survey/respond/')) return true
  if (pathname.startsWith('/forgot')) return true
  return false
}

export default function ThemeInitializer() {
  const pathname = usePathname()

  useEffect(() => {
    // Keep theme/dark-mode limited to authenticated app areas.
    if (isPublicRoute(pathname)) {
      applyForgeTheme('default')
      applyForgeColorMode('light')
      return
    }

    applyForgeTheme(getStoredForgeTheme())
    const storedMode = getStoredForgeColorMode()
    applyForgeColorMode(storedMode)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (getStoredForgeColorMode() === 'system') {
        applyForgeColorMode('system')
      }
    }
    media.addEventListener?.('change', onSystemChange)
    return () => {
      media.removeEventListener?.('change', onSystemChange)
    }
  }, [pathname])

  return null
}
