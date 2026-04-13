'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { sanitizeAnalyticsReturnPath } from '@/lib/analytics-return-path'
import AnalyticsCharts from './AnalyticsCharts'
import CardSortingAnalyticsPanel from './CardSortingAnalyticsPanel'

export type AnalyticsTabId = 'qr' | 'survey' | 'card-sorting'

function tabFromParam(v: string | null): AnalyticsTabId {
  if (v === 'survey' || v === 'card-sorting') return v
  return 'qr'
}

type SurveyRow = {
  id: string
  slug: string
  title: string
  createdAt: string
  responseCount: number
  responsesByDate: Record<string, number>
}

export default function AnalyticsHub({ isLoggedIn }: { isLoggedIn: boolean }) {
  const searchParams = useSearchParams()
  const activeTab = tabFromParam(searchParams.get('tab'))
  const returnRaw = searchParams.get('return')
  const boardReturnPath = useMemo(() => sanitizeAnalyticsReturnPath(returnRaw), [returnRaw])
  const scopedProjectId = searchParams.get('project')

  return (
    <div className="mx-auto max-w-5xl">
      <header className="sticky top-0 z-20 mb-8 border-b border-slate-200/80 bg-[rgba(252,252,251,0.95)] pb-4 pt-2 backdrop-blur md:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          {scopedProjectId
            ? 'Tallene her gælder kun det projekt, du åbnede analytics fra (QR, undersøgelser og kortsortering i projektet).'
            : 'Vælg en sektion i sidebaren: overblik med QR-data, undersøgelser eller kortsortering på tværs af dine projekter.'}
        </p>
      </header>

      <div className="min-w-0">
        {activeTab === 'qr' && (
          <div className="space-y-4">
            {!isLoggedIn ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                Du ser demo-data indtil du logger ind — derefter vises dine trackede QR-koder.
              </p>
            ) : (
              <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
                {scopedProjectId
                  ? 'QR-statistik for QR-koder, der er gemt i dette projekts QR-generator.'
                  : 'Data er bundet til din ForgeLab-bruger.'}
              </p>
            )}
            <AnalyticsCharts
              presentation="dashboard"
              returnPath={boardReturnPath}
              projectId={scopedProjectId}
            />
          </div>
        )}

        {activeTab === 'survey' && (
          <SurveyAnalytics isLoggedIn={isLoggedIn} projectId={scopedProjectId} />
        )}
        {activeTab === 'card-sorting' && (
          <CardSortingAnalyticsPanel
            isLoggedIn={isLoggedIn}
            projectId={scopedProjectId}
            returnPath={boardReturnPath}
          />
        )}
      </div>
    </div>
  )
}

function SurveyAnalytics({ isLoggedIn, projectId }: { isLoggedIn: boolean; projectId: string | null }) {
  const [data, setData] = useState<{
    surveys: SurveyRow[]
    summary: { totalSurveys: number; totalResponses: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
        const res = await fetch(`/api/analytics/surveys${q}`, { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) setError('Ikke logget ind.')
            return
          }
          throw new Error('fetch failed')
        }
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError('Kunne ikke indlæse survey-analytics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, projectId])

  const last7Days = useMemo(() => {
    if (!data?.surveys.length) return { labels: [] as string[], values: [] as number[] }
    const map: Record<string, number> = {}
    for (const s of data.surveys) {
      for (const [day, n] of Object.entries(s.responsesByDate)) {
        map[day] = (map[day] || 0) + n
      }
    }
    const labels: string[] = []
    const values: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      labels.push(
        d.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'numeric' })
      )
      values.push(map[key] || 0)
    }
    return { labels, values }
  }, [data])

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">Log ind for at se svar og statistik for dine undersøgelser.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Log ind
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!data || data.surveys.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">
          {projectId
            ? 'Ingen undersøgelser oprettet i dette projekt endnu (eller ældre surveys uden projekt-link). Opret et magic link fra projektets survey-værktøj — det knyttes til projektet.'
            : 'Ingen undersøgelser knyttet til din bruger endnu. Opret en survey fra et projekt — nye undersøgelser registreres automatisk her.'}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Gamle undersøgelser oprettet før ejer-feltet vises ikke her; opret en ny eller kør migration på databasen.
        </p>
      </div>
    )
  }

  const maxBar = Math.max(...last7Days.values, 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Undersøgelser</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.summary.totalSurveys}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Svar i alt</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.summary.totalResponses}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Svar pr. dag (7 dage)
        </p>
        <div className="flex h-36 items-end justify-between gap-1">
          {last7Days.values.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full min-h-[6px] rounded-t-md bg-indigo-500"
                style={{ height: `${Math.max((v / maxBar) * 100, v > 0 ? 8 : 4)}%` }}
              />
              <span className="text-[9px] text-slate-500 text-center leading-tight">{last7Days.labels[i]}</span>
              <span className="text-xs font-semibold text-indigo-700">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-semibold">Titel</th>
              <th className="px-4 py-3 font-semibold text-right">Svar</th>
              <th className="px-4 py-3 font-semibold">Oprettet</th>
              <th className="px-4 py-3 font-semibold text-right">Link</th>
            </tr>
          </thead>
          <tbody>
            {data.surveys.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{s.title}</td>
                <td className="px-4 py-3 text-right font-semibold text-indigo-700">{s.responseCount}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString('da-DK') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/survey/respond/${s.slug}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Åbn →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
