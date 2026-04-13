import Link from 'next/link'
import { LayoutGrid, ArrowRight } from 'lucide-react'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import { getVaerktoejerGroupedByKategori } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

export const metadata = {
  title: 'Flere værktøjer | ForgeLab',
  description: 'Udforsk ForgeLabs værktøjer: SWOT, Business Model Canvas, Gantt, Kompasrose, TOWS, Porters Five Forces og mere. Alt i ét dashboard.',
}

export default async function VaerktoejerPage() {
  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Dashboard
          </Link>
        }
      />
      <main className="layout-page py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mb-6">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Flere værktøjer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            SWOT, Business Model Canvas, Gantt, Kompasrose og mere. Udforsk beskrivelser og åbn værktøjerne fra dit dashboard.
          </p>
        </div>

        <div className="space-y-12">
          {getVaerktoejerGroupedByKategori().map(({ kategori, tools }) => (
            <section key={kategori.id}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{kategori.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((v) => {
                  const { Icon, bg, text } = getToolIcon(v.slug)
                  return (
                    <Link
                      key={v.slug}
                      href={`/tools/${v.slug}`}
                      className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 block text-left"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} ${text} mb-4 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {v.shortDescription}
                      </p>
                      <span className="inline-flex items-center gap-2 text-amber-600 font-medium text-sm">
                        Åbn værktøj
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-2 transition-colors">
            ← Tilbage til forsiden
          </Link>
        </div>
      </main>
    </PageShell>
  )
}
