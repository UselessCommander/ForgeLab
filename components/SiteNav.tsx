'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SiteNavProps {
  /** Right-side CTA: "Log ind" vs "Dashboard" etc. */
  rightSlot?: React.ReactNode
  /** Use landing-style CTA (gray-900 Log ind) when true and no rightSlot */
  showLoginCta?: boolean
}

/** Forsiden (marketing) — logo skal altid gå hertil, ikke til app-dashboard, så gæster ikke «låses ind» i app-følelsen. */
function forgeLabBrandHref(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/'
  if (pathname.startsWith('/analytics')) return '/'
  if (pathname === '/vaerktoejer-oversigt') return '/'
  if (pathname.startsWith('/try/')) return '/'
  if (pathname.startsWith('/login') || pathname.startsWith('/auth/callback')) return '/'
  if (pathname.startsWith('/forgot')) return '/'
  if (pathname.startsWith('/survey/respond/')) return '/'
  return '/dashboard'
}

export default function SiteNav({ rightSlot, showLoginCta = true }: SiteNavProps) {
  const pathname = usePathname()
  const brandHref = forgeLabBrandHref(pathname)

  return (
    <nav className="forgelab-site-nav border-b border-gray-200/80 backdrop-blur-md sticky top-0 z-50">
      <div className="layout-page py-4">
        <div className="flex justify-between items-center">
          <Link href={brandHref} className="flex items-center gap-2 group">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-extrabold shadow-sm shadow-amber-500/30 select-none">F</span>
            <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
          </Link>
          {rightSlot !== undefined ? (
            rightSlot
          ) : showLoginCta ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Log Ind
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
