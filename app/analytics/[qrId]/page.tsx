import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import AnalyticsCharts from '../AnalyticsCharts'
import { sanitizeAnalyticsReturnPath } from '@/lib/analytics-return-path'

export const metadata = {
  title: 'QR Analytics | ForgeLab',
  description: 'Statistik for en enkelt QR-kode.',
}

type Props = {
  params: Promise<{ qrId: string }>
  searchParams: Promise<{ return?: string; project?: string }>
}

export default async function AnalyticsQRPage({ params, searchParams }: Props) {
  const { qrId } = await params
  const sp = await searchParams
  const boardReturnPath = sanitizeAnalyticsReturnPath(sp.return ?? null)
  const listQs = new URLSearchParams()
  if (boardReturnPath) listQs.set('return', boardReturnPath)
  if (sp.project) listQs.set('project', sp.project)
  const analyticsListHref = listQs.toString() ? `/analytics?${listQs.toString()}` : '/analytics'
  return (
    <div className="layout-page py-10 md:py-14 px-4 sm:px-6">
      <div className="mb-8">
        <Link
          href={analyticsListHref}
          className="mb-4 inline-flex items-center gap-2 font-medium text-gray-600 hover:text-gray-900"
        >
          ← Tilbage til Analytics
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Analytics for denne QR-kode</h1>
            <p className="mt-0.5 font-mono text-sm text-gray-600">{qrId}</p>
          </div>
        </div>
      </div>

      <AnalyticsCharts qrId={qrId} returnPath={boardReturnPath} projectId={sp.project ?? null} />

      <div className="mt-10">
        <Link href={analyticsListHref} className="font-medium text-gray-500 hover:text-gray-900">
          ← Se alle QR-koder
        </Link>
      </div>
    </div>
  )
}
