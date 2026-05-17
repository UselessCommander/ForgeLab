'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Route } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { normalizeJourneyFromRaw, type JourneyData } from '@/lib/brugerrejse'
import { BrugerrejseScaledPreview } from '@/components/brugerrejse/BrugerrejseScaledPreview'

export default function BrugerrejsePreviewCard() {
  const { projectId } = useToolEmbed()
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      try {
        const data = await getProjectToolData(projectId, 'brugerrejse')
        if (!cancelled) setRaw(data)
      } catch {
        // ignore network errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:brugerrejse`, {
        config: { broadcast: { self: false } },
      }) as any
    )
      .on('broadcast', { event: 'tool_sync' }, (msg: { payload?: { data?: unknown } }) => {
        if (cancelled || msg?.payload?.data === undefined) return
        setRaw(msg.payload.data)
      })
      .subscribe()

    return () => {
      cancelled = true
      try {
        void channel.unsubscribe()
      } catch {
        // ignore
      }
    }
  }, [projectId])

  const journey = useMemo<JourneyData>(() => normalizeJourneyFromRaw(raw ?? {}), [raw])

  const dedicatedHref = projectId
    ? `/tools/brugerrejse?projectId=${encodeURIComponent(projectId)}`
    : '/tools/brugerrejse'

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const personaLabel =
    journey.persona.trim() ||
    (journey.linkedPersona?.name?.trim() ?? '') ||
    (loading ? '' : '')
  const phaseLabel = journey.phases.length === 1 ? 'fase' : 'faser'
  const stepLabel = journey.steps.length === 1 ? 'trin' : 'trin'
  const stats = loading
    ? 'Henter brugerrejse…'
    : [
        personaLabel ? personaLabel : null,
        `${journey.phases.length} ${phaseLabel} · ${journey.steps.length} ${stepLabel}`,
      ]
        .filter(Boolean)
        .join(' · ')

  return (
    <div className="w-full px-2 py-2">
      <div className="w-full overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white">
            <Route className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-700">
              User Journey Map
            </p>
            <p className="truncate text-[11px] text-cyan-800/80">{stats}</p>
          </div>
        </div>

        <div className="w-full px-1.5 pt-1.5 pb-1">
          <BrugerrejseScaledPreview data={journey} loading={loading} />
        </div>

        <div className="border-t border-cyan-100 p-2">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-700"
          >
            Åbn User Journey
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
