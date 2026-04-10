'use client'

import { useCallback, useMemo, useState, type SetStateAction } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

type StageId = 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'

type FunnelAction = {
  id: string
  text: string
  impact: number // 0-100
  effort: number // 0-100
}

type FunnelStage = {
  id: StageId
  name: string
  shortName: string
  score: number // 0-100
  metricLabel: string
  note: string
  actions: FunnelAction[]
  svg: {
    fill: string
    stroke: string
    text: string
  }
}

type PirateFunnelData = {
  stages: FunnelStage[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const STAGE_DEFS: Array<Omit<FunnelStage, 'score' | 'metricLabel' | 'note' | 'actions'>> = [
  {
    id: 'acquisition',
    name: 'Acquisition',
    shortName: 'Acq',
    svg: { fill: '#eef2ff', stroke: '#4f46e5', text: '#3730a3' },
  },
  {
    id: 'activation',
    name: 'Activation',
    shortName: 'Act',
    svg: { fill: '#ecfdf5', stroke: '#059669', text: '#047857' },
  },
  {
    id: 'retention',
    name: 'Retention',
    shortName: 'Ret',
    svg: { fill: '#ccfbf1', stroke: '#0d9488', text: '#0f766e' },
  },
  {
    id: 'revenue',
    name: 'Revenue',
    shortName: 'Rev',
    svg: { fill: '#fffbeb', stroke: '#d97706', text: '#b45309' },
  },
  {
    id: 'referral',
    name: 'Referral',
    shortName: 'Ref',
    svg: { fill: '#ffe4e6', stroke: '#e11d48', text: '#be123c' },
  },
]

const DEFAULT_DATA: PirateFunnelData = {
  stages: STAGE_DEFS.map((d) => ({
    ...d,
    score: 60,
    metricLabel:
      d.id === 'acquisition'
        ? 'New users'
        : d.id === 'activation'
          ? 'Activated users'
          : d.id === 'retention'
            ? 'Retention rate'
            : d.id === 'revenue'
              ? 'Revenue conversion'
              : 'Referrals',
    note: '',
    actions: [],
  })),
}

function normalizePirateFunnelData(raw: any): PirateFunnelData {
  const stagesRaw = Array.isArray(raw?.stages) ? raw.stages : []

  return {
    stages: STAGE_DEFS.map((def) => {
      const existing = stagesRaw.find((s: any) => s?.id === def.id) ?? {}
      const score = typeof existing?.score === 'number' ? clamp(existing.score, 0, 100) : 60
      const metricLabel =
        typeof existing?.metricLabel === 'string' && existing.metricLabel.trim()
          ? existing.metricLabel
          : DEFAULT_DATA.stages.find((s) => s.id === def.id)?.metricLabel ?? ''
      const note = typeof existing?.note === 'string' ? existing.note : ''

      const actionsRaw = Array.isArray(existing?.actions) ? existing.actions : []
      const actions: FunnelAction[] = actionsRaw
        .filter((a: any) => a && typeof a === 'object')
        .map((a: any) => ({
          id: typeof a.id === 'string' && a.id ? a.id : createId(),
          text: typeof a.text === 'string' ? a.text : '',
          impact: typeof a.impact === 'number' ? clamp(a.impact, 0, 100) : 50,
          effort: typeof a.effort === 'number' ? clamp(a.effort, 0, 100) : 50,
        }))

      return {
        ...def,
        score,
        metricLabel,
        note,
        actions,
      }
    }),
  }
}

export default function PirateFunnelPage() {
  const [data, setInternal] = useState<PirateFunnelData>(() => normalizePirateFunnelData(DEFAULT_DATA))
  const setDataNormalized = useCallback((next: SetStateAction<PirateFunnelData>) => {
    setInternal((prev) =>
      normalizePirateFunnelData(typeof next === 'function' ? (next as any)(prev) : next)
    )
  }, [])
  useProjectToolData<PirateFunnelData>('pirate-funnel', data, setDataNormalized)

  const stages = data.stages
  const [expandedActions, setExpandedActions] = useState<Record<StageId, boolean>>({
    acquisition: false,
    activation: false,
    retention: false,
    revenue: false,
    referral: false,
  })

  const updateStage = (stageId: StageId, patch: Partial<FunnelStage>) => {
    setDataNormalized((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)),
    }))
  }

  const addAction = (stageId: StageId) => {
    setDataNormalized((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              actions: [
                ...s.actions,
                {
                  id: createId(),
                  text: '',
                  impact: 50,
                  effort: 50,
                },
              ],
            }
          : s
      ),
    }))
  }

  const removeAction = (stageId: StageId, actionId: string) => {
    setDataNormalized((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === stageId ? { ...s, actions: s.actions.filter((a) => a.id !== actionId) } : s
      ),
    }))
  }

  const updateAction = (
    stageId: StageId,
    actionId: string,
    patch: Partial<FunnelAction>
  ) => {
    setDataNormalized((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => {
        if (s.id !== stageId) return s
        return {
          ...s,
          actions: s.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
        }
      }),
    }))
  }

  const funnelSvg = useMemo(() => {
    const svgW = 320
    const svgH = 250
    const cx = svgW / 2
    const maxW = svgW - 40
    const minW = 70
    const stageH = svgH / Math.max(1, stages.length)

    const wFor = (score: number) => clamp((score / 100) * maxW, minW, maxW)

    const segments = stages.map((stage, i) => {
      const topY = i * stageH
      const botY = (i + 1) * stageH

      const topW = wFor(stage.score)
      const botW = wFor(stages[i + 1]?.score ?? stage.score)

      const topLeft = cx - topW / 2
      const topRight = cx + topW / 2
      const botLeft = cx - botW / 2
      const botRight = cx + botW / 2

      const points = `${topLeft},${topY} ${topRight},${topY} ${botRight},${botY} ${botLeft},${botY}`

      return {
        id: stage.id,
        points,
        label: stage.shortName,
        score: stage.score,
        midY: topY + stageH / 2,
        svg: stage.svg,
      }
    })

    return { svgW, svgH, segments }
  }, [stages])

  return (
    <ToolLayout
      title="Pirate Funnel (AARRR)"
      description="Kortlæg vækst med Acquisition, Activation, Retention, Revenue og Referral."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm lg:w-[430px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Funnel overview</h2>
              <p className="text-sm text-gray-500 mt-1">
                Juster score (0-100) pr. AARRR-trin — tallene bruges til at forme funnel-visningen.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-center">
              <div className="text-xs text-amber-800 font-semibold uppercase tracking-wide">Overall</div>
              <div className="text-xs text-amber-900/80 mt-0.5">({stages.length} trin)</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-[#fafafa] p-4">
            <svg viewBox={`0 0 ${funnelSvg.svgW} ${funnelSvg.svgH}`} className="w-full h-[200px]" aria-hidden>
                  {funnelSvg.segments.map((seg) => (
                <g key={seg.id}>
                  <polygon points={seg.points} fill={seg.svg.fill} stroke={seg.svg.stroke} strokeWidth={2} />
                  <text
                    x="160"
                    y={seg.midY - 3}
                    textAnchor="middle"
                    fontSize="12"
                    fill={seg.svg.text}
                    fontWeight={800}
                  >
                    {seg.label}
                  </text>
                  {/* score-tallet er fjernet for at holde modellen kompakt */}
                </g>
              ))}
            </svg>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm flex-1">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">AARRR trin</h2>
            <p className="text-sm text-gray-500">
              Juster score, definer metric-label og skriv noter. Tilføj derefter konkrete actions/hypoteser pr. trin.
            </p>
          </div>

          <div className="space-y-3">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="rounded-2xl border border-gray-200 bg-gray-50/40 p-3"
              >
                <div className="flex items-start justify-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center rounded-lg px-2 py-1 border`}
                        style={{
                          background: stage.svg.fill,
                          borderColor: stage.svg.stroke,
                          color: stage.svg.text,
                        }}
                      >
                        {stage.shortName}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900">{stage.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {stage.metricLabel || 'Metric'} - score påvirker kun visualiseringen.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Metric score (0-100)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={stage.score}
                      onChange={(e) => updateStage(stage.id, { score: clamp(Number(e.target.value), 0, 100) })}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Metric label</label>
                    <input
                      value={stage.metricLabel}
                      onChange={(e) => updateStage(stage.id, { metricLabel: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Fx: Activation rate"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Note / kontekst</label>
                  <textarea
                    value={stage.note}
                    onChange={(e) => updateStage(stage.id, { note: e.target.value })}
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    placeholder="Hvad siger jeres data? Hvad er årsagen til lav/høj score?"
                  />
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Actions / Hypoteser</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedActions((prev) => ({
                            ...prev,
                            [stage.id]: !prev[stage.id],
                          }))
                        }
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {expandedActions[stage.id] ? 'Skjul' : `Åbn (${stage.actions.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedActions((prev) => ({ ...prev, [stage.id]: true }))
                          addAction(stage.id)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
                      >
                        + Tilføj
                      </button>
                    </div>
                  </div>

                  {expandedActions[stage.id] ? (
                    stage.actions.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Ingen actions endnu. Tilføj en hypotes til at forbedre dette trin.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {stage.actions.map((a) => (
                          <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <input
                                value={a.text}
                                onChange={(e) => updateAction(stage.id, a.id, { text: e.target.value })}
                                onKeyDown={(e) =>
                                  deleteEmptyFieldRow(e, a.text, stage.actions.length > 1, () =>
                                    removeAction(stage.id, a.id)
                                  )
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                placeholder="Fx: Opdater onboarding-flow for at øge Activation rate"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Impact (0-100)</label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={a.impact}
                                  onChange={(e) =>
                                    updateAction(stage.id, a.id, {
                                      impact: clamp(Number(e.target.value), 0, 100),
                                    })
                                  }
                                  className="w-full accent-amber-600"
                                />
                                <div className="text-xs text-gray-500">{a.impact}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">Effort (0-100)</label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={a.effort}
                                  onChange={(e) =>
                                    updateAction(stage.id, a.id, {
                                      effort: clamp(Number(e.target.value), 0, 100),
                                    })
                                  }
                                  className="w-full accent-sky-600"
                                />
                                <div className="text-xs text-gray-500">{a.effort}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-gray-500">Actions: {stage.actions.length}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}

