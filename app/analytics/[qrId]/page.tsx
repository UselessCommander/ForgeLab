import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import AnalyticsCharts from '../AnalyticsCharts'
import LogoutButton from '@/components/LogoutButton'
import { getCurrentUserId } from '@/lib/auth'

export const metadata = {
  title: 'QR Analytics | ForgeLab',
  description: 'Statistik for en enkelt QR-kode.',
}

type Props = {
  params: Promise<{ qrId: string }>
}

export default async function AnalyticsQRPage({ params }: Props) {
  const { qrId } = await params
  const userId = await getCurrentUserId()
  const isLoggedIn = !!userId

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                ← Alle analytics
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Log ind
            </Link>
          )
        }
      />
      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4"
          >
            ← Tilbage til Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics for denne QR-kode</h1>
              <p className="text-gray-600 text-sm font-mono mt-0.5">{qrId}</p>
            </div>
          </div>
        </div>

        <AnalyticsCharts qrId={qrId} />

        <div className="mt-10">
          <Link href="/analytics" className="text-gray-500 hover:text-gray-900 font-medium">
            ← Se alle QR-koder
          </Link>
        </div>
      </main>
    </PageShell>
  )
}
