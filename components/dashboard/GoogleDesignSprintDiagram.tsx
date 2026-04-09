'use client'

import type { GoogleDesignSprintPhase } from '@/lib/frameworks'

export type SprintDiagramSelection = GoogleDesignSprintPhase

type Props = {
  readOnly?: boolean
  activeSelection?: SprintDiagramSelection
  onSelect?: (selection: SprintDiagramSelection) => void
}

const STEPS: Array<{ id: GoogleDesignSprintPhase; day: string; label: string; short: string }> = [
  { id: 'understand', day: 'Mandag', label: 'Understand', short: 'Kortlæg mål, indsigt og udfordringer' },
  { id: 'sketch', day: 'Tirsdag', label: 'Sketch', short: 'Skitsér mange mulige løsninger' },
  { id: 'decide', day: 'Onsdag', label: 'Decide', short: 'Vælg retning og testhypotese' },
  { id: 'prototype', day: 'Torsdag', label: 'Prototype', short: 'Byg en realistisk prototype' },
  { id: 'test', day: 'Fredag', label: 'Test', short: 'Test med brugere og lær hurtigt' },
]

export default function GoogleDesignSprintDiagram({
  readOnly = false,
  activeSelection = 'understand',
  onSelect,
}: Props) {
  return (
    <div className="w-full min-w-[800px]">
      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((step, i) => {
          const active = activeSelection === step.id
          return (
            <button
              key={step.id}
              type="button"
              onClick={readOnly ? undefined : () => onSelect?.(step.id)}
              className={`relative rounded-xl border p-3 text-left transition ${
                readOnly
                  ? 'cursor-default border-amber-200 bg-amber-50/55'
                  : active
                    ? 'cursor-pointer border-amber-500 bg-amber-100/70 shadow-sm'
                    : 'cursor-pointer border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">{step.day}</span>
                <span className="text-[10px] font-semibold text-neutral-400">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p className="text-sm font-bold text-neutral-900">{step.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{step.short}</p>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-neutral-500">
        Google Design Sprint: 5-dages ramme for at løse kritiske spørgsmål gennem design, prototyping og test.
      </p>
    </div>
  )
}
