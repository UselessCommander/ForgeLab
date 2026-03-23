'use client'

import Link from 'next/link'
import type { DoubleDiamondPhase, FrameworkPhase } from '@/lib/frameworks'
import type { Vaerktoej } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'

const VB_W = 1200
const VB_H = 650

/** Centroid af hver fase-trekant (samme geometri som DoubleDiamondDiagram) */
const PHASE_CENTER: Record<DoubleDiamondPhase, { x: number; y: number }> = {
  discover: { x: 267, y: 350 },
  define: { x: 433, y: 350 },
  develop: { x: 767, y: 350 },
  deliver: { x: 933, y: 350 },
}

const HMW_SPOT = { x: 600, y: 350 }

function resolvePhase(p: FrameworkPhase | undefined): DoubleDiamondPhase {
  if (p === 'discover' || p === 'define' || p === 'develop' || p === 'deliver') return p
  return 'develop'
}

function layoutToolMarkers(
  tools: Array<{ slug: string; tool: Vaerktoej }>,
  toolPhases: Record<string, FrameworkPhase | undefined>
): Array<{ slug: string; title: string; x: number; y: number }> {
  const out: Array<{ slug: string; title: string; x: number; y: number }> = []

  const resolved = tools.map((t) => ({
    ...t,
    phase: resolvePhase(toolPhases[t.slug]),
  }))

  const hmw = resolved.filter((t) => t.slug === 'hmw')
  const rest = resolved.filter((t) => t.slug !== 'hmw')

  hmw.forEach((t, i) => {
    const step = (2 * Math.PI * i) / Math.max(hmw.length, 1)
    const r = hmw.length > 1 ? 28 : 0
    out.push({
      slug: t.slug,
      title: t.tool.title,
      x: HMW_SPOT.x + r * Math.cos(step - Math.PI / 2),
      y: HMW_SPOT.y + r * Math.sin(step - Math.PI / 2),
    })
  })

  for (const phase of ['discover', 'define', 'develop', 'deliver'] as const) {
    const phaseTools = rest.filter((t) => t.phase === phase)
    const c = PHASE_CENTER[phase]
    phaseTools.forEach((t, i) => {
      const n = phaseTools.length
      const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
      const r = 44 + (i % 5) * 14
      out.push({
        slug: t.slug,
        title: t.tool.title,
        x: c.x + r * Math.cos(angle),
        y: c.y + r * Math.sin(angle),
      })
    })
  }

  return out
}

type Props = {
  projectId: string
  tools: Array<{ slug: string; tool: Vaerktoej }>
  toolPhases: Record<string, FrameworkPhase | undefined>
}

export default function ProjectDoubleDiamondBoard({ projectId, tools, toolPhases }: Props) {
  const markers = layoutToolMarkers(tools, toolPhases)

  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white p-3 md:p-4">
      <div className="relative mx-auto min-w-[800px] w-full pb-1">
        <DoubleDiamondDiagram readOnly />
        {/* Ikoner ovenpå samme viewBox-koordinater */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {markers.map(({ slug, title, x, y }) => {
            const { Icon, bg, text } = getToolIcon(slug)
            const left = (x / VB_W) * 100
            const top = (y / VB_H) * 100
            return (
              <Link
                key={slug}
                href={`/tools/${slug}?projectId=${encodeURIComponent(projectId)}`}
                className="group pointer-events-auto absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-md transition hover:z-30 hover:scale-105 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                style={{ left: `${left}%`, top: `${top}%` }}
                title={title}
                aria-label={title}
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-200 bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white shadow-md sm:block sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
                  {title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${text}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
