'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Workflow } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { normalizeBlueprintFromRaw, type BlueprintData } from '@/lib/service-blueprint'
import { ServiceBlueprintScaledPreview } from '@/components/service-blueprint/ServiceBlueprintScaledPreview'

export default function ServiceBlueprintPreviewCard() {
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
        const data = await getProjectToolData(projectId, 'service-blueprint')
        if (!cancelled) setRaw(data)
      } catch {
        // ignore network errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:service-blueprint`, {
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

  const blueprint = useMemo<BlueprintData>(
    () => normalizeBlueprintFromRaw(raw ?? {}),
    [raw],
  )

  const dedicatedHref = projectId
    ? `/tools/service-blueprint?projectId=${encodeURIComponent(projectId)}`
    : '/tools/service-blueprint'

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const phaseLabel = blueprint.phases.length === 1 ? 'fase' : 'faser'
  const cardLabel = blueprint.cards.length === 1 ? 'kort' : 'kort'
  const stats = loading
    ? 'Henter blueprint…'
    : `${blueprint.phases.length} ${phaseLabel} · ${blueprint.cards.length} ${cardLabel}`

  return (
    <div className="w-full px-2 py-2">
      <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Workflow className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Service Blueprint</p>
            <p className="text-[11px] text-slate-500">{stats}</p>
          </div>
        </div>

        <div className="w-full px-1.5 pt-1.5 pb-1">
          <ServiceBlueprintScaledPreview data={blueprint} loading={loading} />
        </div>

        <div className="border-t border-slate-100 p-2">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Åbn Blueprint
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
