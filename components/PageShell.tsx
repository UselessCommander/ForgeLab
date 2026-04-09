'use client'

import CookieConsent from '@/components/CookieConsent'

/** Wraps page content with landing-style background (grid + gradient). Use on all internal pages. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="forgelab-page-shell min-h-screen text-gray-900 overflow-hidden">
      <div className="forgelab-page-grid fixed inset-0 pointer-events-none" />
      <div className="forgelab-page-glow fixed inset-0 pointer-events-none" />
      <div className="relative z-10">
        {children}
        <CookieConsent />
      </div>
    </div>
  )
}

