'use client'

import { GOOGLE_DESIGN_SPRINT_PHASES } from '@/lib/frameworks'
import {
  METHOD_DESIGN_THINKING_PHASES,
  METHOD_DIAMOND_PHASES,
  METHOD_LIBRARY_CATEGORIES,
  type MethodLibraryCategoryId,
} from '@/lib/method-catalog'
import type { MethodsFrameworkSelection } from '@/components/metoder/MethodsFrameworkExplorer'

type MethodFiltersProps = {
  frameworkFilter: MethodsFrameworkSelection | null
  categoryFilter: MethodLibraryCategoryId | 'all'
  onFrameworkFilterChange: (selection: MethodsFrameworkSelection | null) => void
  onCategoryFilterChange: (category: MethodLibraryCategoryId | 'all') => void
  onFrameworkPhaseSelect: (selection: MethodsFrameworkSelection) => void
}

function FilterChip({
  active,
  onClick,
  children,
  variant = 'neutral',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'neutral' | 'accent'
}) {
  const activeClass =
    variant === 'accent'
      ? 'border-amber-400 bg-amber-500 text-white'
      : 'border-gray-900 bg-gray-900 text-white'
  const inactiveClass =
    variant === 'accent'
      ? 'border-amber-100 bg-amber-50 text-amber-900 hover:bg-amber-100'
      : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active ? activeClass : inactiveClass
      }`}
    >
      {children}
    </button>
  )
}

export default function MethodFilters({
  frameworkFilter,
  categoryFilter,
  onFrameworkFilterChange,
  onCategoryFilterChange,
  onFrameworkPhaseSelect,
}: MethodFiltersProps) {
  const activeFramework = frameworkFilter?.framework ?? 'double-diamond'
  const phaseOptions =
    activeFramework === 'design-thinking'
      ? METHOD_DESIGN_THINKING_PHASES
      : activeFramework === 'google-design-sprint'
        ? GOOGLE_DESIGN_SPRINT_PHASES.map((p) => ({ id: p.id, label: `${p.label}` }))
        : METHOD_DIAMOND_PHASES

  return (
    <div className="mb-6 space-y-5">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Fase</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!frameworkFilter} onClick={() => onFrameworkFilterChange(null)}>
            Alle faser
          </FilterChip>
          {phaseOptions.map((phase) => (
            <FilterChip
              key={phase.id}
              active={frameworkFilter?.framework === activeFramework && frameworkFilter.phase === phase.id}
              onClick={() =>
                onFrameworkPhaseSelect({
                  framework: activeFramework,
                  phase: phase.id,
                })
              }
            >
              {phase.label}
            </FilterChip>
          ))}
        </div>
        {frameworkFilter && frameworkFilter.framework === 'google-design-sprint' && (
          <p className="mt-2 text-xs text-gray-500">
            Fasefilter fra framework-modellen ovenfor.{' '}
            <button
              type="button"
              onClick={() => onFrameworkFilterChange(null)}
              className="font-semibold text-amber-700 underline-offset-2 hover:underline"
            >
              Vis alle faser
            </button>
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kategori</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={categoryFilter === 'all'}
            onClick={() => onCategoryFilterChange('all')}
            variant="accent"
          >
            Alle kategorier
          </FilterChip>
          {METHOD_LIBRARY_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.id}
              active={categoryFilter === cat.id}
              onClick={() => onCategoryFilterChange(cat.id)}
              variant="accent"
            >
              {cat.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  )
}
