'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { getProjectToolData } from '@/lib/projects'

type JourneyStep = {
  id: string
  phase: string
  stepName: string
  touchpoint: string
  userGoal: string
  thought: string
  painPoint: string
  opportunity: string
  experience: number // -3 (darlig) -> +3 (god)
}

type JourneyData = {
  persona: string
  scenario: string
  linkedPersona?: {
    name: string
    age?: string
    role?: string
    context?: string
    quote?: string
  } | null
  steps: JourneyStep[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const emptyStep = (): JourneyStep => ({
  id: createId(),
  phase: '',
  stepName: '',
  touchpoint: '',
  userGoal: '',
  thought: '',
  painPoint: '',
  opportunity: '',
  experience: 0,
})

const DEFAULT_DATA: JourneyData = {
  persona: '',
  scenario: '',
  linkedPersona: null,
  steps: [emptyStep()],
}

type PersonaCanvasData = {
  name?: string
  age?: string
  role?: string
  context?: string
  quote?: string
}

export default function BrugerrejsePage() {
  const [data, setData] = useState<JourneyData>(DEFAULT_DATA)
  useProjectToolData<JourneyData>('brugerrejse', data, setData)
  const chartRef = useRef<SVGSVGElement | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [importingPersona, setImportingPersona] = useState(false)

  const updateMeta = (key: 'persona' | 'scenario', value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateStep = (
    id: string,
    key: keyof Omit<JourneyStep, 'id'>,
    value: string | number
  ) => {
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

  const getProjectId = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('projectId')
  }

  const handleImportPersona = async () => {
    const projectId = getProjectId()
    if (!projectId) {
      alert('Åbn Brugerrejse via et projekt for at kunne hente Persona.')
      return
    }

    try {
      setImportingPersona(true)
      const raw = await getProjectToolData(projectId, 'persona-canvas')
      if (!raw || typeof raw !== 'object') {
        alert('Kunne ikke hente Persona Canvas-data.')
        return
      }

      const persona = raw as PersonaCanvasData
      const name = (persona.name || '').trim()
      if (!name) {
        alert('Persona Canvas mangler navn. Udfyld persona først.')
        return
      }

      const titleParts = [name, persona.role].filter(Boolean)
      setData((prev) => ({
        ...prev,
        persona: titleParts.join(' - '),
        linkedPersona: {
          name,
          age: persona.age || '',
          role: persona.role || '',
          context: persona.context || '',
          quote: persona.quote || '',
        },
      }))
    } catch (error) {
      console.error('Error importing Persona Canvas into Brugerrejse:', error)
      alert('Kunne ikke hente persona. Prøv igen.')
    } finally {
      setImportingPersona(false)
    }
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const chartWidth = 860
  const chartHeight = 260
  const padding = 36
  const minScore = -3
  const maxScore = 3

  const getYFromScore = (score: number) => {
    const normalized = (score - minScore) / (maxScore - minScore)
    return chartHeight - padding - normalized * (chartHeight - padding * 2)
  }

  const getScoreFromClientY = (clientY: number) => {
    if (!chartRef.current) return 0
    const rect = chartRef.current.getBoundingClientRect()
    const relativeY = clamp(clientY - rect.top, padding, chartHeight - padding)
    const normalized = (chartHeight - padding - relativeY) / (chartHeight - padding * 2)
    const rawScore = minScore + normalized * (maxScore - minScore)
    return clamp(Math.round(rawScore), minScore, maxScore)
  }

  const points = useMemo(() => {
    if (data.steps.length === 0) return []
    const usableWidth = chartWidth - padding * 2
    return data.steps.map((step, index) => {
      const x =
        data.steps.length === 1
          ? chartWidth / 2
          : padding + (index / (data.steps.length - 1)) * usableWidth
      const y = getYFromScore(step.experience ?? 0)
      return { x, y, score: step.experience ?? 0 }
    })
  }, [data.steps])

  useEffect(() => {
    if (draggingIndex === null) return

    const onMove = (event: MouseEvent) => {
      const nextScore = getScoreFromClientY(event.clientY)
      setData((prev) => ({
        ...prev,
        steps: prev.steps.map((step, index) =>
          index === draggingIndex ? { ...step, experience: nextScore } : step
        ),
      }))
    }

    const onUp = () => setDraggingIndex(null)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [draggingIndex])

  return (
    <ToolLayout
      title="Brugerrejse"
      description="Kortlæg brugerens oplevelse fra start til slut."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Kobl en persona manuelt fra Persona Canvas (ingen auto-sync).
            </p>
            <button
              type="button"
              onClick={handleImportPersona}
              disabled={importingPersona}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {importingPersona ? 'Henter…' : 'Hent fra Persona Canvas'}
            </button>
          </div>

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
          <div className="md:col-span-2">
            {data.linkedPersona?.name ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                <p className="font-medium">Koblet persona: {data.linkedPersona.name}</p>
                <p className="text-xs mt-1 text-amber-800/90">
                  {[
                    data.linkedPersona.role,
                    data.linkedPersona.age ? `${data.linkedPersona.age} år` : '',
                    data.linkedPersona.context,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Ingen ekstra profilinfo'}
                </p>
                {data.linkedPersona.quote && (
                  <p className="text-xs mt-1 italic text-amber-800/90">"{data.linkedPersona.quote}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Ingen persona koblet endnu.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Experience Curve</h2>
            <p className="text-sm text-gray-500">
              Træk punkterne op/ned for at vise oplevelsen gennem brugerrejsen.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <svg
              ref={chartRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-[860px] h-[260px]"
              role="img"
              aria-label="Experience curve"
            >
              {[3, 2, 1, 0, -1, -2, -3].map((tick) => {
                const y = getYFromScore(tick)
                return (
                  <g key={tick}>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                    <text x={10} y={y + 4} fontSize={11} fill="#6b7280">
                      {tick}
                    </text>
                  </g>
                )
              })}

              {points.length > 1 && (
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((p, index) => (
                <g key={data.steps[index].id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={8}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={2}
                    style={{ cursor: 'ns-resize' }}
                    onMouseDown={() => setDraggingIndex(index)}
                  />
                  <text x={p.x} y={chartHeight - 10} textAnchor="middle" fontSize={11} fill="#374151">
                    {data.steps[index].stepName || `Trin ${index + 1}`}
                  </text>
                </g>
              ))}
            </svg>
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
                    value={step.stepName}
                    onChange={(e) => updateStep(step.id, 'stepName', e.target.value)}
                    placeholder="Trin-navn (fx Overvejelse)"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
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
                <div className="mt-2">
                  <label className="text-xs text-gray-600">Experience score: {step.experience}</label>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={1}
                    value={step.experience}
                    onChange={(e) => updateStep(step.id, 'experience', Number(e.target.value))}
                    className="w-full"
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

