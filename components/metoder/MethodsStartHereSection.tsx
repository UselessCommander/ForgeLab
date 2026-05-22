'use client'

import { Sparkles } from 'lucide-react'
import MethodCompactCard from '@/components/metoder/MethodCompactCard'
import type { MethodCatalogEntry } from '@/lib/method-catalog'

type MethodsStartHereSectionProps = {
  methods: MethodCatalogEntry[]
  isFavorite: (slug: string) => boolean
  onToggleFavorite: (slug: string) => void
  canPersistFavorites: boolean
}

export default function MethodsStartHereSection({
  methods,
  isFavorite,
  onToggleFavorite,
  canPersistFavorites,
}: MethodsStartHereSectionProps) {
  if (methods.length === 0) return null

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">Start her</h2>
          <p className="text-xs text-gray-500">Ofte brugte metoder til konceptudvikling.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => (
          <MethodCompactCard
            key={method.slug}
            method={method}
            isFavorite={isFavorite(method.slug)}
            onToggleFavorite={onToggleFavorite}
            canPersistFavorites={canPersistFavorites}
            showCta
          />
        ))}
      </div>
    </section>
  )
}
