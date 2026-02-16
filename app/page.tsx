import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-3xl p-8 md:p-12 shadow-xl border border-white/20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                ForgeLab
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl mb-8">
                Et samlet værktøjssuite med forskellige online værktøjer
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/admin"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  📊 Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="group backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl mb-4">🔲</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              QR Code Generator
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Generer QR-koder med tracking funktionalitet. Følg hvor mange gange din QR-kode bliver scannet.
            </p>
            <Link 
              href="/tools/qr-generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Brug Værktøj
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/80 mt-16">
          <p className="text-sm md:text-base">ForgeLab - Bygget med ❤️</p>
        </footer>
      </div>
    </div>
  )
}
