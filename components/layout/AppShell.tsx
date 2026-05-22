'use client'

import { useState } from 'react'
import AppSidebar from '@/components/layout/AppSidebar'
import AppTopBar from '@/components/layout/AppTopBar'

type AppShellProps = {
  children: React.ReactNode
  showOfflineBadge?: boolean
}

export default function AppShell({ children, showOfflineBadge }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[#f5f5f4]">
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Luk menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 h-full w-56 max-w-[85vw] shadow-xl">
            <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          showOfflineBadge={showOfflineBadge}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
