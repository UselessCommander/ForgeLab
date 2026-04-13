import { Suspense } from 'react'
import AnalyticsHub from './AnalyticsHub'
import { getCurrentUserId } from '@/lib/auth'

export const metadata = {
  title: 'Analytics Dashboard | ForgeLab',
  description:
    'Analytics for QR, undersøgelser og kortsortering — overblik med faner og grafer i ForgeLab.',
}

function AnalyticsHubFallback() {
  return (
    <div className="layout-page mx-auto max-w-6xl px-4 py-20 text-center text-slate-600">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
      <p className="mt-4 text-sm">Indlæser analytics…</p>
    </div>
  )
}

export default async function AnalyticsPage() {
  const userId = await getCurrentUserId()
  const isLoggedIn = !!userId

  return (
    <div className="layout-page relative py-10 md:py-14 pb-24 px-4 sm:px-6">
      <Suspense fallback={<AnalyticsHubFallback />}>
        <AnalyticsHub isLoggedIn={isLoggedIn} />
      </Suspense>
    </div>
  )
}
