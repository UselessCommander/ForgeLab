'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Layers } from 'lucide-react'
import {
  DASHBOARD_FRAMEWORK_OPTIONS,
  getDashboardFrameworkPhases,
  getDefaultDashboardPhase,
  getToolsForFrameworkPhase,
  type DashboardFrameworkId,
  type DashboardFrameworkPhaseId,
} from '@/lib/dashboard-phase-tools'
import type { DesignThinkingPhase, DoubleDiamondPhase, GoogleDesignSprintPhase } from '@/lib/frameworks'
import { getMethodCatalogEntries, getMethodPageHref } from '@/lib/method-catalog'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import DoubleDiamondDiagram, { type DiamondDiagramSelection } from '@/components/dashboard/DoubleDiamondDiagram'
import DesignThinkingDiagram from '@/components/dashboard/DesignThinkingDiagram'
import DesignSprintRedesign from '@/components/metoder/DesignSprintRedesign'
import GvDesignSprintPlaybook from '@/components/metoder/GvDesignSprintPlaybook'

const FRAMEWORK_DIAGRAM_LABEL: Record<DashboardFrameworkId, string> = {
  'double-diamond': 'Double Diamond',
  'design-thinking': 'Design Thinking',
  'google-design-sprint': 'GV Design Sprint',
}

export type MethodsFrameworkSelection = {
  framework: DashboardFrameworkId
  phase: DashboardFrameworkPhaseId | 'across'
}

type MethodsPhaseId = MethodsFrameworkSelection['phase']

type MethodsFrameworkExplorerProps = {
  activeFramework?: DashboardFrameworkId
  activePhase?: MethodsPhaseId
  onSelectionChange?: (selection: MethodsFrameworkSelection) => void
}

export default function MethodsFrameworkExplorer({
  activeFramework: controlledFramework,
  activePhase: controlledPhase,
  onSelectionChange,
}: MethodsFrameworkExplorerProps) {
  const [internalFramework, setInternalFramework] = useState<DashboardFrameworkId>('double-diamond')
  const [internalPhase, setInternalPhase] = useState<MethodsPhaseId>(() =>
    getDefaultDashboardPhase('double-diamond')
  )
  const [showDiagram, setShowDiagram] = useState(true)
  const phaseCardRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({})
  const sprintDayRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({})

  const activeFramework = controlledFramework ?? internalFramework
  const selectedPhase = controlledPhase ?? internalPhase

  const phases = getDashboardFrameworkPhases(activeFramework)

  useEffect(() => {
    if (controlledFramework) return
    setInternalPhase(getDefaultDashboardPhase(activeFramework))
  }, [activeFramework, controlledFramework])

  useEffect(() => {
    if (activeFramework !== 'google-design-sprint') return
    if (selectedPhase === 'across') return
    sprintDayRefs.current[selectedPhase]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeFramework, selectedPhase])

  const applySelection = (framework: DashboardFrameworkId, phase: MethodsPhaseId) => {
    if (!controlledFramework) setInternalFramework(framework)
    if (!controlledPhase) setInternalPhase(phase)
    onSelectionChange?.({ framework, phase })
  }

  const handleFrameworkChange = (framework: DashboardFrameworkId) => {
    const phase = getDefaultDashboardPhase(framework)
    applySelection(framework, phase)
  }

  const scrollToPhase = (phaseId: string) => {
    phaseCardRefs.current[phaseId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleDiagramSelect = (selection: string) => {
    if (activeFramework === 'double-diamond') {
      const dd = selection as DiamondDiagramSelection
      if (dd === 'hmw') {
        applySelection('double-diamond', 'define')
        scrollToPhase('define')
        return
      }
      applySelection('double-diamond', dd)
      scrollToPhase(dd)
      return
    }
    const phase = selection as MethodsPhaseId
    applySelection(activeFramework, phase)
    scrollToPhase(phase)
  }

  const phaseGridClass =
    phases.length >= 5
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'

  const acrossMethods = getMethodCatalogEntries().filter((m) => {
    if (activeFramework === 'double-diamond') return m.primaryPhase === 'across'
    if (activeFramework === 'design-thinking') return m.primaryDesignThinkingPhase === 'across'
    return false
  })

  return (
    <section id="metoder-frameworks" className="mb-10 scroll-mt-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900">
            <Layers className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-gray-900 md:text-lg">
              Visuelle frameworks
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {activeFramework === 'google-design-sprint'
                ? 'GV Design Sprint — klik en dag i overviewet eller playbook for at se aktiviteter og filtrere linkede værktøjer.'
                : 'Double Diamond, Design Thinking og GV Design Sprint — klik en fase for at filtrere metoder.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDiagram((v) => !v)}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:self-auto"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDiagram ? 'rotate-180' : ''}`} />
          {showDiagram ? 'Skjul model' : `Vis ${FRAMEWORK_DIAGRAM_LABEL[activeFramework]}`}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {DASHBOARD_FRAMEWORK_OPTIONS.map((fw) => {
          const isActive = activeFramework === fw.id
          return (
            <button
              key={fw.id}
              type="button"
              onClick={() => handleFrameworkChange(fw.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200/60 hover:bg-gray-50'
              }`}
            >
              {fw.label}
            </button>
          )
        })}
      </div>

      {showDiagram && (
        <div className="swiss-panel mb-4 overflow-x-auto p-4 md:p-6">
          {activeFramework === 'google-design-sprint' ? (
            <div className="min-w-0">
              <DesignSprintRedesign
                selectedPhase={
                  selectedPhase !== 'across' ? (selectedPhase as GoogleDesignSprintPhase) : undefined
                }
                onPhaseSelect={(dayId) => {
                  applySelection('google-design-sprint', dayId)
                }}
              />
              <div className="mt-6 border-t border-gray-200/80 pt-6">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Framework → Dag → Aktivitet
                </p>
                <GvDesignSprintPlaybook
                  selectedDayId={
                    selectedPhase !== 'across' ? (selectedPhase as GoogleDesignSprintPhase) : undefined
                  }
                  onDaySelect={(dayId) => {
                    applySelection('google-design-sprint', dayId)
                  }}
                  dayRefs={sprintDayRefs}
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full min-w-0 max-w-4xl">
              {activeFramework === 'double-diamond' && (
                <DoubleDiamondDiagram
                  activeSelection={
                    selectedPhase === 'across' ? null : (selectedPhase as DoubleDiamondPhase)
                  }
                  onSelect={handleDiagramSelect}
                />
              )}
              {activeFramework === 'design-thinking' && (
                <DesignThinkingDiagram
                  activeSelection={
                    selectedPhase === 'across' ? null : (selectedPhase as DesignThinkingPhase)
                  }
                  onSelect={handleDiagramSelect}
                />
              )}
            </div>
          )}
        </div>
      )}

      {activeFramework !== 'google-design-sprint' && (
        <div className={phaseGridClass}>
          {phases.map((phase) => {
            const tools = getToolsForFrameworkPhase(activeFramework, phase.id as DashboardFrameworkPhaseId, 6)
            const isSelected = selectedPhase === phase.id
            return (
              <div
                key={phase.id}
                ref={(el) => {
                  phaseCardRefs.current[phase.id] = el
                }}
                role="button"
                tabIndex={0}
                onClick={() => applySelection(activeFramework, phase.id as MethodsPhaseId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    applySelection(activeFramework, phase.id as DashboardFrameworkPhaseId)
                  }
                }}
                className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-200/80'
                    : 'border-gray-200/80 hover:border-amber-200/60'
                }`}
              >
                <p
                  className={`mb-0.5 text-xs font-bold uppercase tracking-widest ${
                    isSelected ? 'text-amber-700' : 'text-gray-400'
                  }`}
                >
                  {phase.label}
                </p>
                <p className="mb-3 text-[11px] leading-snug text-gray-500">{phase.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tools.length === 0 ? (
                    <span className="text-xs text-gray-400">Ingen metoder i denne fase endnu.</span>
                  ) : (
                    tools.map((tool) => {
                      const { Icon, bg, text } = getToolIcon(tool.slug)
                      return (
                        <Link
                          key={tool.slug}
                          href={getMethodPageHref(tool.slug)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-800 transition-colors hover:border-amber-200/60 hover:bg-white"
                          title={tool.shortDescription}
                        >
                          <span
                            className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${bg} ${text}`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="max-w-[8rem] truncate">{tool.title}</span>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {acrossMethods.length > 0 && activeFramework !== 'google-design-sprint' && (
        <div
          className={`mt-4 rounded-2xl border bg-white p-4 shadow-sm transition-all ${
            selectedPhase === 'across'
              ? 'border-slate-400 ring-2 ring-slate-200/80'
              : 'border-gray-200/80'
          }`}
        >
          <button
            type="button"
            onClick={() => applySelection(activeFramework, 'across')}
            className="mb-3 w-full text-left"
          >
            <p
              className={`text-xs font-bold uppercase tracking-widest ${
                selectedPhase === 'across' ? 'text-slate-700' : 'text-gray-400'
              }`}
            >
              Across process
            </p>
            <p className="text-[11px] leading-snug text-gray-500">
              Planlægning og workflow på tværs af hele designprocessen — ikke en diamantfase.
            </p>
          </button>
          <div className="flex flex-wrap gap-1.5">
            {acrossMethods.map((tool) => {
              const { Icon, bg, text } = getToolIcon(tool.slug)
              return (
                <Link
                  key={tool.slug}
                  href={getMethodPageHref(tool.slug)}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-800 transition-colors hover:border-amber-200/60 hover:bg-white"
                  title={tool.shortDescription}
                >
                  <span
                    className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${bg} ${text}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="max-w-[8rem] truncate">{tool.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
