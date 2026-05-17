'use client'

/**
 * SurveyPreviewCard
 * Lille preview-card til projektboardet. Viser blot tool-info og en
 * "Åbn"-knap der navigerer til den dedikerede /tools/survey-template-side.
 * Henter live data via samme mønster som Brugerrejse/ServiceBlueprint cards.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ClipboardList, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getProjectToolData } from '@/lib/projects'
import { useToolEmbed } from '@/components/ToolEmbedContext'

type PreviewData = {
  title: string
  description: string
  questionCount: number
}

const EMPTY: PreviewData = { title: '', description: '', questionCount: 0 }

function compact(raw: any): PreviewData {
  const title = typeof raw?.surveyTitle === 'string' ? raw.surveyTitle.trim() : ''
  const description = typeof raw?.surveyDescription === 'string' ? raw.surveyDescription.trim() : ''
  const questions = Array.isArray(raw?.questions) ? raw.questions : []
  return { title, description, questionCount: questions.length }
}

export default function SurveyPreviewCard() {
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
        const raw = await getProjectToolData(projectId, 'survey-template')
        if (!cancelled) setData(compact(raw))
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const channel = (
      supabase.channel(`project-tool-sync:${projectId}:survey-template`, {
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
    ? `/tools/survey-template?projectId=${encodeURIComponent(projectId)}`
    : '/tools/survey-template'

  const titleText = data.title || (loading ? 'Henter…' : 'Ingen titel endnu')
  const questionLabel = data.questionCount === 1 ? 'spørgsmål' : 'spørgsmål'
  const stats = loading ? '…' : `${data.questionCount} ${questionLabel}`

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-lime-100 bg-gradient-to-br from-lime-50/50 via-white to-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-lime-100 text-lime-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-lime-700">Værktøj</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">Survey</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Titel</p>
              <p className={`mt-0.5 truncate ${data.title ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                {titleText}
              </p>
            </div>
          </div>
          {data.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Beskrivelse</p>
              <p className="mt-0.5 line-clamp-2 text-gray-700">{data.description}</p>
            </div>
          )}
        </div>

        <div className="pt-1">
          <Link
            href={dedicatedHref}
            onMouseDown={stop}
            onClick={stop}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-lime-600 text-white font-semibold hover:bg-lime-700 transition-colors shadow-sm"
          >
            Åbn Survey
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
