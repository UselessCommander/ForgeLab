'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, Trash2, User } from 'lucide-react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { getProjectToolData } from '@/lib/projects'

// ─── Types ───────────────────────────────────────────────────────────────────

type Sentiment = -2 | -1 | 0 | 1 | 2

type JourneyStep = {
  id: string
  phaseId: string
  name: string        // Touchpoint / trin-navn
  action: string      // Hvad gør brugeren?
  thought: string     // Hvad tænker/føler brugeren?
  sentiment: Sentiment // Emotionel score
  pains: string[]     // Udfordringer
  gains: string[]     // Muligheder/gains
  opportunity: string // Designmulighed/indsigt
}

type JourneyPhase = {
  id: string
  label: string
  color: string
}

type PersonaData = {
  name?: string
  age?: string
  role?: string
  context?: string
  quote?: string
}

type JourneyData = {
  persona: string
  scenario: string
  linkedPersona: PersonaData | null
  phases: JourneyPhase[]
  steps: JourneyStep[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const PHASE_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', header: 'bg-violet-500' },
  { bg: 'bg-sky-500',    light: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    header: 'bg-sky-500' },
  { bg: 'bg-amber-500',  light: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  header: 'bg-amber-500' },
  { bg: 'bg-emerald-500',light: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',header: 'bg-emerald-500' },
  { bg: 'bg-rose-500',   light: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   header: 'bg-rose-500' },
  { bg: 'bg-fuchsia-500',light: 'bg-fuchsia-50',border: 'border-fuchsia-200',text: 'text-fuchsia-700',header: 'bg-fuchsia-500' },
]

const SENTIMENT_OPTIONS: { value: Sentiment; emoji: string; label: string }[] = [
  { value: -2, emoji: '😢', label: 'Meget frustreret' },
  { value: -1, emoji: '😕', label: 'Lidt frustreret' },
  { value:  0, emoji: '😐', label: 'Neutral' },
  { value:  1, emoji: '🙂', label: 'Tilfreds' },
  { value:  2, emoji: '😄', label: 'Meget glad' },
]

const sentimentColor = (v: Sentiment) => {
  if (v <= -2) return '#ef4444'
  if (v === -1) return '#f97316'
  if (v === 0)  return '#eab308'
  if (v === 1)  return '#84cc16'
  return '#22c55e'
}

const emptyStep = (phaseId: string, index: number): JourneyStep => ({
  id: createId(),
  phaseId,
  name: '',
  action: '',
  thought: '',
  sentiment: 0,
  pains: [''],
  gains: [''],
  opportunity: '',
})

const DEFAULT_PHASE_ID = 'fl-ph-1'
const DEFAULT_DATA: JourneyData = {
  persona: '',
  scenario: '',
  linkedPersona: null,
  phases: [
    { id: DEFAULT_PHASE_ID, label: 'Opmærksomhed', color: '0' },
    { id: 'fl-ph-2', label: 'Overvejelse', color: '1' },
    { id: 'fl-ph-3', label: 'Beslutning', color: '2' },
  ],
  steps: [
    emptyStep(DEFAULT_PHASE_ID, 0),
    emptyStep('fl-ph-2', 1),
    emptyStep('fl-ph-3', 2),
  ],
}

// ─── Sub-components (defined at module level to avoid re-creation on render) ──

function JourneyLabelCell({ children, cls }: { children: React.ReactNode; cls?: string }) {
  return (
    <div className={`flex items-center justify-end pr-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-r border-gray-100 ${cls ?? ''}`}>
      {children}
    </div>
  )
}

function JourneyRow({
  label, labelCls, bg, gridCols, cellCls, phases, stepsForPhase, children,
}: {
  label: string
  labelCls?: string
  bg?: string
  gridCols: string
  cellCls: string
  phases: JourneyPhase[]
  stepsForPhase: (phaseId: string) => JourneyStep[]
  children: (col: { phase: JourneyPhase; step: JourneyStep; si: number }) => React.ReactNode
}) {
  return (
    <div className={`grid border-b border-gray-100 ${bg ?? ''}`} style={{ gridTemplateColumns: gridCols }}>
      <JourneyLabelCell cls={labelCls}>{label}</JourneyLabelCell>
      {phases.flatMap((phase) => {
        const steps = stepsForPhase(phase.id)
        if (steps.length === 0) return [<div key={phase.id} className={cellCls} />]
        return steps.map((step, si) => (
          <div key={step.id} className={cellCls}>{children({ phase, step, si })}</div>
        ))
      })}
    </div>
  )
}

function normalizeData(raw: unknown): JourneyData {
  if (!raw || typeof raw !== 'object') return DEFAULT_DATA
  const r = raw as Record<string, unknown>
  const phases: JourneyPhase[] = Array.isArray(r.phases)
    ? r.phases.map((p: any, i: number) => ({
        id: p?.id || createId(),
        label: p?.label || `Fase ${i + 1}`,
        color: String(p?.color ?? i % PHASE_COLORS.length),
      }))
    : DEFAULT_DATA.phases

  const steps: JourneyStep[] = Array.isArray(r.steps)
    ? r.steps.map((s: any) => ({
        id: s?.id || createId(),
        phaseId: s?.phaseId || phases[0]?.id,
        name: s?.name || s?.stepName || '',
        action: s?.action || '',
        thought: s?.thought || '',
        sentiment: ([-2, -1, 0, 1, 2].includes(Number(s?.sentiment)) ? Number(s.sentiment) : 0) as Sentiment,
        pains: Array.isArray(s?.pains) ? s.pains : (s?.painPoint ? [s.painPoint] : ['']),
        gains: Array.isArray(s?.gains) ? s.gains : (s?.opportunity ? [s.opportunity] : ['']),
        opportunity: s?.opportunity || '',
      }))
    : DEFAULT_DATA.steps

  return {
    persona: typeof r.persona === 'string' ? r.persona : '',
    scenario: typeof r.scenario === 'string' ? r.scenario : '',
    linkedPersona: (r.linkedPersona as PersonaData | null) ?? null,
    phases,
    steps: steps.length > 0 ? steps : [emptyStep(phases[0]?.id, 0)],
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrugerrejsePage() {
  const [data, setData] = useState<JourneyData>(DEFAULT_DATA)
  const setNormalized = useCallback((raw: unknown) => {
    setData(normalizeData(raw))
  }, [])
  useProjectToolData<JourneyData>('brugerrejse', data, setNormalized as (d: JourneyData) => void)

  const [importingPersona, setImportingPersona] = useState(false)

  // ── helpers ──
  const getPhaseColor = (phase: JourneyPhase) =>
    PHASE_COLORS[Number(phase.color) % PHASE_COLORS.length] ?? PHASE_COLORS[0]

  const stepsForPhase = (phaseId: string) => data.steps.filter((s) => s.phaseId === phaseId)

  // ── mutations ──
  const setMeta = (key: 'persona' | 'scenario', value: string) =>
    setData((p) => ({ ...p, [key]: value }))

  const addPhase = () =>
    setData((p) => ({
      ...p,
      phases: [
        ...p.phases,
        {
          id: createId(),
          label: `Fase ${p.phases.length + 1}`,
          color: String(p.phases.length % PHASE_COLORS.length),
        },
      ],
    }))

  const updatePhase = (phaseId: string, label: string) =>
    setData((p) => ({ ...p, phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, label } : ph)) }))

  const removePhase = (phaseId: string) =>
    setData((p) => {
      if (p.phases.length <= 1) return p
      const next = p.phases.filter((ph) => ph.id !== phaseId)
      return {
        ...p,
        phases: next,
        steps: p.steps
          .filter((s) => s.phaseId !== phaseId)
          .map((s) => (s.phaseId === phaseId ? { ...s, phaseId: next[0].id } : s)),
      }
    })

  const addStep = (phaseId: string) =>
    setData((p) => {
      const idx = p.steps.filter((s) => s.phaseId === phaseId).length
      return { ...p, steps: [...p.steps, emptyStep(phaseId, idx)] }
    })

  const removeStep = (stepId: string) =>
    setData((p) => ({ ...p, steps: p.steps.length > 1 ? p.steps.filter((s) => s.id !== stepId) : p.steps }))

  const updateStep = (stepId: string, patch: Partial<JourneyStep>) =>
    setData((p) => ({ ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }))

  const updateListItem = (stepId: string, field: 'pains' | 'gains', idx: number, value: string) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const arr = [...s[field]]
        arr[idx] = value
        return { ...s, [field]: arr }
      }),
    }))

  const addListItem = (stepId: string, field: 'pains' | 'gains') =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === stepId ? { ...s, [field]: [...s[field], ''] } : s)),
    }))

  const removeListItem = (stepId: string, field: 'pains' | 'gains', idx: number) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const arr = s[field].filter((_, i) => i !== idx)
        return { ...s, [field]: arr.length > 0 ? arr : [''] }
      }),
    }))

  const handleImportPersona = async () => {
    const projectId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('projectId')
      : null
    if (!projectId) { alert('Åbn via et projekt for at hente Persona.'); return }
    try {
      setImportingPersona(true)
      const raw = await getProjectToolData(projectId, 'persona-canvas') as PersonaData | null
      if (!raw?.name?.trim()) { alert('Persona Canvas mangler navn.'); return }
      setData((p) => ({
        ...p,
        persona: [raw.name, raw.role].filter(Boolean).join(' – '),
        linkedPersona: { name: raw.name, age: raw.age, role: raw.role, context: raw.context, quote: raw.quote },
      }))
    } catch { alert('Kunne ikke hente persona.') }
    finally { setImportingPersona(false) }
  }

  // ── experience curve data ──
  const allSteps = useMemo(
    () => data.phases.flatMap((ph) => data.steps.filter((s) => s.phaseId === ph.id)),
    [data.phases, data.steps]
  )

  const curvePoints = useMemo(() => {
    const n = allSteps.length
    if (n === 0) return []
    return allSteps.map((s, i) => ({
      x: n === 1 ? 50 : (i / (n - 1)) * 100,
      y: 10 + ((2 - s.sentiment) / 4) * 80,
      sentiment: s.sentiment,
      name: s.name,
    }))
  }, [allSteps])

  const curvePath = useMemo(() => {
    if (curvePoints.length < 2) return ''
    return curvePoints
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = curvePoints[i - 1]
        const cpx = (prev.x + p.x) / 2
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
      })
      .join(' ')
  }, [curvePoints])

  // ── Row labels ──
  const ROW_LABEL_W = 'w-28 shrink-0'
  const ROW_LABEL_CLS = `${ROW_LABEL_W} flex items-center justify-end pr-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-r border-gray-100`

  return (
    <ToolLayout
      title="Brugerrejse"
      description="Kortlæg brugerens oplevelse trin for trin — fra første kontakt til afslutning."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-6">

        {/* ── Meta / Persona ── */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Persona & Scenarie</h2>
            </div>
            <button
              type="button"
              onClick={handleImportPersona}
              disabled={importingPersona}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 disabled:opacity-50"
            >
              {importingPersona ? 'Henter…' : 'Hent fra Persona Canvas'}
            </button>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">Persona</label>
              <input
                value={data.persona}
                onChange={(e) => setMeta('persona', e.target.value)}
                placeholder="Fx: Marie, 34, travl forælder"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">Scenarie</label>
              <input
                value={data.scenario}
                onChange={(e) => setMeta('scenario', e.target.value)}
                placeholder="Fx: Opretter sin første ordre"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>

          {data.linkedPersona?.name && (
            <div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Koblet persona: {data.linkedPersona.name}</p>
              {data.linkedPersona.quote && (
                <p className="text-xs italic text-amber-700 mt-0.5">"{data.linkedPersona.quote}"</p>
              )}
            </div>
          )}
        </section>

        {/* ── Journey Map ── */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Journey Map</h2>
              <p className="text-xs text-gray-500 mt-0.5">Faser vandret · trin lodret inden for hver fase</p>
            </div>
            <button
              type="button"
              onClick={addPhase}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              <Plus className="w-3.5 h-3.5" /> Tilføj fase
            </button>
          </div>

          {(() => {
            // ── Build flat step list in phase order ──
            const allCols: { phase: JourneyPhase; step: JourneyStep; si: number }[] = []
            data.phases.forEach((ph) => stepsForPhase(ph.id).forEach((s, si) => allCols.push({ phase: ph, step: s, si })))
            const totalCols = Math.max(allCols.length, data.phases.length)

            // CSS grid: label col (112px) + one 180px col per step (or 1 per phase if no steps)
            const stepCols = data.phases.flatMap(ph => {
              const n = stepsForPhase(ph.id).length
              return n === 0 ? ['200px'] : Array(n).fill('200px')
            })
            const gridCols = `112px ${stepCols.join(' ')}`

            // shared cell padding
            const cellCls = 'border-l border-gray-100 px-3'
            const rowProps = { gridCols, cellCls, phases: data.phases, stepsForPhase }

            return (
          <div>

              {/* ── Phase header row ── */}
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
                <div />
                {data.phases.map((phase) => {
                  const c = getPhaseColor(phase)
                  const n = Math.max(1, stepsForPhase(phase.id).length)
                  return (
                    <div key={phase.id} className="border-l border-gray-100 first:border-l-0" style={{ gridColumn: `span ${n}` }}>
                      <div className={`${c.bg} px-3 py-2 flex items-center gap-2`}>
                        <input
                          value={phase.label}
                          onChange={(e) => updatePhase(phase.id, e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-white text-xs font-bold placeholder:text-white/60 focus:outline-none border-b border-white/30 focus:border-white/80"
                          placeholder="Fasenavn"
                        />
                        <button type="button" onClick={() => addStep(phase.id)} title="Tilføj trin"
                          className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-white/20 text-white hover:bg-white/30">
                          <Plus className="w-3 h-3" />
                        </button>
                        {data.phases.length > 1 && (
                          <button type="button" onClick={() => removePhase(phase.id)} title="Fjern fase"
                            className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-white/20 text-white hover:bg-red-400/60">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── TOUCHPOINT / TRIN ── */}
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
                <JourneyLabelCell>Touchpoint</JourneyLabelCell>
                {data.phases.flatMap((phase) => {
                  const steps = stepsForPhase(phase.id)
                  const c = getPhaseColor(phase)
                  if (steps.length === 0) return [(
                    <div key={phase.id} className={cellCls + ' py-3 flex items-center justify-center'}>
                      <button type="button" onClick={() => addStep(phase.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${c.border} ${c.light} ${c.text} font-medium`}>
                        + Trin
                      </button>
                    </div>
                  )]
                  return steps.map((step, si) => (
                    <div key={step.id} className={cellCls + ' py-3'}>
                      <div className="flex items-center gap-1">
                        <span className={`inline-flex w-4 h-4 rounded-full ${c.bg} text-white text-[9px] font-bold items-center justify-center shrink-0`}>
                          {si + 1}
                        </span>
                        <input value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          placeholder={`Trin ${si + 1}`}
                          className="flex-1 min-w-0 text-xs font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-amber-400 focus:outline-none py-0.5"
                        />
                        <button type="button" onClick={() => removeStep(step.id)}
                          className="shrink-0 text-gray-300 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                })}
              </div>

              {/* ── OPLEVELSE ── */}
              {allSteps.length > 0 && (()  => {
                const H = 100
                const n = allSteps.length
                const pts = allSteps.map((s, i) => ({
                  x: ((i + 0.5) / n) * 100,
                  y: 10 + ((2 - s.sentiment) / 4) * 80,
                  sentiment: s.sentiment,
                }))
                const avgSentiment = Math.round(pts.reduce((s, p) => s + p.sentiment, 0) / pts.length) as Sentiment
                const scaledPts = pts.map(p => ({ ...p, x: p.x * 10 }))
                const path = scaledPts.length < 2 ? '' : scaledPts.map((p, i) => {
                  if (i === 0) return `M ${p.x} ${p.y}`
                  const prev = scaledPts[i - 1]
                  const cpx = (prev.x + p.x) / 2
                  return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
                }).join(' ')
                return (
                  <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
                    <JourneyLabelCell cls="text-gray-500">Oplevelse</JourneyLabelCell>
                    <div className="border-l border-gray-100 py-3 pr-3" style={{ gridColumn: `span ${stepCols.length}` }}>
                      <svg viewBox="0 0 1000 100" preserveAspectRatio="none"
                        style={{ width: '100%', height: 72, display: 'block' }}>
                        <defs>
                          {scaledPts.map((p, i) => {
                            if (i === 0) return null
                            const prev = scaledPts[i - 1]
                            return (
                              <linearGradient key={i} id={`seg-${i}`}
                                x1={prev.x} y1="0" x2={p.x} y2="0"
                                gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={sentimentColor(scaledPts[i - 1].sentiment)} />
                                <stop offset="100%" stopColor={sentimentColor(p.sentiment)} />
                              </linearGradient>
                            )
                          })}
                        </defs>
                        <line x1="0" y1="50" x2="1000" y2="50" stroke="#e5e7eb" strokeWidth="0.4" vectorEffect="nonScalingStroke" />
                        {allSteps.map((_, i) => i > 0 && (
                          <line key={i} x1={(i / n) * 1000} y1="0" x2={(i / n) * 1000} y2={H}
                            stroke="#f3f4f6" strokeWidth="0.4" vectorEffect="nonScalingStroke" />
                        ))}
                        {scaledPts.map((p, i) => {
                          if (i === 0) return null
                          const prev = scaledPts[i - 1]
                          const cpx = (prev.x + p.x) / 2
                          const d = `M ${prev.x} ${prev.y} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
                          return (
                            <path key={i} d={d} fill="none"
                              stroke={`url(#seg-${i})`}
                              strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                              vectorEffect="nonScalingStroke" />
                          )
                        })}
                      </svg>
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                        {allSteps.map((s, i) => (
                          <div key={s.id} className="text-center text-[9px] text-gray-400 truncate pt-1">
                            {s.name || `Trin ${i + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── HANDLINGER ── */}
              <JourneyRow label="Handlinger" labelCls="text-sky-600" bg="bg-sky-50/30" {...rowProps}>
                {({ step }) => (
                  <div className="py-2">
                    <textarea value={step.action}
                      onChange={(e) => updateStep(step.id, { action: e.target.value })}
                      placeholder="Hvad gør brugeren?"
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-gray-300"
                    />
                  </div>
                )}
              </JourneyRow>

              {/* ── TANKER ── */}
              <JourneyRow label="Tanker" labelCls="text-violet-600" bg="bg-violet-50/30" {...rowProps}>
                {({ step }) => (
                  <div className="py-2">
                    <textarea value={step.thought}
                      onChange={(e) => updateStep(step.id, { thought: e.target.value })}
                      placeholder='"Jeg håber det er nemt..."'
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-300 italic"
                    />
                  </div>
                )}
              </JourneyRow>

              {/* ── EMOTION ── */}
              <JourneyRow label="Emotion" labelCls="text-amber-600" bg="bg-amber-50/30" {...rowProps}>
                {({ step }) => (
                  <div className="py-3 flex items-center gap-1 flex-nowrap">
                    {SENTIMENT_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" title={opt.label}
                        onClick={() => updateStep(step.id, { sentiment: opt.value })}
                        className={`text-xl leading-none p-1 rounded-lg transition-all ${
                          step.sentiment === opt.value
                            ? 'bg-white shadow-sm scale-125 ring-2 ring-amber-400'
                            : 'opacity-40 hover:opacity-70 hover:scale-110'
                        }`}
                      >{opt.emoji}</button>
                    ))}
                  </div>
                )}
              </JourneyRow>

              {/* ── PAINS ── */}
              <JourneyRow label="Pains" labelCls="text-rose-600" bg="bg-rose-50/30" {...rowProps}>
                {({ step }) => (
                  <div className="py-2 space-y-1">
                    {step.pains.map((pain, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-rose-400 text-xs shrink-0">—</span>
                        <input value={pain}
                          onChange={(e) => updateListItem(step.id, 'pains', idx, e.target.value)}
                          placeholder="Udfordring..."
                          className="flex-1 min-w-0 text-xs text-gray-700 bg-white border border-rose-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-300 placeholder:text-gray-300"
                        />
                        {step.pains.length > 1 && (
                          <button type="button" onClick={() => removeListItem(step.id, 'pains', idx)}
                            className="text-gray-300 hover:text-rose-400 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addListItem(step.id, 'pains')}
                      className="text-[10px] text-rose-400 hover:text-rose-600 font-medium">+ Tilføj</button>
                  </div>
                )}
              </JourneyRow>

              {/* ── GAINS ── */}
              <JourneyRow label="Gains" labelCls="text-emerald-600" bg="bg-emerald-50/30" {...rowProps}>
                {({ step }) => (
                  <div className="py-2 space-y-1">
                    {step.gains.map((gain, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-emerald-400 text-xs shrink-0">+</span>
                        <input value={gain}
                          onChange={(e) => updateListItem(step.id, 'gains', idx, e.target.value)}
                          placeholder="Mulighed..."
                          className="flex-1 min-w-0 text-xs text-gray-700 bg-white border border-emerald-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-300 placeholder:text-gray-300"
                        />
                        {step.gains.length > 1 && (
                          <button type="button" onClick={() => removeListItem(step.id, 'gains', idx)}
                            className="text-gray-300 hover:text-emerald-500 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addListItem(step.id, 'gains')}
                      className="text-[10px] text-emerald-500 hover:text-emerald-700 font-medium">+ Tilføj</button>
                  </div>
                )}
              </JourneyRow>

              {/* ── INDSIGT ── */}
              <JourneyRow label="Indsigt" labelCls="text-amber-700" bg="bg-amber-50/20" {...rowProps}>
                {({ step }) => (
                  <div className="py-2">
                    <textarea value={step.opportunity}
                      onChange={(e) => updateStep(step.id, { opportunity: e.target.value })}
                      placeholder="Designmulighed / indsigt..."
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-amber-50/60 border border-amber-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-gray-300"
                    />
                  </div>
                )}
              </JourneyRow>

            </div>
            )
          })()}
        </section>

      </div>
    </ToolLayout>
  )
}
