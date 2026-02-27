import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import CookieConsent from '@/components/CookieConsent'
import {
  QrCode,
  BarChart3,
  Sparkles,
  LogIn,
  ArrowRight,
  Zap,
  Shield,
  LayoutGrid,
  Rocket,
  CheckCircle2,
  Users,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                  <ForgeLabLogo size={28} />
                </div>
                <span className="text-xl font-semibold text-gray-900 tracking-tight">
                  ForgeLab
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogIn className="w-4 h-4" />
                Log Ind
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section - CTA venstre, visuelt til højre */}
        <section className="container mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Venstre: Tekst + CTA */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Professionelt værktøjssuite
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 tracking-tight mb-6 leading-[1.1]">
                ForgeLab
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-4 leading-relaxed">
                Moderne digitale værktøjer til QR-koder, analyser og meget mere
              </p>
              <p className="text-lg text-gray-500 mb-10 max-w-lg">
                Alt samlet ét sted. Opret konto og kom i gang på få minutter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-semibold text-lg hover:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  Kom i Gang
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Opret Bruger
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Gratis at starte
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Ingen kreditkort
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Opmærksom support
                </span>
              </div>
            </div>

            {/* Højre: Visuelt element - dashboard-mockup / værktøjs-preview */}
            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {/* Bageste kort - dybde */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl transform rotate-3 scale-95 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white rounded-3xl transform -rotate-2 scale-[0.98] border border-gray-200/80 shadow-xl" />
                {/* Forreste kort - "app preview" */}
                <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-200/50 p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Dashboard</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="aspect-square rounded-xl bg-amber-50 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="aspect-square rounded-xl bg-sky-50 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-sky-600" />
                    </div>
                    <div className="aspect-square rounded-xl bg-violet-50 flex items-center justify-center">
                      <LayoutGrid className="w-8 h-8 text-violet-600" />
                    </div>
                  </div>
                  <div className="h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-end justify-around gap-1 p-3">
                    <div className="w-8 h-[35%] min-h-2 bg-amber-200/80 rounded-t" />
                    <div className="w-8 h-[60%] min-h-2 bg-amber-300/80 rounded-t" />
                    <div className="w-8 h-[40%] min-h-2 bg-amber-200/80 rounded-t" />
                    <div className="w-8 h-[80%] min-h-2 bg-amber-400/80 rounded-t" />
                    <div className="w-8 h-[50%] min-h-2 bg-amber-200/80 rounded-t" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Scanninger · seneste 7 dage</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hvad kan du lave?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Et samlet suite af værktøjer designet til at spare dig tid og give indsigt
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-6 group-hover:bg-amber-100 transition-colors">
                  <QrCode className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  QR Code Generator
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Generer professionelle QR-koder med tracking. Følg scanninger og download som PNG.
                </p>
                <Link
                  href="/try/qr-generator"
                  className="inline-flex items-center gap-2 mt-4 text-amber-600 font-medium hover:text-amber-700"
                >
                  Prøv nu
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="group bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-sky-50 text-sky-600 mb-6 group-hover:bg-sky-100 transition-colors">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time statistik over scanninger. Se antal, tidspunkter og enkeltscan-detaljer.
                </p>
                <Link
                  href="/analytics"
                  className="inline-flex items-center gap-2 mt-4 text-sky-600 font-medium hover:text-sky-700"
                >
                  Se dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="group bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-violet-50 text-violet-600 mb-6 group-hover:bg-violet-100 transition-colors">
                  <LayoutGrid className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Flere værktøjer
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  SWOT, Business Model Canvas, Gantt, Kompasrose og mere. Alt i ét dashboard.
                </p>
                <Link
                  href="/vaerktoejer"
                  className="inline-flex items-center gap-2 mt-4 text-violet-600 font-medium hover:text-violet-700"
                >
                  Udforsk værktøjer
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why ForgeLab */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              Hvorfor ForgeLab?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Hurtigt</h3>
                  <p className="text-sm text-gray-600">Kom i gang på få minutter uden kompleks opsætning</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sikkert</h3>
                  <p className="text-sm text-gray-600">Dine data er beskyttet med moderne sikkerhed</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Brugerorienteret</h3>
                  <p className="text-sm text-gray-600">Designet så alle kan bruge det uden manual</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 p-10 md:p-14 text-white shadow-xl shadow-amber-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-6">
                  <Rocket className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Klar til at komme i gang?
                </h2>
                <p className="text-lg text-amber-100 mb-8 max-w-xl mx-auto">
                  Log ind eller opret en bruger og få adgang til alle værktøjerne med det samme.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-all duration-200 shadow-lg"
                  >
                    Log Ind
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white border-2 border-white/40 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200"
                  >
                    Opret Bruger
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200/80 bg-white/50">
          <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ForgeLabLogo size={24} />
                <span className="text-gray-600 font-medium">ForgeLab</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/login" className="hover:text-gray-900 transition-colors">
                  Log Ind
                </Link>
                <Link href="/register" className="hover:text-gray-900 transition-colors">
                  Opret Bruger
                </Link>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              Bygget med ❤️ — Professionelle værktøjer til alle
            </p>
          </div>
        </footer>
        <CookieConsent />
      </div>
    </div>
  )
}
