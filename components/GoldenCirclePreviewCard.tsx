'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Circle, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { GoldenCircleDiagram } from '@/components/tools/golden-circle/GoldenCircleDiagram'
import styles from '@/components/tools/golden-circle/golden-circle.module.css'
import {
  goldenCircleFilledCount,
  GOLDEN_CIRCLE_LAYERS,
  GOLDEN_CIRCLE_LAYER_ORDER,
  normalizeGoldenCircleData,
  type GoldenCircleData,
  type GoldenCircleLayerId,
} from '@/components/tools/golden-circle/golden-circle-data'

export default function GoldenCirclePreviewCard() {
  const { projectId } = useToolEmbed()
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const activeLayer: GoldenCircleLayerId = 'why'

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      try {
        const data = await getProjectToolData(projectId, 'golden-circle')
        if (!cancelled) setRaw(data)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:golden-circle`, {
        config: { broadcast: { self: false } },
      }) as ReturnType<typeof supabase.channel>
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

  const data = useMemo<GoldenCircleData>(() => normalizeGoldenCircleData(raw as Partial<GoldenCircleData>), [raw])

  const dedicatedHref = projectId
    ? `/tools/golden-circle?projectId=${encodeURIComponent(projectId)}`
    : '/tools/golden-circle'

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  const filled = goldenCircleFilledCount(data)
  const stats = loading
    ? 'Henter Golden Circle…'
    : `${filled} af ${GOLDEN_CIRCLE_LAYER_ORDER.length} statements udfyldt`

  return (
    <div className="w-full px-2 py-2">
      <div className="w-full overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
            <Circle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-800">
              The Golden Circle
            </p>
            <p className="truncate text-[11px] text-amber-900/70">{stats}</p>
          </div>
        </div>

        <div className="w-full px-2 pt-2 pb-1">
          {loading ? (
            <div
              className="mx-auto w-full max-w-full animate-pulse rounded-lg border border-amber-100 bg-amber-50/40"
              style={{ height: 280 }}
            />
          ) : (
            <>
              <div className={styles.previewScaled}>
                <div className={styles.previewScaledInner} style={{ transform: 'scale(0.42)', width: 640, height: 320 }}>
                  <GoldenCircleDiagram activeLayer={activeLayer} />
                </div>
              </div>
              <div className={styles.previewStatements}>
                {GOLDEN_CIRCLE_LAYER_ORDER.map(id => {
                  const text = data[id].trim()
                  return (
                    <div key={id} className={styles.previewStatementRow}>
                      <span className={styles.previewStatementLabel}>
                        {GOLDEN_CIRCLE_LAYERS[id].title}
                      </span>
                      <p
                        className={`${styles.previewStatementText} ${!text ? styles.previewStatementEmpty : ''}`}
                      >
                        {text || 'Ikke udfyldt'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-amber-100 p-2">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Rediger Golden Circle
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
