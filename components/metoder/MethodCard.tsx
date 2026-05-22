'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import type { MethodCatalogEntry } from '@/lib/method-catalog'
import {
  METHOD_LIBRARY_CATEGORIES,
  getCategoryLabel,
  getMethodDesignThinkingPhaseLabel,
  getMethodListCtaLabel,
  getMethodPageHref,
  getMethodPhaseLabel,
  getMethodUsageHint,
  getSecondaryDesignThinkingPhaseLabels,
  getSecondaryPhaseLabels,
} from '@/lib/method-catalog'

type MethodCardProps = {
  method: MethodCatalogEntry
  isFavorite: boolean
  onToggleFavorite: (slug: string) => void
  canPersistFavorites: boolean
  highlighted?: boolean
}

export default function MethodCard({
  method,
  isFavorite,
  onToggleFavorite,
  canPersistFavorites,
  highlighted,
}: MethodCardProps) {
  const { Icon, bg, text } = getToolIcon(method.slug)
  const dtPhaseLabel = getMethodDesignThinkingPhaseLabel(method.primaryDesignThinkingPhase)
  const ddPhaseLabel = getMethodPhaseLabel(method.primaryPhase)
  const categoryLabel =
    METHOD_LIBRARY_CATEGORIES.find((c) => c.id === method.libraryCategory)?.label ??
    getCategoryLabel(method.libraryCategory)
  const dtSecondaryLabels = getSecondaryDesignThinkingPhaseLabels(method.secondaryDesignThinkingPhases)
  const ddSecondaryLabels = getSecondaryPhaseLabels(method.secondaryPhases)
  const usageHint = getMethodUsageHint(method.slug)
  const ctaLabel = getMethodListCtaLabel()
  const methodHref = getMethodPageHref(method.slug)
  const isDtAcross = method.primaryDesignThinkingPhase === 'across'
  const isDdAcross = method.primaryPhase === 'across'

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:border-amber-200/60 hover:shadow-md ${
        highlighted ? 'border-amber-300 ring-2 ring-amber-200/80' : 'border-gray-200/80'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}>
          <Icon className="h-5 w-5" />
        </div>
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
          className={`rounded-lg p-2 transition-colors ${
            isFavorite ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-50 hover:text-amber-500'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label={isFavorite ? 'Fjern favorit' : 'Tilføj favorit'}
        >
          <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="mb-1 text-sm font-bold text-gray-900">
        <Link href={methodHref} className="hover:text-amber-800">
          {method.title}
        </Link>
      </h3>
      <p className="mb-2 line-clamp-2 flex-1 text-xs text-gray-500">{method.shortDescription}</p>

      {usageHint && (
        <p className="mb-3 text-[11px] leading-snug text-gray-400">{usageHint}</p>
      )}

      <div className="mb-2 flex flex-wrap gap-1.5">
        {dtPhaseLabel && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isDtAcross
                ? 'border-slate-300 bg-slate-100 text-slate-700'
                : 'border-teal-200 bg-teal-50 text-teal-800'
            }`}
            title="Design Thinking"
          >
            {dtPhaseLabel}
          </span>
        )}
        {ddPhaseLabel && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isDdAcross
                ? 'border-slate-300 bg-slate-100 text-slate-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
            title="Double Diamond"
          >
            {ddPhaseLabel}
          </span>
        )}
        {categoryLabel && (
          <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            {categoryLabel}
          </span>
        )}
        {method.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-gray-100 bg-gray-50/80 px-2 py-0.5 text-[10px] font-medium text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-4 space-y-1">
        {dtSecondaryLabels.length > 0 && (
          <p className="text-[10px] leading-snug text-gray-400">
            Også relevant i (Design Thinking): {dtSecondaryLabels.join(', ')}
          </p>
        )}
        {ddSecondaryLabels.length > 0 && (
          <p className="text-[10px] leading-snug text-gray-400">
            Også relevant i (Double Diamond): {ddSecondaryLabels.join(', ')}
          </p>
        )}
      </div>

      <Link
        href={methodHref}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-black"
      >
        {ctaLabel}
      </Link>
    </article>
  )
}
