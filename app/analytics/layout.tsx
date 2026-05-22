import { Suspense } from 'react'
import PageShell from '@/components/PageShell'
import AppShell from '@/components/layout/AppShell'
import AnalyticsSidebar from '@/components/AnalyticsSidebar'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <AppShell>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <aside
                className="sticky top-0 hidden h-full w-56 shrink-0 border-r border-slate-200/90 bg-white/95 lg:block"
                aria-hidden
              />
            }
          >
            <AnalyticsSidebar />
          </Suspense>
          <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </AppShell>
    </PageShell>
  )
}
