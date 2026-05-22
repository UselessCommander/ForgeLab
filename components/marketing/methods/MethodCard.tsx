import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { MarketingMethod } from '@/lib/marketing-methods'

type MethodCardProps = {
  method: MarketingMethod
}

export default function MethodCard({ method }: MethodCardProps) {
  const external = method.href.startsWith('http')
  const className =
    'group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md'

  const inner = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
          {method.category}
        </span>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          {method.phase}
        </span>
      </div>
      <h3 className="text-lg font-extrabold tracking-tight text-gray-900 group-hover:text-amber-800">
        {method.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{method.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
        Se metode
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </>
  )

  if (method.href.startsWith('#')) {
    return (
      <a href={method.href} className={className}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={method.href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {inner}
    </Link>
  )
}
