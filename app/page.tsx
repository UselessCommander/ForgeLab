import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-1/4 -right-4 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Animated Lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 md:py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <span className="text-xl font-bold">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ForgeLab
              </span>
            </div>
            <Link 
              href="/login"
              className="group relative px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
            >
              <span className="relative z-10">Log Ind</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16 md:py-24 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">Live nu - Nye værktøjer tilføjet</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent animate-gradient">
                ForgeLab
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 leading-relaxed font-light">
              Et professionelt værktøjssuite til moderne digitale løsninger
            </p>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Generer QR-koder, track scanninger, analysér data og meget mere. 
              <span className="text-white/80 font-medium"> Alt på ét sted.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Kom i Gang
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/login"
                className="group px-8 py-4 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
              >
                Se Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 border-t border-white/10">
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  10+
                </div>
                <div className="text-sm text-gray-400">Værktøjer</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-400">Gratis</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-400">Tilgængelig</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Funktioner
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Alt hvad du har brug for til at skabe, analysere og optimere
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature Card 1 */}
              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 rounded-2xl transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-indigo-400 group-hover:bg-clip-text transition-all duration-300">
                    QR Code Generator
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Generer professionelle QR-koder med tracking funktionalitet, custom branding og avancerede indstillinger.
                  </p>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    Analytics Dashboard
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Følg scanninger i real-time med detaljerede statistikker, visualiseringer og actionable insights.
                  </p>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                    Kommende Snart
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Flere værktøjer er på vej. Hold øje med opdateringerne og bliv den første til at prøve nye features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-12 md:p-16 border border-white/20 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
              </div>
              
              <div className="relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  Klar til at komme i gang?
                </h2>
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Log ind for at få adgang til alle værktøjerne og begynd at skabe i dag
                </p>
                <Link 
                  href="/login"
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                >
                  <span className="relative z-10">Log Ind Nu</span>
                  <svg className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">F</span>
              </div>
              <span className="text-lg font-semibold">ForgeLab</span>
            </div>
            <p className="text-gray-400 text-sm">
              Bygget med <span className="text-red-400">❤️</span> for moderne digitale løsninger
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
