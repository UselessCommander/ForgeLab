'use client'

/**
 * CardSortingPreviewCard
 * Lille preview-card til projektboardet for Card Sorting.
 * Viser tool-info og en "Åbn"-knap der navigerer til den dedikerede
 * /tools/card-sorting-side. Henter live data via samme mønster som
 * Brugerrejse/ServiceBlueprint cards.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Layers, FolderTree } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'

type PreviewData = {
  mode: string
  cardCount: number
  categoryCount: number
  responseCount: number
}

const EMPTY: PreviewData = { mode: '', cardCount: 0, categoryCount: 0, responseCount: 0 }

function compact(raw: any): PreviewData {
  const mode = typeof raw?.mode === 'string' ? raw.mode : ''
  const cards = Array.isArray(raw?.cards) ? raw.cards : []
  const categories = Array.isArray(raw?.categories) ? raw.categories : []
  const responses = Array.isArray(raw?.responses) ? raw.responses : []
  return {
    mode,
    cardCount: cards.length,
    categoryCount: categories.length,
    responseCount: responses.length,
  }
}

const MODE_LABELS: Record<string, string> = {
  open: 'Åben',
  closed: 'Lukket',
  hybrid: 'Hybrid',
}

export default function CardSortingPreviewCard() {
  const { projectId } = useToolEmbed()
  const [data, setData] = useState<PreviewData>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false

    void (async () => {
      try {
        const raw = await getProjectToolData(projectId, 'card-sorting')
        if (!cancelled) setData(compact(raw))
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:card-sorting`, {
        config: { broadcast: { self: false } },
      }) as any
    )
      .on('broadcast', { event: 'tool_sync' }, (msg: { payload?: { data?: any } }) => {
        if (cancelled || !msg?.payload?.data) return
        setData(compact(msg.payload.data))
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

  const dedicatedHref = projectId
    ? `/tools/card-sorting?projectId=${encodeURIComponent(projectId)}`
    : '/tools/card-sorting'

  const cardLabel = data.cardCount === 1 ? 'kort' : 'kort'
  const responseLabel = data.responseCount === 1 ? 'svar' : 'svar'
  const stats = loading
    ? '…'
    : `${data.cardCount} ${cardLabel} · ${data.responseCount} ${responseLabel}`

  const modeLabel = data.mode ? MODE_LABELS[data.mode] || data.mode : null

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 via-white to-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Værktøj</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">Kortsortering</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-cyan-50/60 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-700">
              <FolderTree className="w-3 h-3" />
              Kategorier
            </div>
            <p className="mt-0.5 text-base font-bold text-cyan-900">
              {loading ? '…' : data.categoryCount}
            </p>
          </div>
          <div className="rounded-lg bg-cyan-50/60 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-700">
              Mode
            </div>
            <p className="mt-0.5 text-sm font-semibold text-cyan-900 truncate">
              {modeLabel || (loading ? '…' : 'Ikke valgt')}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors shadow-sm"
          >
            Åbn Kortsortering
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
