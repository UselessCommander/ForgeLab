import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                ForgeLab
              </h1>
              <p className="text-gray-600 text-lg md:text-xl mb-8">
                Et samlet værktøjssuite med forskellige online værktøjer
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/admin"
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  📊 Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="group bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl mb-4">🔲</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              QR Code Generator
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Generer QR-koder med tracking funktionalitet. Følg hvor mange gange din QR-kode bliver scannet.
            </p>
            <Link 
              href="/tools/qr-generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
            >
              Brug Værktøj
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 mt-16">
          <p className="text-sm md:text-base">ForgeLab - Bygget med ❤️</p>
        </footer>
      </div>
    </div>
  )
}
