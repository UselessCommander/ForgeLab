'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV_ITEMS, isNavItemActive } from '@/lib/app-navigation'
import ForgeLabLogo from '@/components/ForgeLabLogo'

type AppSidebarProps = {
  onNavigate?: () => void
  className?: string
}

export default function AppSidebar({ onNavigate, className = '' }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`flex h-full w-56 shrink-0 flex-col border-r border-gray-200/80 bg-white/95 backdrop-blur-md ${className}`}
      aria-label="Hovednavigation"
    >
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30">
          <ForgeLabLogo size={16} className="text-white" />
        </span>
        <span className="text-sm font-extrabold tracking-tight text-gray-900">ForgeLab</span>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-0.5">
          {APP_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-600' : 'text-gray-400'}`} strokeWidth={2.2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
