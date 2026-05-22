'use client'

import type { GoogleDesignSprintPhase } from '@/lib/frameworks'
import { getGvDesignSprintDay } from '@/lib/gv-design-sprint-framework'

export type SprintDiagramSelection = GoogleDesignSprintPhase

type Props = {
  readOnly?: boolean
  activeSelection?: SprintDiagramSelection | null
  onSelect?: (selection: SprintDiagramSelection) => void
}

const DAY_ORDER: GoogleDesignSprintPhase[] = [
  'understand',
  'sketch',
  'decide',
  'prototype',
  'test',
]

export default function GoogleDesignSprintDiagram({
  readOnly = false,
  activeSelection = null,
  onSelect,
}: Props) {
  return (
    <div className="w-full min-w-[800px]">
      <div className="grid grid-cols-5 gap-2">
        {DAY_ORDER.map((phaseId, i) => {
          const day = getGvDesignSprintDay(phaseId)
          const active = activeSelection != null && activeSelection === phaseId
          return (
            <button
              key={phaseId}
              type="button"
              onClick={readOnly ? undefined : () => onSelect?.(phaseId)}
              className={`relative rounded-xl border p-3 text-left transition ${
                readOnly
                  ? 'cursor-default border-amber-200 bg-amber-50/55'
                  : active
                    ? 'cursor-pointer border-amber-500 bg-amber-100/70 shadow-sm'
                    : 'cursor-pointer border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                  {day?.dayLabel ?? ''}
                </span>
                <span className="text-[10px] font-semibold text-neutral-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="text-sm font-bold text-neutral-900">{day?.title ?? phaseId}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-600">
                {day?.goal}
              </p>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-neutral-500">
        GV Design Sprint: fem dage fra Map til Test — workshopøvelser, beslutninger og få valgfrie
        ForgeLab-værktøjer.
      </p>
    </div>
  )
}
