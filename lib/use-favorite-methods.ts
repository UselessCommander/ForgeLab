'use client'

import { useCallback, useEffect, useState } from 'react'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'

const STORAGE_KEY = 'forgelab_favorite_methods'

function readFavorites(): string[] {
  if (typeof window === 'undefined' || !hasFunctionalStorageConsent()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeFavorites(slugs: string[]) {
  if (typeof window === 'undefined' || !hasFunctionalStorageConsent()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
}

export function useFavoriteMethods() {
  const [favorites, setFavorites] = useState<string[]>([])
  /** false on server + first paint — avoids hydration mismatch with localStorage consent */
  const [canPersist, setCanPersist] = useState(false)
  const [ready, setReady] = useState(false)

  const syncFromStorage = useCallback(() => {
    setCanPersist(hasFunctionalStorageConsent())
    setFavorites(readFavorites())
  }, [])

  useEffect(() => {
    syncFromStorage()
    setReady(true)

    const onConsentUpdated = () => syncFromStorage()
    window.addEventListener('forgelab-consent-updated', onConsentUpdated)
    return () => window.removeEventListener('forgelab-consent-updated', onConsentUpdated)
  }, [syncFromStorage])

  const toggleFavorite = useCallback((slug: string) => {
    if (!hasFunctionalStorageConsent()) return
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      writeFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites])

  return { favorites, toggleFavorite, isFavorite, ready, canPersist }
}
