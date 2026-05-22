import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import type { MethodRelatedMethod } from '@/lib/method-content'
import { getMethodPageHref } from '@/lib/method-catalog'
import { resolveRelatedMethod } from '@/lib/method-content'

type MethodRelatedMethodsProps = {
  related: MethodRelatedMethod[]
}

export default function MethodRelatedMethods({ related }: MethodRelatedMethodsProps) {
  if (related.length === 0) return null

  return (
    <section id="relaterede-metoder" className="scroll-mt-28 mb-10">
      <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">
        Relaterede metoder
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {related.map((item) => {
          const resolved = resolveRelatedMethod(item)
          if (resolved.slug) {
            const { Icon, bg, text } = getToolIcon(resolved.slug)
            return (
              <li key={resolved.slug}>
                <Link
                  href={getMethodPageHref(resolved.slug)}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-amber-200/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900 group-hover:text-amber-950">
                    {resolved.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <div className="flex h-full items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3.5">
                <span className="text-sm font-medium text-gray-500">{resolved.label}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
