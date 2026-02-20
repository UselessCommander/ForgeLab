import { useEffect, useRef, useCallback } from 'react'
import { getProjectToolData, saveProjectToolData } from './projects'

/**
 * Hook til at gemme og loade tool data automatisk når værktøjet er i et projekt
 * 
 * @param toolSlug - Slug for værktøjet (f.eks. 'swot-generator')
 * @param data - Den nuværende state/data fra værktøjet
 * @param setData - Funktion til at opdatere state
 * @param debounceMs - Hvor lang tid der skal gå før data gemmes (default 1000ms)
 */
export function useProjectToolData<T>(
  toolSlug: string,
  data: T,
  setData: (data: T) => void,
  debounceMs: number = 1000
) {
  // Get projectId from URL search params
  const getProjectId = useCallback(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('projectId')
  }, [])

  const projectId = getProjectId()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  // Load data when component mounts and projectId is available
  useEffect(() => {
    if (!projectId || !isInitialLoadRef.current) return

    const loadData = async () => {
      try {
        const savedData = await getProjectToolData(projectId, toolSlug)
        if (savedData && Object.keys(savedData).length > 0) {
          setData(savedData as T)
        }
      } catch (error) {
        console.error('Error loading tool data:', error)
      } finally {
        isInitialLoadRef.current = false
      }
    }

    loadData()
  }, [projectId, toolSlug, setData])

  // Save data when it changes (debounced)
  useEffect(() => {
    if (!projectId || isInitialLoadRef.current) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to save data
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveProjectToolData(projectId, toolSlug, data as any)
      } catch (error) {
        console.error('Error saving tool data:', error)
      }
    }, debounceMs)

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, projectId, toolSlug, debounceMs])

  // Manual save function (useful for immediate saves)
  const saveNow = useCallback(async () => {
    if (!projectId) return
    try {
      await saveProjectToolData(projectId, toolSlug, data as any)
    } catch (error) {
      console.error('Error saving tool data:', error)
    }
  }, [projectId, toolSlug, data])

  return {
    projectId,
    isInProject: !!projectId,
    saveNow,
  }
}
