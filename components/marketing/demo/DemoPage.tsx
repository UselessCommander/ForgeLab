'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import DemoWorkspacePreview from './DemoWorkspacePreview'
import { DEMO_EXPLAINER } from '@/lib/marketing-demo-data'

export default function DemoPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8 md:pt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Demo</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Se hvordan ForgeLab fungerer
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-500">
            Få et hurtigt kig ind i et ForgeLab-projekt. Se hvordan boards, metoder, research,
            AI-hjælp og output hænger sammen i ét arbejdsrum.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600"
            >
              Prøv ForgeLab
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo-workspace"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-800 transition hover:border-gray-300"
            >
              Se demoen
            </a>
          </div>
        </div>
      </section>

      {/* Demo workspace — hero of the page */}
      <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-20">
        <DemoWorkspacePreview />
      </section>

      {/* Explainer */}
      <section className="border-y border-gray-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Hvad du ser i demoen
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_EXPLAINER.map(item => (
              <div key={item.tab} className="rounded-2xl border border-gray-200 bg-[#fafbfc] p-5">
                <p className="text-sm font-extrabold text-amber-700">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-amber-50/40 to-white px-8 py-12 text-center md:px-14 md:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Klar til at bygne dit eget projekt?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500 leading-relaxed">
            Start med et workspace, vælg dine metoder og saml dit output ét sted.
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
