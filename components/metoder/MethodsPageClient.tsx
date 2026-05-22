'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import MethodCard from '@/components/metoder/MethodCard'
import MethodGuide from '@/components/metoder/MethodGuide'
import MethodFilters from '@/components/metoder/MethodFilters'
import MethodsFavoritesSection from '@/components/metoder/MethodsFavoritesSection'
import MethodsStartHereSection from '@/components/metoder/MethodsStartHereSection'
import MethodsFrameworkExplorer, {
  type MethodsFrameworkSelection,
} from '@/components/metoder/MethodsFrameworkExplorer'
import { useFavoriteMethods } from '@/lib/use-favorite-methods'
import type { MethodGuideSituationId } from '@/lib/method-guide'
import type { DashboardFrameworkId, DashboardFrameworkPhaseId } from '@/lib/dashboard-phase-tools'
import { getDefaultPhaseForTool, type GoogleDesignSprintPhase } from '@/lib/frameworks'
import { methodSlugLinkedInSprintDay } from '@/lib/gv-design-sprint-framework'
import {
  getMethodCatalogEntries,
  getStartHereMethods,
  methodMatchesDesignThinkingPhase,
  methodMatchesDiamondPhase,
  methodMatchesSearch,
  type MethodCatalogEntry,
  type MethodDesignThinkingPhase,
  type MethodDiamondPhase,
  type MethodLibraryCategoryId,
} from '@/lib/method-catalog'

function methodMatchesFrameworkPhase(
  entry: MethodCatalogEntry,
  framework: DashboardFrameworkId,
  phase: DashboardFrameworkPhaseId | MethodDiamondPhase | MethodDesignThinkingPhase
): boolean {
  if (framework === 'double-diamond') {
    return methodMatchesDiamondPhase(entry, phase as MethodDiamondPhase)
  }
  if (framework === 'design-thinking') {
    return methodMatchesDesignThinkingPhase(entry, phase as MethodDesignThinkingPhase)
  }
  if (framework === 'google-design-sprint') {
    return methodSlugLinkedInSprintDay(entry.slug, phase as GoogleDesignSprintPhase)
  }
  return getDefaultPhaseForTool(framework, entry.slug) === phase
}

export default function MethodsPageClient() {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const { favorites, toggleFavorite, isFavorite, canPersist } = useFavoriteMethods()

  const [frameworkFilter, setFrameworkFilter] = useState<MethodsFrameworkSelection | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<MethodLibraryCategoryId | 'all'>('all')
  const [guideFilterSlugs, setGuideFilterSlugs] = useState<string[] | null>(null)
  const [search, setSearch] = useState('')

  const allMethods = useMemo(() => getMethodCatalogEntries(), [])
  const startHereMethods = useMemo(() => getStartHereMethods(), [])

  const handleFrameworkSelection = (selection: MethodsFrameworkSelection) => {
    setFrameworkFilter(selection)
    setCategoryFilter('all')
    setGuideFilterSlugs(null)
  }

  const handleGuideSituationChange = (_id: MethodGuideSituationId | null, slugs: string[]) => {
    setGuideFilterSlugs(slugs.length > 0 ? slugs : null)
    if (slugs.length > 0) {
      setFrameworkFilter(null)
      setCategoryFilter('all')
    }
  }

  const filtered = useMemo(() => {
    return allMethods.filter((m) => {
      if (guideFilterSlugs && !guideFilterSlugs.includes(m.slug)) return false
      if (
        frameworkFilter &&
        !methodMatchesFrameworkPhase(m, frameworkFilter.framework, frameworkFilter.phase)
      ) {
        return false
      }
      if (
        categoryFilter !== 'all' &&
        m.libraryCategory !== categoryFilter &&
        m.designThinkingCategory !== categoryFilter
      ) {
        return false
      }
      if (!methodMatchesSearch(m, search)) return false
      return true
    })
  }, [allMethods, guideFilterSlugs, frameworkFilter, categoryFilter, search])

  const favoriteMethods = useMemo(
    () => favorites.map((slug) => allMethods.find((m) => m.slug === slug)).filter((m): m is NonNullable<typeof m> => !!m),
    [favorites, allMethods]
  )

  const countLabel =
    filtered.length === allMethods.length
      ? `${allMethods.length} metoder`
      : `${filtered.length} af ${allMethods.length} metoder`

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Metoder</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Find den metode, du sandsynligvis skal bruge nu — eller udforsk hele biblioteket.
        </p>
      </header>

      <MethodGuide
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        canPersistFavorites={canPersist}
        onSituationChange={handleGuideSituationChange}
      />

      <MethodsFrameworkExplorer
        activeFramework={frameworkFilter?.framework}
        activePhase={frameworkFilter?.phase}
        onSelectionChange={handleFrameworkSelection}
      />

      <MethodsFavoritesSection
        favorites={favoriteMethods}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        canPersistFavorites={canPersist}
        highlightSlug={highlightSlug}
      />

      <MethodsStartHereSection
        methods={startHereMethods}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        canPersistFavorites={canPersist}
      />

      <section>
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-gray-900 md:text-lg">Metodebibliotek</h2>
            <p className="mt-0.5 text-xs text-gray-500">{countLabel}</p>
          </div>
          <div className="relative w-full lg:max-w-xs lg:flex-shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg metode…"
              aria-label="Søg metode"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>

        <MethodFilters
          frameworkFilter={frameworkFilter}
          categoryFilter={categoryFilter}
          onFrameworkFilterChange={(v) => {
            setFrameworkFilter(v)
            if (v) setGuideFilterSlugs(null)
          }}
          onCategoryFilterChange={setCategoryFilter}
          onFrameworkPhaseSelect={handleFrameworkSelection}
        />

        {guideFilterSlugs && (
          <p className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-900">
            Viser metoder fra din guide-valg.{' '}
            <button
              type="button"
              onClick={() => setGuideFilterSlugs(null)}
              className="font-semibold underline-offset-2 hover:underline"
            >
              Vis alle metoder
            </button>
          </p>
        )}

        {frameworkFilter?.framework === 'google-design-sprint' && (
          <p className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-900">
            GV Design Sprint er et playbook med workshopøvelser og beslutninger. Metodebiblioteket
            viser kun ForgeLab-værktøjer, der er linket til den valgte dag — se aktiviteterne
            ovenfor.
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {frameworkFilter?.framework === 'google-design-sprint' ? (
              <>
                Ingen linkede ForgeLab-metoder for denne sprintdag. De fleste GV-aktiviteter er
                guides og workshops — se playbook ovenfor.
              </>
            ) : (
              <>Ingen metoder matcher dine filtre. Prøv at rydde søgning eller filtre.</>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((method) => (
              <MethodCard
                key={method.slug}
                method={method}
                isFavorite={isFavorite(method.slug)}
                onToggleFavorite={toggleFavorite}
                canPersistFavorites={canPersist}
                highlighted={highlightSlug === method.slug || guideFilterSlugs?.includes(method.slug)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
