import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">ForgeLab</div>
            <Link 
              href="/login"
              className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
            >
              Log Ind
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              ForgeLab
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Et professionelt værktøjssuite til moderne digitale løsninger
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Generer QR-koder, track scanninger, og meget mere. Alt på ét sted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/login"
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Kom i Gang
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-200 hover:scale-105"
              >
                Log Ind
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Funktioner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">🔲</div>
                <h3 className="text-xl font-semibold mb-3">QR Code Generator</h3>
                <p className="text-gray-300">
                  Generer professionelle QR-koder med tracking funktionalitet og custom branding.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
                <p className="text-gray-300">
                  Følg scanninger i real-time med detaljerede statistikker og insights.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-3">Kommende Snart</h3>
                <p className="text-gray-300">
                  Flere værktøjer er på vej. Hold øje med opdateringerne.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Klar til at komme i gang?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Log ind for at få adgang til alle værktøjerne
            </p>
            <Link 
              href="/login"
              className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Log Ind Nu
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 text-center text-gray-400">
          <p>ForgeLab - Bygget med ❤️</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
