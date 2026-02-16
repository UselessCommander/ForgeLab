import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { BarChart3, ArrowRight, LogIn, TrendingUp, Clock, MapPin, Download } from 'lucide-react'
import AnalyticsCharts from './AnalyticsCharts'

export const metadata = {
  title: 'Analytics Dashboard | ForgeLab',
  description: 'Real-time statistik over QR-scanninger. Se antal scanninger, tidspunkter og enkeltscan-detaljer i ForgeLab Analytics Dashboard.',
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="relative z-10">
        <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3">
                <ForgeLabLogo size={28} />
                <span className="font-semibold text-gray-900">ForgeLab</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log ind for dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-16 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 mb-6">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Analytics Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Få indsigt i dine QR-koders performance med real-time statistik over scanninger, tidspunkter og enkeltscan-detaljer.
            </p>
          </div>

          <AnalyticsCharts />

          <section className="prose prose-gray max-w-none mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mt-0">Hvad er Analytics Dashboard?</h2>
            <p className="text-gray-600 leading-relaxed">
              ForgeLab Analytics Dashboard giver dig overblik over, hvordan dine QR-koder bliver brugt. Når du opretter trackede QR-koder gennem ForgeLab, registrerer vi hver scanning — så du kan se antal, tidspunkter og valgfri metadata (f.eks. enhed eller placering), uden at skulle sætte ekstern analytics op.
            </p>

            <h2 className="text-2xl font-bold text-gray-900">Hvad kan du se?</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>Antal scanninger</strong> — Samlet og pr. QR-kode, så du ved hvilke links eller kampagner der performer.</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>Tidspunkter</strong> — Hvornår hver scanning skete, så du kan spotte mønstre og peak-tider.</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>Enkeltscan-detaljer</strong> — Udvidet info pr. scan (hvis du vælger at gemme det), så du får dybere indsigt.</span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span><strong>Eksport</strong> — Brug data til rapporter eller videre analyse.</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900">Hvordan kommer jeg i gang?</h2>
            <p className="text-gray-600 leading-relaxed">
              Analytics er tilgængeligt for alle, der er logget ind. Opret en bruger eller log ind, opret en tracket QR-kode via QR Code Generator, og find derefter alle statistikker under dit dashboard. Der er ingen ekstra opsætning — tracking er integreret fra start.
            </p>
          </section>

          <div className="rounded-2xl bg-sky-50 border border-sky-200/80 p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Se dit dashboard</h3>
            <p className="text-gray-600 mb-6">
              Log ind for at se real-time statistik over dine QR-scanninger.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
            >
              Log ind
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-900">
              ← Tilbage til forsiden
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
