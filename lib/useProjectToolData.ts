import { useEffect, useRef, useCallback, useState } from 'react'
import { getProjectToolData, saveProjectToolData } from './projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'

const GUEST_STANDALONE_PREFIX = 'forgelab_guest_tool_'
const GUEST_PROJECT_PREFIX = 'forgelab_guest_project_tool_'

/**
 * Hook til at gemme og loade tool data automatisk når værktøjet er i et projekt
 *
 * - Logget ind + `projectId`: load/gem via API (database).
 * - Gæst + `projectId`: kun localStorage (ingen DB-kald).
 * - Gæst uden `projectId`: kun localStorage pr. værktøj (session i browseren).
 * - Logget ind uden `projectId`: ingen cloud-gemning (som før).
 */
export function useProjectToolData<T>(
  toolSlug: string,
  data: T,
  setData: (data: T) => void,
  debounceMs: number = 1000
) {
  const { projectId: contextProjectId } = useToolEmbed()
  const [authReady, setAuthReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  const getProjectId = useCallback(() => {
    if (contextProjectId) return contextProjectId
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('projectId')
  }, [contextProjectId])

  const projectId = getProjectId()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { authenticated?: boolean }) => {
        if (!cancelled) {
          setAuthenticated(!!j?.authenticated)
          setAuthReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthenticated(false)
          setAuthReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const persistGuest = useCallback(
    (payload: T) => {
      if (typeof window === 'undefined') return
      if (!hasFunctionalStorageConsent()) return
      if (projectId && !authenticated) {
        localStorage.setItem(`${GUEST_PROJECT_PREFIX}${projectId}_${toolSlug}`, JSON.stringify(payload))
      } else if (!projectId && !authenticated) {
        localStorage.setItem(`${GUEST_STANDALONE_PREFIX}${toolSlug}`, JSON.stringify(payload))
      }
    },
    [projectId, toolSlug, authenticated]
  )

  const loadGuest = useCallback((): T | null => {
    if (typeof window === 'undefined') return null
    if (!hasFunctionalStorageConsent()) return null
    try {
      if (projectId && !authenticated) {
        const raw = localStorage.getItem(`${GUEST_PROJECT_PREFIX}${projectId}_${toolSlug}`)
        return raw ? (JSON.parse(raw) as T) : null
      }
      if (!projectId && !authenticated) {
        const raw = localStorage.getItem(`${GUEST_STANDALONE_PREFIX}${toolSlug}`)
        return raw ? (JSON.parse(raw) as T) : null
      }
    } catch {
      return null
    }
    return null
  }, [projectId, toolSlug, authenticated])

  useEffect(() => {
    if (!authReady || !isInitialLoadRef.current) return

    const loadData = async () => {
      try {
        if (projectId && authenticated) {
          const savedData = await getProjectToolData(projectId, toolSlug)
          if (savedData && Object.keys(savedData).length > 0) {
            setData(savedData as T)
          }
        } else {
          const guest = loadGuest()
          if (guest != null) {
            setData(guest as T)
          }
        }
      } catch (error) {
        console.error('Error loading tool data:', error)
      } finally {
        isInitialLoadRef.current = false
      }
    }

    void loadData()
  }, [authReady, projectId, toolSlug, setData, authenticated, loadGuest])

  useEffect(() => {
    if (!authReady || isInitialLoadRef.current) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          if (projectId && authenticated) {
            await saveProjectToolData(projectId, toolSlug, data as object)
          } else if ((!projectId && !authenticated) || (projectId && !authenticated)) {
            persistGuest(data)
          }
        } catch (error) {
          console.error('Error saving tool data:', error)
        }
      })()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, projectId, toolSlug, debounceMs, authReady, authenticated, persistGuest])

  const saveNow = useCallback(async () => {
    if (!authReady) return
    try {
      if (projectId && authenticated) {
        await saveProjectToolData(projectId, toolSlug, data as object)
      } else if ((!projectId && !authenticated) || (projectId && !authenticated)) {
        persistGuest(data)
      }
    } catch (error) {
      console.error('Error saving tool data:', error)
    }
  }, [authReady, projectId, toolSlug, data, authenticated, persistGuest])

  return {
    projectId,
    isInProject: !!projectId,
    saveNow,
    authenticated,
    authReady,
  }
}
