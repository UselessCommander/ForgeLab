'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type JourneyStep = {
  id: string
  phase: string
  touchpoint: string
  userGoal: string
  thought: string
  painPoint: string
  opportunity: string
}

type JourneyData = {
  persona: string
  scenario: string
  steps: JourneyStep[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const emptyStep = (): JourneyStep => ({
  id: createId(),
  phase: '',
  touchpoint: '',
  userGoal: '',
  thought: '',
  painPoint: '',
  opportunity: '',
})

const DEFAULT_DATA: JourneyData = {
  persona: '',
  scenario: '',
  steps: [emptyStep()],
}

export default function BrugerrejsePage() {
  const [data, setData] = useState<JourneyData>(DEFAULT_DATA)
  useProjectToolData<JourneyData>('brugerrejse', data, setData)

  const updateMeta = (key: 'persona' | 'scenario', value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateStep = (id: string, key: keyof Omit<JourneyStep, 'id'>, value: string) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === id ? { ...step, [key]: value } : step)),
    }))
  }

  const addStep = () => {
    setData((prev) => ({ ...prev, steps: [...prev.steps, emptyStep()] }))
  }

  const removeStep = (id: string) => {
    setData((prev) => {
      const filtered = prev.steps.filter((step) => step.id !== id)
      return { ...prev, steps: filtered.length > 0 ? filtered : [emptyStep()] }
    })
  }

  return (
    <ToolLayout
      title="Brugerrejse"
      description="Kortlæg brugerens oplevelse fra start til slut."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Persona</label>
            <input
              value={data.persona}
              onChange={(e) => updateMeta('persona', e.target.value)}
              placeholder="Fx: Førstegangsbruger"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Scenario</label>
            <input
              value={data.scenario}
              onChange={(e) => updateMeta('scenario', e.target.value)}
              placeholder="Fx: Opretter første projekt"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Rejsens trin</h2>
            <button
              type="button"
              onClick={addStep}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
            >
              + Tilføj trin
            </button>
          </div>
          <div className="space-y-3">
            {data.steps.map((step, index) => (
              <div key={step.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">Trin {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Slet
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    value={step.phase}
                    onChange={(e) => updateStep(step.id, 'phase', e.target.value)}
                    placeholder="Fase (fx Awareness)"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={step.touchpoint}
                    onChange={(e) => updateStep(step.id, 'touchpoint', e.target.value)}
                    placeholder="Touchpoint (fx Landing page)"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={step.userGoal}
                    onChange={(e) => updateStep(step.id, 'userGoal', e.target.value)}
                    placeholder="Brugermål"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={step.thought}
                    onChange={(e) => updateStep(step.id, 'thought', e.target.value)}
                    placeholder="Tanke/følelse"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={step.painPoint}
                    onChange={(e) => updateStep(step.id, 'painPoint', e.target.value)}
                    placeholder="Pain point"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={step.opportunity}
                    onChange={(e) => updateStep(step.id, 'opportunity', e.target.value)}
                    placeholder="Mulighed"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}

