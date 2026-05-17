'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Route, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'

type PreviewData = {
  persona: string
  scenario: string
  phaseCount: number
  stepCount: number
}

const EMPTY: PreviewData = { persona: '', scenario: '', phaseCount: 0, stepCount: 0 }

function compact(raw: any): PreviewData {
  const phases = Array.isArray(raw?.phases) ? raw.phases : []
  const steps = Array.isArray(raw?.steps) ? raw.steps : []
  const personaText =
    (typeof raw?.persona === 'string' && raw.persona.trim()) ||
    (typeof raw?.linkedPersona?.name === 'string' && raw.linkedPersona.name.trim()) ||
    ''
  const scenarioText = typeof raw?.scenario === 'string' ? raw.scenario.trim() : ''
  return {
    persona: personaText,
    scenario: scenarioText,
    phaseCount: phases.length,
    stepCount: steps.length,
  }
}

export default function BrugerrejsePreviewCard() {
  const { projectId } = useToolEmbed()
  const [data, setData] = useState<PreviewData>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      try {
        const raw = await getProjectToolData(projectId, 'brugerrejse')
        if (!cancelled) setData(compact(raw))
      } catch {
        // network error — keep empty state
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
    ? `/tools/brugerrejse?projectId=${encodeURIComponent(projectId)}`
    : '/tools/brugerrejse'

  const personaText = data.persona || (loading ? 'Henter…' : 'Ikke valgt endnu')
  const scenarioText = data.scenario || (loading ? 'Henter…' : 'Ikke beskrevet endnu')
  const phaseLabel = data.phaseCount === 1 ? 'fase' : 'faser'
  const stepLabel = data.stepCount === 1 ? 'trin' : 'trin'
  const stats = loading
    ? '…'
    : `${data.phaseCount} ${phaseLabel} · ${data.stepCount} ${stepLabel}`

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 via-white to-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
            <Route className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Værktøj</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">User Journey Map</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Persona</p>
              <p className={`mt-0.5 truncate ${data.persona ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                {personaText}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Scenarie</p>
            <p className={`mt-0.5 line-clamp-2 ${data.scenario ? 'text-gray-800' : 'text-gray-400 italic'}`}>
              {scenarioText}
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
            Åbn User Journey
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
