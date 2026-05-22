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
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import DoubleDiamondDiagram, { type DiamondDiagramSelection } from '@/components/dashboard/DoubleDiamondDiagram'
import DesignThinkingDiagram from '@/components/dashboard/DesignThinkingDiagram'
import GoogleDesignSprintDiagram from '@/components/dashboard/GoogleDesignSprintDiagram'

interface DashboardRecommendedMethodsProps {
  onExploreMethods?: () => void
}

const FRAMEWORK_DIAGRAM_LABEL: Record<DashboardFrameworkId, string> = {
  'double-diamond': 'Double Diamond',
  'design-thinking': 'Design Thinking',
  'google-design-sprint': 'Design Sprint',
}

export default function DashboardRecommendedMethods({}: DashboardRecommendedMethodsProps) {
  const [activeFramework, setActiveFramework] = useState<DashboardFrameworkId>('double-diamond')
  const [showDiagram, setShowDiagram] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<DashboardFrameworkPhaseId>(() =>
    getDefaultDashboardPhase('double-diamond')
  )
  const phaseCardRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({})

  const phases = getDashboardFrameworkPhases(activeFramework)

  useEffect(() => {
    setSelectedPhase(getDefaultDashboardPhase(activeFramework))
  }, [activeFramework])

  const handleFrameworkChange = (framework: DashboardFrameworkId) => {
    setActiveFramework(framework)
    setSelectedPhase(getDefaultDashboardPhase(framework))
  }

  const scrollToPhase = (phaseId: string) => {
    phaseCardRefs.current[phaseId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleDiagramSelect = (selection: string) => {
    if (activeFramework === 'double-diamond') {
      const dd = selection as DiamondDiagramSelection
      if (dd === 'hmw') {
        setSelectedPhase('define')
        scrollToPhase('define')
        return
      }
      setSelectedPhase(dd)
      scrollToPhase(dd)
      return
    }
    setSelectedPhase(selection as DashboardFrameworkPhaseId)
    scrollToPhase(selection)
  }

  const phaseGridClass =
    phases.length >= 5
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'
      : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'

  return (
    <section id="dashboard-methods" className="mb-10 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <Layers className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight">
              Anbefalede metoder efter fase
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Vælg framework, fase og start med de mest relevante værktøjer.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDiagram((v) => !v)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDiagram ? 'rotate-180' : ''}`} />
          {showDiagram ? 'Skjul overblik' : `Åbn ${FRAMEWORK_DIAGRAM_LABEL[activeFramework]}-overblik`}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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
        <div className="swiss-panel mb-4 overflow-x-auto p-4">
          <div className="mx-auto w-full min-w-0 max-w-4xl">
            {activeFramework === 'double-diamond' && (
              <DoubleDiamondDiagram
                activeSelection={selectedPhase as DoubleDiamondPhase}
                onSelect={handleDiagramSelect}
              />
            )}
            {activeFramework === 'design-thinking' && (
              <DesignThinkingDiagram
                activeSelection={selectedPhase as DesignThinkingPhase}
                onSelect={handleDiagramSelect}
              />
            )}
            {activeFramework === 'google-design-sprint' && (
              <GoogleDesignSprintDiagram
                activeSelection={selectedPhase as GoogleDesignSprintPhase}
                onSelect={handleDiagramSelect}
              />
            )}
          </div>
        </div>
      )}

      <div className={phaseGridClass}>
        {phases.map((phase) => {
          const tools = getToolsForFrameworkPhase(activeFramework, phase.id as DashboardFrameworkPhaseId)
          const isSelected = selectedPhase === phase.id
          return (
            <div
              key={phase.id}
              ref={(el) => {
                phaseCardRefs.current[phase.id] = el
              }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPhase(phase.id as DashboardFrameworkPhaseId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedPhase(phase.id as DashboardFrameworkPhaseId)
                }
              }}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-200/80 shadow-md'
                  : 'border-gray-200/80 hover:border-amber-200/60'
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${
                  isSelected ? 'text-amber-700' : 'text-gray-400'
                }`}
              >
                {phase.label}
              </p>
              <p className="text-[11px] text-gray-500 mb-3 leading-snug">{phase.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {tools.length === 0 ? (
                  <span className="text-xs text-gray-400">Ingen værktøjer i denne fase endnu.</span>
                ) : (
                  tools.map((tool) => {
                    const { Icon, bg, text } = getToolIcon(tool.slug)
                    return (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200/80 bg-gray-50 hover:bg-white hover:border-amber-200/60 text-[11px] font-semibold text-gray-800 transition-colors"
                        title={tool.shortDescription}
                      >
                        <span className={`inline-flex w-5 h-5 items-center justify-center rounded ${bg} ${text}`}>
                          <Icon className="w-3 h-3 flex-shrink-0" />
                        </span>
                        <span className="truncate max-w-[8rem]">{tool.title}</span>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
