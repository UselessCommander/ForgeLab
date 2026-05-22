'use client'

import { useState } from 'react'
import { Compass, X } from 'lucide-react'
import MethodCompactCard from '@/components/metoder/MethodCompactCard'
import {
  METHOD_GUIDE_SITUATIONS,
  getGuideSituation,
  getGuideSuggestions,
  type MethodGuideSituationId,
} from '@/lib/method-guide'

type MethodGuideProps = {
  isFavorite: (slug: string) => boolean
  onToggleFavorite: (slug: string) => void
  canPersistFavorites: boolean
  onSituationChange?: (situationId: MethodGuideSituationId | null, slugs: string[]) => void
}

export default function MethodGuide({
  isFavorite,
  onToggleFavorite,
  canPersistFavorites,
  onSituationChange,
}: MethodGuideProps) {
  const [selected, setSelected] = useState<MethodGuideSituationId | null>(null)

  const situation = selected ? getGuideSituation(selected) : null
  const suggestions = selected ? getGuideSuggestions(selected) : []

  const selectSituation = (id: MethodGuideSituationId) => {
    const next = selected === id ? null : id
    setSelected(next)
    if (next) {
      onSituationChange?.(next, getGuideSuggestions(next).map((s) => s.slug))
    } else {
      onSituationChange?.(null, [])
    }
  }

  const clearSelection = () => {
    setSelected(null)
    onSituationChange?.(null, [])
  }

  return (
    <section id="guide" className="mb-10 scroll-mt-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-gray-900 md:text-lg">Hvilken metode skal jeg bruge?</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Vælg din situation — vi viser anbefalede metoder og filtrerer biblioteket.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {METHOD_GUIDE_SITUATIONS.map((s) => {
          const isActive = selected === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSituation(s.id)}
              aria-pressed={isActive}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-200/80 shadow-sm'
                  : 'border-gray-200 bg-gray-50/50 text-gray-800 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{s.description}</span>
            </button>
          )
        })}
      </div>

      {situation && suggestions.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900">{situation.recommendationTitle}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{situation.recommendationText}</p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
              aria-label="Ryd guidevalg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <MethodCompactCard
                key={s.slug}
                method={s}
                isFavorite={isFavorite(s.slug)}
                onToggleFavorite={onToggleFavorite}
                canPersistFavorites={canPersistFavorites}
                showCta
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            Metodebiblioteket nedenfor viser kun disse anbefalinger. Ryd valget for at se alle metoder igen.
          </p>
        </div>
      )}

      {situation && suggestions.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Ingen metoder fundet for denne situation.</p>
      )}
    </section>
  )
}
