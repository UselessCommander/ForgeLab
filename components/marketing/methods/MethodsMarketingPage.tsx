'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import MethodHeroVisual from './MethodHeroVisual'
import MethodCard from './MethodCard'
import FeaturedMethods from './FeaturedMethods'
import {
  filterMarketingMethods,
  MARKETING_FEATURED_METHODS,
  MARKETING_METHOD_FILTERS,
  MARKETING_METHODS,
  MARKETING_PROCESS_PHASES,
  type MarketingMethodFilterId,
} from '@/lib/marketing-methods'

const PROCESS_STEPS = [
  {
    step: '1',
    title: 'Vælg en metode',
    body: 'Find den model der matcher din fase — research, strategi, UX eller marketing.',
  },
  {
    step: '2',
    title: 'Udfyld den i ForgeLab',
    body: 'Arbejd interaktivt i projektet i stedet for at starte fra et tomt dokument.',
  },
  {
    step: '3',
    title: 'Brug output i rapporten',
    body: 'Eksporter klare resultater til workshop, præsentation eller beslutningsgrundlag.',
  },
]

const AREA_TAGS = [
  'Research',
  'Analyse',
  'Strategi',
  'Idégenerering',
  'Konceptudvikling',
  'Test og validering',
  'Marketing og vækst',
  'Forretningsmodel',
]

export default function MethodsMarketingPage() {
  const [filter, setFilter] = useState<MarketingMethodFilterId>('alle')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => filterMarketingMethods(MARKETING_METHODS, filter, query),
    [filter, query]
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation: fadeUp 0.55s ease both }
        .fu1 { animation: fadeUp 0.55s 0.08s ease both }
        .fu2 { animation: fadeUp 0.55s 0.16s ease both }
      `}</style>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-14 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="fu text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
              Metodebibliotek
            </p>
            <h1 className="fu1 mt-3 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Alle dine vigtigste metoder samlet ét sted
            </h1>
            <p className="fu2 mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
              ForgeLab gør modeller, frameworks og analyseværktøjer interaktive, så du kan arbejde med
              dem direkte i dine projekter og eksportere klare outputs til rapporter, præsentationer og
              workshops.
            </p>
            <div className="fu2 mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600"
              >
                Kom i gang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#metoder-grid"
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-800 transition hover:border-gray-300"
              >
                Se metoder
              </a>
            </div>
          </div>
          <div className="fu2">
            <MethodHeroVisual />
          </div>
        </div>
      </section>

      {/* Process areas */}
      <section className="border-y border-gray-200/80 bg-white/70">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">
            Hele konceptprocessen
          </p>
          <h2 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Metoder til hele konceptprocessen
          </h2>
          <p className="mt-4 max-w-2xl text-gray-500 leading-relaxed">
            ForgeLab understøtter metoder på tværs af research, analyse, strategi, idéudvikling, test og
            marketing — struktureret omkring en Double Diamond-inspireret proces.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {AREA_TAGS.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETING_PROCESS_PHASES.map(phase => (
              <div
                key={phase.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-amber-200"
              >
                <p className="text-sm font-extrabold text-amber-700">{phase.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <section id="metoder-grid" className="max-w-7xl mx-auto px-6 py-16 md:py-20 scroll-mt-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-400">
              Metodebibliotek
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              {filtered.length} metoder
            </h2>
          </div>
          <label className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Søg metode…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </label>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {MARKETING_METHOD_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(method => (
            <MethodCard key={method.id} method={method} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
            Ingen metoder matcher din søgning. Prøv et andet filter eller søgeord.
          </p>
        )}
      </section>

      {/* Model → output */}
      <section className="border-y border-gray-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">
            Fra model til output
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Se modellen — og arbejd med den
          </h2>
          <p className="mt-4 max-w-2xl text-gray-500 leading-relaxed">
            ForgeLab skiller sig ud ved at gøre modeller interaktive og dokumenterbare. Du vælger en
            metode, udfylder den i dit projekt og bruger output direkte i din rapport.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PROCESS_STEPS.map(item => (
              <div key={item.step} className="rounded-2xl border border-gray-200 bg-[#fafbfc] p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-sm font-extrabold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedMethods methods={MARKETING_FEATURED_METHODS} />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24 pt-4">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-amber-50/40 to-white px-8 py-12 text-center md:px-14 md:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Find den rigtige metode til dit næste projekt
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500 leading-relaxed">
            Uanset om du arbejder med research, strategi, UX, marketing eller konceptudvikling, kan
            ForgeLab hjælpe dig fra metodevalg til færdigt output.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600"
            >
              Kom i gang
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-gray-800 hover:border-gray-300"
            >
              Se features
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
