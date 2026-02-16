import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { LayoutGrid, ArrowRight, LogIn } from 'lucide-react'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

export const metadata = {
  title: 'Flere værktøjer | ForgeLab',
  description: 'Udforsk ForgeLabs værktøjer: SWOT, Business Model Canvas, Gantt, Kompasrose, TOWS, Porters Five Forces og mere. Alt i ét dashboard.',
}

export default function VaerktoejerPage() {
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log ind
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-16 max-w-5xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 mb-6">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Flere værktøjer
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              SWOT, Business Model Canvas, Gantt, Kompasrose og mere. Udforsk beskrivelser og bruge værktøjerne fra dit dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VAERKTOEJER.map((v) => {
              const { Icon, bg, text } = getToolIcon(v.slug)
              return (
                <Link
                  key={v.slug}
                  href={`/vaerktoejer/${v.slug}`}
                  className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-violet-200/80 transition-all duration-300 block text-left"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} ${text} mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                    {v.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {v.shortDescription}
                  </p>
                  <span className="inline-flex items-center gap-2 text-violet-600 font-medium text-sm">
                    Læs mere
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-12 p-6 bg-violet-50 border border-violet-200/80 rounded-2xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <p className="text-gray-700 mb-4">
              Alle værktøjer er tilgængelige efter login fra dit dashboard.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors"
            >
              Log ind for at bruge værktøjerne
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-2">
              ← Tilbage til forsiden
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
