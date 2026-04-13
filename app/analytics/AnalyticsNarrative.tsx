import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Brain,
  Cpu,
  LineChart,
  LogIn,
  Radar,
  RefreshCw,
  Telescope,
  TrendingUp,
} from 'lucide-react'
import ScrollReveal from './ScrollReveal'

/** Ét lag: hvid flise, tynd kant — uden ekstra ring/skygge oven i */
const tile = 'rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7'

const kicker = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500'

function IconTile({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${className ?? 'bg-indigo-50 text-indigo-600 ring-indigo-100/80'}`}
    >
      {children}
    </div>
  )
}

export default function AnalyticsNarrative({ isLoggedIn, charts }: { isLoggedIn: boolean; charts: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero — fuld bredde */}
      <ScrollReveal className="relative mb-10 text-center md:mb-12">
        <p
          className={`${kicker} mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/90 px-3 py-1.5 text-indigo-800`}
        >
          <LineChart className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
          ForgeLab · QR analytics
        </p>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-700/30">
          <BarChart3 className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Analytics Dashboard
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
          Scanninger, enheder og tid samlet som i et moderne SaaS-overblik — tydeligt hierarki og rolige farver, så du
          hurtigt kan handle på tallene.
        </p>
      </ScrollReveal>

      {/* Bento: kontekst-fliser (3 kolonner på stor skærm) */}
      <ScrollReveal className="relative mb-10 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        <article className={`${tile} lg:col-span-5`}>
          <IconTile>
            <Radar className="h-5 w-5" aria-hidden />
          </IconTile>
          <p className={`${kicker} mb-2 text-indigo-600`}>Scan → datapunkt</p>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Hvad sker der ved et scan?</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Enheden afkoder QR’en og åbner dit link. ForgeLab registrerer tidspunkt og kontekst, så du kan koble scans til
            kampagner, print og fysiske touchpoints — uden manuelle logfiler.
          </p>
        </article>

        <article className={`${tile} lg:col-span-4`}>
          <IconTile>
            <Cpu className="h-5 w-5" aria-hidden />
          </IconTile>
          <p className={`${kicker} mb-2 text-indigo-600`}>Tre lag</p>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">KPI → grafer → detaljer</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
            <li>
              <span className="font-medium text-slate-800">KPI-kort</span> — hurtigt overblik til status og ledelse.
            </li>
            <li>
              <span className="font-medium text-slate-800">Grafer</span> — ugedag, enheder og 7-dages trend.
            </li>
            <li>
              <span className="font-medium text-slate-800">Log</span> — enkelte scans til QA og dokumentation.
            </li>
          </ul>
        </article>

        <article className={`${tile} flex flex-col lg:col-span-3`}>
          <IconTile>
            <Telescope className="h-5 w-5" aria-hidden />
          </IconTile>
          <p className={`${kicker} mb-2 text-indigo-600`}>Fortolkning</p>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Sådan læser du graferne</h2>
          <ul className="mt-auto space-y-2.5 text-sm leading-relaxed text-slate-600">
            <li>
              <span className="font-medium text-slate-800">Ugedag</span> — spidser peger ofte på events eller udsendelser.
            </li>
            <li>
              <span className="font-medium text-slate-800">Enheder</span> — mobil vs. desktop styrer prioritering af UX.
            </li>
            <li>
              <span className="font-medium text-slate-800">Trend</span> — momentum og effekt efter kampagner.
            </li>
          </ul>
        </article>

        {/* Status-flise: demo vs. live (bento “meta” kort) */}
        <div
          className={`${tile} flex flex-col justify-between gap-4 sm:flex-row sm:items-center lg:col-span-12 lg:flex-row`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">
              <RefreshCw className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Data i realtid</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Graferne opdateres automatisk, mens du er på siden — samme mønster som i et finans-dashboard.
              </p>
            </div>
          </div>
          {!isLoggedIn ? (
            <p className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 sm:max-w-xs">
              Demo-tal: log ind for at se dine egne trackede QR-koder.
            </p>
          ) : (
            <p className="shrink-0 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-950 sm:max-w-xs">
              Du ser data bundet til din ForgeLab-bruger.
            </p>
          )}
        </div>
      </ScrollReveal>

      {/* Data-bento leveres af AnalyticsCharts */}
      <ScrollReveal className="relative mb-10">{charts}</ScrollReveal>

      {/* Afslutning: to fliser + evt. CTA */}
      <div className="relative mb-10 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        <ScrollReveal className={`${tile} lg:col-span-7`}>
          <IconTile>
            <Brain className="h-5 w-5" aria-hidden />
          </IconTile>
          <p className={`${kicker} mb-2 text-indigo-600`}>Produktfilosofi</p>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Klarhed frem for støj</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Vi bygger analytics som i et SaaS-produkt: forudsigelige komponenter og tekst ved siden af tallene — så du
            slipper for at gætte, hvad et felt betyder. Først kontekst, derefter grafer: fra indsigt til handling uden at
            drukne i rå data.
          </p>
        </ScrollReveal>

        {isLoggedIn ? (
          <ScrollReveal className={`${tile} border-indigo-200/60 bg-gradient-to-b from-indigo-50/40 to-white lg:col-span-5`}>
            <IconTile className="bg-white text-indigo-600 ring-indigo-100">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </IconTile>
            <p className={`${kicker} mb-2 text-indigo-600`}>Næste skridt</p>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Brug tallene aktivt</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Juster destinationer, print eller kampagner ud fra mønstrene — og fortsæt i ForgeLab-workspace med projekter
              og øvrige værktøjer, når du er klar.
            </p>
          </ScrollReveal>
        ) : (
          <>
            <ScrollReveal className={`${tile} lg:col-span-5`}>
              <p className={`${kicker} mb-2`}>ForgeLab</p>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Produktet</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Analytics hører til QR-flowet: trackede koder, scanninger og deling af overblikket internt — uden at flytte
                scripts mellem sites.
              </p>
            </ScrollReveal>

            <ScrollReveal className={`${tile} lg:col-span-6`}>
              <p className={`${kicker} mb-2`}>Ansvar</p>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 md:text-xl">Privatliv</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Tracking skal give værdi og respekt for den der scanner. Brug metadata ansvarligt og i tråd med gældende
                regler — især hvis du kombinerer med andre datasæt.
              </p>
            </ScrollReveal>

            <ScrollReveal className={`${tile} flex flex-col items-center justify-center text-center lg:col-span-6`}>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Se dine egne tal</h3>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-slate-600">
                Opret adgang og kobl dine trackede QR-koder — samme overblik med rigtige data.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Log ind
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </ScrollReveal>
          </>
        )}
      </div>

      <ScrollReveal className="text-center pb-4">
        <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
          ← Tilbage til forsiden
        </Link>
      </ScrollReveal>
    </div>
  )
}
