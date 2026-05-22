import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { MARKETING_FOOTER_PLATFORM_LINKS, MARKETING_HEADER_LINKS } from '@/lib/marketing-nav'

type MarketingShellProps = {
  children: React.ReactNode
  activeHref?: string
  userId?: string | null
}

export default function MarketingShell({ children, activeHref, userId }: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e8e8e8_1px,transparent_1px),linear-gradient(to_bottom,#e8e8e8_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/20 to-violet-50/10 pointer-events-none" />

      <div className="relative z-10">
        <nav className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-extrabold shadow-sm shadow-amber-500/30 select-none">
                F
              </span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {MARKETING_HEADER_LINKS.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeHref === href
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Opret konto
              </Link>
              <Link
                href={userId ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                {userId ? 'Dashboard' : 'Log Ind'}
              </Link>
            </div>
          </div>
        </nav>

        {children}

        <footer className="border-t border-gray-200/80 bg-white/90 mt-24">
          <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
            <div>
              <p className="text-sm font-extrabold text-gray-900 mb-2">ForgeLab</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Interaktive metoder og frameworks til konceptudvikling, UX, strategi og marketing.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Platform</p>
              <ul className="space-y-2">
                {MARKETING_FOOTER_PLATFORM_LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-600 hover:text-gray-900">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Konto</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                    Log ind
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-sm text-gray-600 hover:text-gray-900">
                    Opret konto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-8 text-xs text-gray-400">
            © {new Date().getFullYear()} ForgeLab
          </div>
        </footer>
      </div>
    </div>
  )
}
