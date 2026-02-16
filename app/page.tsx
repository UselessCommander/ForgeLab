import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large geometric shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-40"></div>
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:64px_64px] opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">F</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ForgeLab
              </span>
            </div>
            <Link 
              href="/login"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Log Ind
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-8">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-700 font-medium">Live nu - Nye værktøjer tilføjet</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-gray-900">
                  ForgeLab
                </h1>
                
                {/* Subtitle */}
                <p className="text-2xl md:text-3xl text-gray-700 mb-6 leading-relaxed font-medium">
                  Et professionelt værktøjssuite til moderne digitale løsninger
                </p>
                
                {/* Description */}
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                  Generer QR-koder, track scanninger, analysér data og meget mere. 
                  <span className="font-semibold text-gray-900"> Alt på ét sted.</span>
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link 
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Kom i Gang
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link 
                    href="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-bold text-lg hover:border-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    Se Demo
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                  <div>
                    <div className="text-4xl font-black text-purple-600 mb-1">10+</div>
                    <div className="text-sm text-gray-600 font-medium">Værktøjer</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-indigo-600 mb-1">100%</div>
                    <div className="text-sm text-gray-600 font-medium">Gratis</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-purple-600 mb-1">24/7</div>
                    <div className="text-sm text-gray-600 font-medium">Tilgængelig</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual Element */}
              <div className="relative">
                <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-12 border-4 border-gray-900 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <div className="w-12 h-12 bg-indigo-600 rounded-lg mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <div className="w-12 h-12 bg-pink-600 rounded-lg mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-80"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-400 rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                  Funktioner
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Alt hvad du har brug for til at skabe, analysere og optimere
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature Card 1 */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 hover:shadow-xl group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">
                    QR Code Generator
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Generer professionelle QR-koder med tracking funktionalitet, custom branding og avancerede indstillinger.
                  </p>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl group">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Analytics Dashboard
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Følg scanninger i real-time med detaljerede statistikker, visualiseringer og actionable insights.
                  </p>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-pink-500 transition-all duration-300 hover:shadow-xl group">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-pink-600 transition-colors">
                    Kommende Snart
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Flere værktøjer er på vej. Hold øje med opdateringerne og bliv den første til at prøve nye features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-gray-900 text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Klar til at komme i gang?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Log ind for at få adgang til alle værktøjerne og begynd at skabe i dag
              </p>
              <Link 
                href="/login"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Log Ind Nu
                <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900">ForgeLab</span>
              </div>
              <p className="text-gray-600">
                Bygget med <span className="text-red-500">❤️</span> for moderne digitale løsninger
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
