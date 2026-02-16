import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import RegisterFormClient from './RegisterFormClient'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-hidden relative">
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none animate-gradient-shift"
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 25%, #fefce8 50%, #fffbeb 75%, #fef3c7 100%)',
        }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/90 via-transparent to-amber-50/40 pointer-events-none" />

      {/* Floating decorative blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-32 right-16 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '-2s' }} />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '-4s' }} />

      <div className="relative z-10">
        <nav className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-shadow hover:shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-all duration-300 group-hover:scale-105">
                  <ForgeLabLogo size={28} />
                </div>
                <span className="text-xl font-semibold text-gray-900 tracking-tight">ForgeLab</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Log Ind
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-md animate-scale-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-amber-100/80 shadow-xl shadow-amber-500/10 p-8 md:p-10 animate-glow-pulse">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30 mb-5 animate-logo-float">
                  <ForgeLabLogo size={36} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Opret bruger</h1>
                <p className="text-gray-600 mt-1">Opret en konto og kom i gang</p>
              </div>
              <RegisterFormClient />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
