'use client'

import { Star } from 'lucide-react'
import MethodCompactCard from '@/components/metoder/MethodCompactCard'
import type { MethodCatalogEntry } from '@/lib/method-catalog'

type MethodsFavoritesSectionProps = {
  favorites: MethodCatalogEntry[]
  isFavorite: (slug: string) => boolean
  onToggleFavorite: (slug: string) => void
  canPersistFavorites: boolean
  highlightSlug?: string | null
}

export default function MethodsFavoritesSection({
  favorites,
  isFavorite,
  onToggleFavorite,
  canPersistFavorites,
  highlightSlug,
}: MethodsFavoritesSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
        <h2 className="text-base font-extrabold text-gray-900">Dine favoritter</h2>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3">
          <p className="text-xs leading-relaxed text-gray-500">
            Du har ingen favoritter endnu. Tryk på stjernen på en metode for at gemme den her.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((method) => (
            <MethodCompactCard
              key={method.slug}
              method={method}
              isFavorite={isFavorite(method.slug)}
              onToggleFavorite={onToggleFavorite}
              canPersistFavorites={canPersistFavorites}
              highlighted={highlightSlug === method.slug}
              showCta
            />
          ))}
        </div>
      )}
    </section>
  )
}
