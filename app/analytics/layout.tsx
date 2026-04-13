import Link from 'next/link'
import { Suspense } from 'react'
import { LogIn } from 'lucide-react'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import AnalyticsSidebar from '@/components/AnalyticsSidebar'
import { getCurrentUserId } from '@/lib/auth'

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId()
  const isLoggedIn = !!userId

  return (
    <PageShell>
      <div className="flex h-screen min-h-screen flex-col overflow-hidden">
        <SiteNav
          rightSlot={
            isLoggedIn ? null : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md"
              >
                <LogIn className="h-4 w-4" />
                Log ind
              </Link>
            )
          }
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <aside
                className="sticky top-20 h-[calc(100vh-5rem)] w-56 shrink-0 border-r border-slate-200/90 bg-[rgba(252,252,251,0.98)]"
                aria-hidden
              />
            }
          >
            <AnalyticsSidebar />
          </Suspense>
          <main className="relative min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </PageShell>
  )
}
