'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DoubleDiamondPhase, FrameworkPhase } from '@/lib/frameworks'
import type { Vaerktoej } from '@/lib/vaerktoejer-data'
import type { DdCanvasPosition } from '@/lib/projects'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'

const VB_W = 1200
const VB_H = 650

const PHASE_CENTER: Record<DoubleDiamondPhase, { x: number; y: number }> = {
  discover: { x: 267, y: 350 },
  define: { x: 433, y: 350 },
  develop: { x: 767, y: 350 },
  deliver: { x: 933, y: 350 },
}

const HMW_SPOT = { x: 600, y: 350 }

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function resolvePhase(p: FrameworkPhase | undefined): DoubleDiamondPhase {
  if (p === 'discover' || p === 'define' || p === 'develop' || p === 'deliver') return p
  return 'develop'
}

function layoutToolMarkers(
  tools: Array<{ slug: string; tool: Vaerktoej }>,
  toolPhases: Record<string, FrameworkPhase | undefined>
): Array<{ slug: string; title: string; nx: number; ny: number }> {
  const out: Array<{ slug: string; title: string; nx: number; ny: number }> = []

  const resolved = tools.map((t) => ({
    ...t,
    phase: resolvePhase(toolPhases[t.slug]),
  }))

  const hmw = resolved.filter((t) => t.slug === 'hmw')
  const rest = resolved.filter((t) => t.slug !== 'hmw')

  hmw.forEach((t, i) => {
    const step = (2 * Math.PI * i) / Math.max(hmw.length, 1)
    const r = hmw.length > 1 ? 28 : 0
    const x = HMW_SPOT.x + r * Math.cos(step - Math.PI / 2)
    const y = HMW_SPOT.y + r * Math.sin(step - Math.PI / 2)
    out.push({
      slug: t.slug,
      title: t.tool.title,
      nx: x / VB_W,
      ny: y / VB_H,
    })
  })

  for (const phase of ['discover', 'define', 'develop', 'deliver'] as const) {
    const phaseTools = rest.filter((t) => t.phase === phase)
    const c = PHASE_CENTER[phase]
    phaseTools.forEach((t, i) => {
      const n = phaseTools.length
      const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
      const r = 44 + (i % 5) * 14
      const x = c.x + r * Math.cos(angle)
      const y = c.y + r * Math.sin(angle)
      out.push({
        slug: t.slug,
        title: t.tool.title,
        nx: x / VB_W,
        ny: y / VB_H,
      })
    })
  }

  return out
}

function mergeWithSaved(
  defaults: Array<{ slug: string; title: string; nx: number; ny: number }>,
  saved: Record<string, DdCanvasPosition> | undefined
) {
  return defaults.map((m) => {
    const s = saved?.[m.slug]
    if (s && typeof s.x === 'number' && typeof s.y === 'number') {
      return { ...m, nx: clamp01(s.x), ny: clamp01(s.y) }
    }
    return m
  })
}

function markersToLayout(markers: Array<{ slug: string; nx: number; ny: number }>): Record<string, DdCanvasPosition> {
  return Object.fromEntries(markers.map((m) => [m.slug, { x: m.nx, y: m.ny }]))
}

type Props = {
  projectId: string
  tools: Array<{ slug: string; tool: Vaerktoej }>
  toolPhases: Record<string, FrameworkPhase | undefined>
  savedLayout?: Record<string, DdCanvasPosition>
  canEdit: boolean
  onLayoutSave: (layout: Record<string, DdCanvasPosition>) => Promise<void>
}

const DRAG_THRESHOLD = 6

export default function ProjectDoubleDiamondBoard({
  projectId,
  tools,
  toolPhases,
  savedLayout,
  canEdit,
  onLayoutSave,
}: Props) {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Primitiv nøgle — undgår at `tools` (nyt array hver parent-render) udløser uendelig setState-løkke
  const layoutInputKey = [...tools]
    .map((t) => `${t.slug}:${resolvePhase(toolPhases[t.slug])}`)
    .sort()
    .join('|')

  const defaults = useMemo(() => layoutToolMarkers(tools, toolPhases), [layoutInputKey])
  // layoutInputKey afledes af tools + toolPhases — undgår ustabile array-referencer

  const savedKey = JSON.stringify(savedLayout ?? {})

  const [markers, setMarkers] = useState(() => mergeWithSaved(layoutToolMarkers(tools, toolPhases), savedLayout))

  useEffect(() => {
    setMarkers(mergeWithSaved(defaults, savedLayout))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savedLayout serialiseres i savedKey
  }, [defaults, savedKey])

  const markersRef = useRef(markers)
  markersRef.current = markers

  const draggingSlug = useRef<string | null>(null)
  const draggingSlugs = useRef<string[] | null>(null)
  const dragStartNorm = useRef<{ nx: number; ny: number } | null>(null)
  const dragStartPositions = useRef<Record<string, { nx: number; ny: number }>>({})
  const interactionMode = useRef<'move' | null>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const activeSlug = useRef<string | null>(null)
  const hasMoved = useRef(false)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  const clientToNorm = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current
    if (!el) return { nx: 0.5, ny: 0.5 }
    const rect = el.getBoundingClientRect()
    return {
      nx: clamp01((clientX - rect.left) / rect.width),
      ny: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  useEffect(() => {
    if (!canEdit) {
      return
    }

    const onMove = (e: PointerEvent) => {
      if (interactionMode.current === 'move') {
        const slugs = draggingSlugs.current
        if (!slugs?.length) return
        const { nx, ny } = clientToNorm(e.clientX, e.clientY)
        if (pointerStart.current) {
          const d = Math.hypot(e.clientX - pointerStart.current.x, e.clientY - pointerStart.current.y)
          if (d > DRAG_THRESHOLD) hasMoved.current = true
        }

        const start = dragStartNorm.current
        if (!start) return
        const dx = nx - start.nx
        const dy = ny - start.ny

        setMarkers((prev) => {
          const next = prev.map((m) => {
            if (!slugs.includes(m.slug)) return m
            const startPos = dragStartPositions.current[m.slug]
            if (!startPos) return m
            return {
              ...m,
              nx: clamp01(startPos.nx + dx),
              ny: clamp01(startPos.ny + dy),
            }
          })
          markersRef.current = next
          return next
        })
        return
      }

    }

    const onUp = async () => {
      const slug = activeSlug.current
      const moved = hasMoved.current
      draggingSlug.current = null
      draggingSlugs.current = null
      dragStartNorm.current = null
      dragStartPositions.current = {}
      interactionMode.current = null
      pointerStart.current = null
      activeSlug.current = null
      hasMoved.current = false
      document.body.style.cursor = ''

      if (moved && canEdit) {
        const layout = markersToLayout(markersRef.current)
        try {
          await onLayoutSave(layout)
        } catch (err) {
          console.error(err)
        }
      } else if (!moved && slug) {
        router.push(`/tools/${slug}?projectId=${encodeURIComponent(projectId)}`)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [canEdit, clientToNorm, onLayoutSave, projectId, router])

  const onIconPointerDown = (e: React.PointerEvent, slug: string) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    const addToSelection = e.metaKey || e.ctrlKey || e.shiftKey

    if (addToSelection) {
      setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
      return
    }

    if (!selectedSlugs.includes(slug)) {
      // Første klik markerer kun; næste træk på markeret ikon flytter.
      setSelectedSlugs([slug])
      return
    }

    const selected = selectedSlugs.length ? selectedSlugs : [slug]
    hasMoved.current = false
    interactionMode.current = 'move'
    draggingSlug.current = slug
    draggingSlugs.current = selected
    const startPos = markersRef.current.find((m) => m.slug === slug)
    if (!startPos) return
    dragStartNorm.current = { nx: startPos.nx, ny: startPos.ny }
    dragStartPositions.current = Object.fromEntries(
      markersRef.current
        .filter((m) => selected.includes(m.slug))
        .map((m) => [m.slug, { nx: m.nx, ny: m.ny }])
    )
    activeSlug.current = slug
    pointerStart.current = { x: e.clientX, y: e.clientY }
    document.body.style.cursor = 'grabbing'
  }

  const onBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canEdit) return
    const target = e.target as HTMLElement
    if (target.closest('[data-marker="true"]')) return
    if (selectedSlugs.length === 0) return
    setSelectedSlugs([])
  }

  const handleReset = async () => {
    if (!canEdit) return
    const fresh = mergeWithSaved(layoutToolMarkers(tools, toolPhases), {})
    setMarkers(fresh)
    markersRef.current = fresh
    await onLayoutSave({})
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
          <p>
            <span className="font-medium text-neutral-800">Klik</span> først for at markere.{' '}
            <span className="font-medium text-neutral-800">Træk</span> derefter markerede ikoner for at flytte dem samlet.{' '}
            <span className="font-medium text-neutral-800">Shift/Cmd/Ctrl+klik</span> tilføjer/fjerner fra markering.{' '}
            <span className="font-medium text-neutral-800">Klik</span> (uden at trække) åbner værktøjet.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Nulstil placering
          </button>
        </div>
      )}
      <div className="relative w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white p-3 md:p-4">
        <div
          ref={canvasRef}
          onPointerDown={onBoardPointerDown}
          className="relative mx-auto min-w-[800px] w-full pb-1 touch-none"
        >
          <DoubleDiamondDiagram readOnly />
          <div className="pointer-events-none absolute inset-0 z-10">
            {markers.map(({ slug, title, nx, ny }) => {
              const { Icon, bg, text } = getToolIcon(slug)
              const left = nx * 100
              const top = ny * 100
              const href = `/tools/${slug}?projectId=${encodeURIComponent(projectId)}`
              const isSelected = selectedSlugs.includes(slug)
              const shellClass = `group pointer-events-auto absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-md transition hover:z-30 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
              } ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`
              const tip = (
                <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-200 bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white shadow-md sm:block sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
                  {title}
                </span>
              )
              const iconBox = (
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${text}`}>
                  <Icon className="h-4 w-4" />
                </div>
              )

              if (!canEdit) {
                return (
                  <Link
                    key={slug}
                    href={href}
                    className={shellClass}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={title}
                    aria-label={title}
                  >
                    {tip}
                    {iconBox}
                  </Link>
                )
              }

              return (
                <div
                  key={slug}
                  data-marker="true"
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) => onIconPointerDown(e, slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(href)
                    }
                  }}
                  className={shellClass}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  title={title}
                  aria-label={title}
                >
                  {tip}
                  {iconBox}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
