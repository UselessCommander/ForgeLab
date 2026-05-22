'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import type { MethodCatalogEntry } from '@/lib/method-catalog'
import { getMethodListCtaLabel, getMethodPageHref } from '@/lib/method-catalog'

type MethodCompactCardProps = {
  method: MethodCatalogEntry | { slug: string; title: string; shortDescription: string }
  isFavorite?: boolean
  onToggleFavorite?: (slug: string) => void
  canPersistFavorites?: boolean
  variant?: 'default' | 'chip'
  showCta?: boolean
  highlighted?: boolean
}

export default function MethodCompactCard({
  method,
  isFavorite = false,
  onToggleFavorite,
  canPersistFavorites = false,
  variant = 'default',
  showCta = true,
  highlighted = false,
}: MethodCompactCardProps) {
  const { Icon, bg, text } = getToolIcon(method.slug)
  const href = getMethodPageHref(method.slug)
  const ctaLabel = getMethodListCtaLabel()

  if (variant === 'chip') {
    return (
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition-colors ${
          highlighted ? 'border-amber-300 ring-1 ring-amber-200/80' : 'border-gray-200/80 hover:border-amber-200/60'
        }`}
      >
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${bg} ${text}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-gray-900">{method.title}</span>
        </Link>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(method.slug)}
            disabled={!canPersistFavorites}
            className={`flex-shrink-0 rounded p-1 transition-colors ${
              isFavorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'
            } disabled:opacity-50`}
            aria-label={isFavorite ? 'Fjern favorit' : 'Gem favorit'}
          >
            <Star className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    )
  }

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-amber-200/60 hover:shadow-md ${
        highlighted ? 'border-amber-300 ring-2 ring-amber-200/80' : 'border-gray-200/80'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}>
          <Icon className="h-4 w-4" />
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(method.slug)}
            disabled={!canPersistFavorites}
            title={
              canPersistFavorites
                ? isFavorite
                  ? 'Fjern fra favoritter'
                  : 'Gem som favorit'
                : 'Kræver samtykke til browser-lagring'
            }
            className={`rounded-lg p-1.5 transition-colors ${
              isFavorite ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-50 hover:text-amber-500'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-label={isFavorite ? 'Fjern favorit' : 'Tilføj favorit'}
          >
            <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <h3 className="mb-0.5 text-sm font-bold text-gray-900">
        <Link href={href} className="hover:text-amber-800">
          {method.title}
        </Link>
      </h3>
      <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{method.shortDescription}</p>
      {showCta && (
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
        >
          {ctaLabel}
        </Link>
      )}
    </article>
  )
}
