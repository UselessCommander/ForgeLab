'use client'

import Link from 'next/link'
import { BookOpen, LayoutTemplate, Wrench, Compass, Star } from 'lucide-react'
import { getMethodCatalogEntry } from '@/lib/method-catalog'

const LINKS = [
  {
    href: '/metodebibliotek',
    label: 'Metoder',
    description: 'Find det rigtige værktøj',
    icon: BookOpen,
  },
  {
    href: '/templates',
    label: 'Templates',
    description: 'Projektstartere',
    icon: LayoutTemplate,
  },
  {
    href: '/vaerktojer',
    label: 'Værktøjer',
    description: 'Uden projekt',
    icon: Wrench,
  },
  {
    href: '/metodebibliotek#guide',
    label: 'Metodeguide',
    description: 'Hvilken metode skal jeg bruge?',
    icon: Compass,
  },
] as const

type DashboardQuickLinksProps = {
  favoriteSlugs?: string[]
}

export default function DashboardQuickLinks({ favoriteSlugs = [] }: DashboardQuickLinksProps) {
  const favorites = favoriteSlugs
    .map((slug) => getMethodCatalogEntry(slug))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .slice(0, 4)

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-base font-extrabold tracking-tight text-gray-900 md:text-lg">Hurtige genveje</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-amber-200/60 hover:shadow-md"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-gray-900">{link.label}</span>
                <span className="block text-xs text-gray-500">{link.description}</span>
              </span>
            </Link>
          )
        })}
      </div>

      {favorites.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
            <h3 className="text-sm font-bold text-gray-900">Dine favoritmetoder</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.map((method) => (
              <Link
                key={method.slug}
                href={`/metodebibliotek?highlight=${encodeURIComponent(method.slug)}`}
                className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {method.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
