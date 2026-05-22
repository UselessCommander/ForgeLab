import PageShell from '@/components/PageShell'
import AppShell from '@/components/layout/AppShell'

/** Global sidebar — kun dashboard-forsiden, ikke projekt-workspace. */
export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <AppShell>{children}</AppShell>
    </PageShell>
  )
}
