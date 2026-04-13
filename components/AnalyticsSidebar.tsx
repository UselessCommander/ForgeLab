'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeft, BarChart3, ClipboardList, Layers } from 'lucide-react'
import { sanitizeAnalyticsReturnPath } from '@/lib/analytics-return-path'

const ITEMS = [
  { id: 'overview' as const, label: 'Overblik', tab: null as string | null, icon: BarChart3 },
  { id: 'survey' as const, label: 'Survey', tab: 'survey' as const, icon: ClipboardList },
  { id: 'card-sorting' as const, label: 'Kortsortering', tab: 'card-sorting' as const, icon: Layers },
]

function buildAnalyticsHref(returnParam: string | null, tab: string | null, projectId: string | null) {
  const p = new URLSearchParams()
  if (returnParam) p.set('return', returnParam)
  if (tab) p.set('tab', tab)
  if (projectId) p.set('project', projectId)
  const q = p.toString()
  return q ? `/analytics?${q}` : '/analytics'
}

export default function AnalyticsSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const returnParam = searchParams.get('return')
  const tabParam = searchParams.get('tab')
  const projectParam = searchParams.get('project')
  const boardReturnPath = useMemo(() => sanitizeAnalyticsReturnPath(returnParam), [returnParam])
  const backHref = boardReturnPath ?? '/dashboard'
  const backLabel = boardReturnPath ? 'Tilbage til board' : 'Tilbage til dashboard'
  const onQrDetail = pathname.startsWith('/analytics/') && pathname !== '/analytics'

  const overviewActive =
    onQrDetail || tabParam === null || tabParam === '' || tabParam === 'qr'
  const surveyActive = !onQrDetail && tabParam === 'survey'
  const cardSortingActive = !onQrDetail && tabParam === 'card-sorting'

  const activeMap = {
    overview: overviewActive,
    survey: surveyActive,
    'card-sorting': cardSortingActive,
  } as const

  return (
    <aside
      className="sticky top-20 z-30 flex max-h-[calc(100vh-5rem)] w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-200/90 bg-[rgba(252,252,251,0.98)] py-4 pl-3 pr-2 shadow-[4px_0_20px_rgba(15,23,42,0.04)] sm:w-56"
      aria-label="Analytics navigation"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-slate-100 px-2 pb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/80">
          <BarChart3 className="h-4 w-4 text-indigo-600" strokeWidth={2.2} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Analytics</p>
          <p className="text-xs font-semibold leading-tight text-slate-900">Dine data</p>
        </div>
      </div>

      <Link
        href={backHref}
        className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>

      <nav className="flex flex-col gap-1">
        {ITEMS.map(({ id, label, tab, icon: Icon }) => {
          const href = buildAnalyticsHref(returnParam, tab, projectParam)
          const on = activeMap[id]
          return (
            <Link
              key={id}
              href={href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                on
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100/90'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <p className="mt-auto px-2 pt-6 text-[10px] leading-relaxed text-slate-400">
        Vælg en kategori. Åbner du analytics fra et projektboard, gælder tallene kun det projekt.
      </p>
    </aside>
  )
}
