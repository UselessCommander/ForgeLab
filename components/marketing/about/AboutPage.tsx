import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AboutHeroVisual from './AboutHeroVisual'
import {
  ABOUT_AUDIENCES,
  ABOUT_CAPABILITIES,
  ABOUT_METHOD_NAMES,
  ABOUT_PRINCIPLES,
  ABOUT_PROBLEMS,
  ABOUT_STEPS,
} from '@/lib/marketing-about-data'

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">{children}</p>
  )
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-14 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionEyebrow>Om ForgeLab</SectionEyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:leading-[1.1]">
              Et digitalt arbejdsrum til bedre konceptudvikling
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
              ForgeLab er skabt til at gøre metodearbejde mere konkret. I stedet for at modeller,
              frameworks og analyser ender som løse noter, samler ForgeLab dem i interaktive
              værktøjer, der kan bruges direkte i projekter, rapporter, workshops og præsentationer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600"
              >
                Kom i gang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/metoder"
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-800 transition hover:border-gray-300"
              >
                Se metoder
              </Link>
            </div>
          </div>
          <AboutHeroVisual />
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-gray-200/80 bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Metoder er stærke. Men de bliver ofte brugt for løst.
          </h2>
          <p className="mt-4 max-w-3xl text-gray-500 leading-relaxed">
            Mange projekter starter med gode frameworks, men ender med spredte noter, screenshots,
            slides og utydelige konklusioner. ForgeLab er bygget til at samle processen, så metoder
            ikke bare bliver nævnt, men faktisk anvendt.
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {ABOUT_PROBLEMS.map(point => (
              <li
                key={point}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-600"
              >
                <span className="mb-2 block h-1 w-8 rounded-full bg-amber-400" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <SectionEyebrow>Filosofi</SectionEyebrow>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Fra model til metodearbejde
        </h2>
        <p className="mt-4 max-w-3xl text-gray-500 leading-relaxed">
          ForgeLab bygger på idéen om, at en model først skaber værdi, når den hjælper brugeren med
          at tænke, vælge, prioritere og dokumentere. Derfor er værktøjerne bygget som interaktive
          metodeflader, ikke bare statiske skabeloner.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ABOUT_PRINCIPLES.map((item, i) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="text-sm font-extrabold text-amber-700">Princip {i + 1}</span>
              <h3 className="mt-2 text-lg font-extrabold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* What ForgeLab does */}
      <section className="border-y border-gray-200/80 bg-[#fffbeb]/40">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Hvad ForgeLab hjælper med
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT_CAPABILITIES.map(item => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-extrabold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Bygget til dem der arbejder med idéer, brugere og koncepter
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {ABOUT_AUDIENCES.map(item => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-extrabold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-gray-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Sådan fungerer ForgeLab
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ABOUT_STEPS.map(item => (
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

      {/* Method credibility */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Bygget omkring kendte metoder
        </h2>
        <p className="mt-4 max-w-3xl text-gray-500 leading-relaxed">
          ForgeLab samler metoder fra UX, strategi, marketing, innovation og projektarbejde. Fra Double
          Diamond og Service Blueprint til PESO, JTBD, Golden Circle og Pirate Funnel.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {ABOUT_METHOD_NAMES.map(name => (
            <span
              key={name}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Origin */}
      <section className="border-t border-gray-200/80 bg-white/70">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Skabt ud fra et konkret behov
          </h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            ForgeLab startede som et værktøj til at gøre digital konceptudvikling mere praktisk. Når
            man arbejder med mange metoder, analyser og outputs, opstår der hurtigt et behov for ét
            sted, hvor processen kan samles og gøres brugbar.
          </p>
          <p className="mt-4 text-gray-500 leading-relaxed">
            Platformen udspringer af praktisk arbejde med digital konceptudvikling, frontend, UX og
            metodebaserede studieprojekter — med fokus på at gøre frameworks til noget, man faktisk
            kan arbejde med og dokumentere.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-amber-50/50 to-white px-8 py-12 text-center md:px-14 md:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Gør metodearbejde til noget du faktisk kan bruge
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500 leading-relaxed">
            Start med en metode, byg dit projekt op og få output du kan tage videre.
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
