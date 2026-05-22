import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { MarketingMethod } from '@/lib/marketing-methods'

function JtbdMini() {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-8 flex-1 rounded-md border border-violet-200 bg-violet-50 text-[8px] font-bold text-violet-700 flex items-center justify-center"
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

function PesoMini() {
  return (
    <svg viewBox="0 0 120 90" className="mx-auto h-20 w-full max-w-[140px]" aria-hidden>
      <circle cx="60" cy="28" r="22" fill="#7a3ea0" opacity="0.85" />
      <circle cx="32" cy="52" r="22" fill="#dc3f45" opacity="0.85" />
      <circle cx="88" cy="52" r="22" fill="#86cbd4" opacity="0.85" />
      <circle cx="60" cy="68" r="22" fill="#b7d94f" opacity="0.85" />
      <circle cx="60" cy="52" r="10" fill="#111827" />
    </svg>
  )
}

function GoldenCircleMini() {
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-20 w-full max-w-[100px]" aria-hidden>
      <circle cx="50" cy="50" r="42" fill="#f5f3ff" stroke="#e5e7eb" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" fill="#fffbeb" stroke="#fcd34d" strokeWidth="1" />
      <circle cx="50" cy="50" r="16" fill="#111827" />
      <text x="50" y="54" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800">
        WHY
      </text>
    </svg>
  )
}

const MINI: Record<string, () => ReactNode> = {
  jtbd: JtbdMini,
  peso: PesoMini,
  'golden-circle': GoldenCircleMini,
}

type FeaturedMethodsProps = {
  methods: MarketingMethod[]
}

export default function FeaturedMethods({ methods }: FeaturedMethodsProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <div className="mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Udvalgte metoder</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Start med de mest brugte frameworks
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {methods.map(method => {
          const Mini = MINI[method.id]
          return (
            <Link
              key={method.id}
              href={method.href}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-amber-200 hover:shadow-lg"
            >
              <div className="mb-5 min-h-[88px] rounded-xl border border-gray-100 bg-[#fafbfc] p-4">
                {Mini ? <Mini /> : null}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">{method.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{method.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                Se metode
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
