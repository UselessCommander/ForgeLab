'use client'

/**
 * QrGeneratorPreviewCard
 * Lille preview-card til projektboardet for QR-generator.
 * Viser tool-info og en "Åbn"-knap der navigerer til den dedikerede
 * /tools/qr-generator-side.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'

type PreviewData = {
  qrText: string
  savedCount: number
}

const EMPTY: PreviewData = { qrText: '', savedCount: 0 }

function compact(raw: any): PreviewData {
  const qrText = typeof raw?.qrText === 'string' ? raw.qrText.trim() : ''
  const saved = Array.isArray(raw?.savedQRCodes) ? raw.savedQRCodes : []
  return { qrText, savedCount: saved.length }
}

export default function QrGeneratorPreviewCard() {
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
        const raw = await getProjectToolData(projectId, 'qr-generator')
        if (!cancelled) setData(compact(raw))
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:qr-generator`, {
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
    ? `/tools/qr-generator?projectId=${encodeURIComponent(projectId)}`
    : '/tools/qr-generator'

  const savedLabel = data.savedCount === 1 ? 'gemt QR' : 'gemte QR-koder'
  const stats = loading ? '…' : `${data.savedCount} ${savedLabel}`

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 via-white to-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Værktøj</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">QR-generator</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aktuel tekst</p>
            <p className={`mt-0.5 line-clamp-2 ${data.qrText ? 'text-gray-800 font-mono text-[11px]' : 'text-gray-400 italic'}`}>
              {data.qrText || (loading ? 'Henter…' : 'Ingen tekst endnu')}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors shadow-sm"
          >
            Åbn QR-generator
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
