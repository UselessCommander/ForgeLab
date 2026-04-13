import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import CookieConsent from '@/components/CookieConsent'

type Props = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalDocumentLayout({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 text-gray-900 hover:text-amber-700 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <ForgeLabLogo size={28} />
              </div>
              <span className="text-lg font-semibold tracking-tight">ForgeLab</span>
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <Link href="/privatliv" className="hover:text-gray-900">
                Privatlivspolitik
              </Link>
              <Link href="/vilkar" className="hover:text-gray-900">
                Vilkår
              </Link>
              <Link href="/cookies" className="hover:text-gray-900">
                Cookies
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800"
              >
                Log ind
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-12 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-800/90 mb-2">Juridisk</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-gray-500 mb-10">Senest opdateret: {lastUpdated}</p>
          <div className="space-y-5 text-sm text-gray-700 leading-relaxed">{children}</div>
        </main>

        <footer className="border-t border-gray-200/80 bg-white/60 mt-12">
          <div className="container mx-auto px-6 py-8 text-center text-sm text-gray-500">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
              ← Tilbage til forsiden
            </Link>
          </div>
        </footer>
        <CookieConsent />
      </div>
    </div>
  )
}
