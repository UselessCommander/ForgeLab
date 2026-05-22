'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { PesoScaledPreview } from '@/components/tools/peso/PesoScaledPreview'
import { normalizePesoData, PESO_FIELD_ORDER, type PesoModelData } from '@/components/tools/peso/peso-data'

export default function PesoPreviewCard() {
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
        const data = await getProjectToolData(projectId, 'peso')
        if (!cancelled) setRaw(data)
      } catch {
        // ignore network errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:peso`, {
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

  const peso = useMemo<PesoModelData>(() => normalizePesoData(raw as Partial<PesoModelData>), [raw])

  const dedicatedHref = projectId
    ? `/tools/peso?projectId=${encodeURIComponent(projectId)}`
    : '/tools/peso'

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const filledCount = PESO_FIELD_ORDER.filter(id => peso[id].description.trim().length > 0).length
  const stats = loading
    ? 'Henter PESO…'
    : `${filledCount} af ${PESO_FIELD_ORDER.length} felter udfyldt`

  return (
    <div className="w-full px-2 py-2">
      <div className="w-full overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-800">
              PESO-model
            </p>
            <p className="truncate text-[11px] text-amber-900/70">{stats}</p>
          </div>
        </div>

        <div className="w-full px-1.5 pt-1.5 pb-1">
          <PesoScaledPreview data={peso} loading={loading} />
        </div>

        <div className="border-t border-amber-100 p-2">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Rediger PESO-model
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
