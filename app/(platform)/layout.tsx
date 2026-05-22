import PageShell from '@/components/PageShell'
import AppShell from '@/components/layout/AppShell'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <AppShell>{children}</AppShell>
    </PageShell>
  )
}
