import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a2f4a] text-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a3f5a_1px,transparent_1px),linear-gradient(to_bottom,#2a3f5a_1px,transparent_1px)] bg-[size:48px_48px] opacity-30"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-8 border-b border-[#2a3f5a]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <ForgeLabLogo size={40} />
              </div>
              <span className="text-2xl font-bold text-white">
                ForgeLab
              </span>
            </div>
            <Link 
              href="/login"
              className="px-6 py-3 bg-[#F97316] text-white font-semibold hover:bg-[#ea580c] transition-colors duration-200 border-2 border-[#F97316]"
            >
              Log Ind
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Left Column - Content */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a3f5a] border border-[#3a4f6a] mb-8">
                  <span className="w-2 h-2 bg-[#F97316]"></span>
                  <span className="text-sm text-gray-300 font-medium">Live nu - Nye værktøjer tilføjet</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-white">
                  ForgeLab
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed font-medium">
                  Et samlet bibliotek af strategiske, kreative og praktiske værktøjer
                </p>
                
                {/* Description */}
                <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                  Strategiske frameworks, kreative værktøjer og praktiske utilities. 
                  <span className="text-white font-semibold"> Alt på ét sted.</span>
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link 
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F97316] text-white font-bold text-lg border-2 border-[#F97316] hover:bg-[#ea580c] transition-colors duration-200"
                  >
                    Kom i Gang
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link 
                    href="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-[#3a4f6a] text-white font-bold text-lg hover:border-[#F97316] hover:text-[#F97316] transition-all duration-200"
                  >
                    Se Demo
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[#2a3f5a]">
                  <div>
                    <div className="text-4xl font-black text-[#F97316] mb-1">10+</div>
                    <div className="text-sm text-gray-400 font-medium">Værktøjer</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-[#d97706] mb-1">100%</div>
                    <div className="text-sm text-gray-400 font-medium">Gratis</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-[#d97706] mb-1">24/7</div>
                    <div className="text-sm text-gray-400 font-medium">Tilgængelig</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual Element */}
              <div className="relative">
                <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a2f4a] border-2 border-[#3a4f6a] p-6 flex items-center justify-center">
                      <ForgeLabLogo size={48} />
                    </div>
                    <div className="bg-[#1a2f4a] border-2 border-[#3a4f6a] p-6 flex items-center justify-center">
                      <ForgeLabLogo size={48} />
                    </div>
                    <div className="bg-[#1a2f4a] border-2 border-[#3a4f6a] p-6 flex items-center justify-center">
                      <ForgeLabLogo size={48} />
                    </div>
                    <div className="bg-[#1a2f4a] border-2 border-[#3a4f6a] p-6 flex items-center justify-center">
                      <ForgeLabLogo size={48} />
                    </div>
                  </div>
                </div>
                {/* Geometric accents */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#F97316]"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#F97316]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-[#1a2f4a] py-24 border-t border-[#2a3f5a]">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
                  Funktioner
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Strategiske frameworks, kreative værktøjer og praktiske utilities
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature Card 1 */}
                <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8 hover:border-[#F97316] transition-colors duration-300 group">
                  <div className="w-16 h-16 bg-[#2a3f5a] flex items-center justify-center mb-6 border-2 border-[#3a4f6a]">
                    <ForgeLabLogo size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#F97316] transition-colors">
                    QR Code Generator
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Generer professionelle QR-koder med tracking funktionalitet og avancerede indstillinger.
                  </p>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8 hover:border-[#F97316] transition-colors duration-300 group">
                  <div className="w-16 h-16 bg-[#2a3f5a] flex items-center justify-center mb-6 border-2 border-[#3a4f6a]">
                    <ForgeLabLogo size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#F97316] transition-colors">
                    Analytics Dashboard
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Følg scanninger i real-time med detaljerede statistikker og actionable insights.
                  </p>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8 hover:border-[#F97316] transition-colors duration-300 group">
                  <div className="w-16 h-16 bg-[#2a3f5a] flex items-center justify-center mb-6 border-2 border-[#3a4f6a]">
                    <ForgeLabLogo size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#F97316] transition-colors">
                    Strategiske Frameworks
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    SWOT, Porter's 5 Forces, Business Model Canvas og andre strukturelle analyser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-[#2a3f5a] border-t border-[#3a4f6a]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
                Klar til at komme i gang?
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Log ind for at få adgang til alle værktøjerne og begynd at skabe i dag
              </p>
              <Link 
                href="/login"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#F97316] text-white font-bold text-xl border-2 border-[#F97316] hover:bg-[#ea580c] transition-colors duration-200"
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
        <footer className="bg-[#1a2f4a] border-t border-[#2a3f5a] py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#F97316">
                      <rect x="30" y="20" width="40" height="15" />
                      <rect x="30" y="42.5" width="40" height="15" />
                      <rect x="30" y="65" width="40" height="15" />
                    </g>
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">ForgeLab</span>
              </div>
              <p className="text-gray-400">
                Bygget med <span className="text-[#F97316]">❤️</span> for struktureret arbejde
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
