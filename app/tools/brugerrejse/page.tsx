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
  if (v === 0)  return '#94a3b8'
  if (v === 1)  return '#22c55e'
  return '#10b981'
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
  const [data, setInternal] = useState<JourneyData>(DEFAULT_DATA)
  const setData = useCallback((next: JourneyData | ((p: JourneyData) => JourneyData)) => {
    setInternal((prev) => normalizeData(typeof next === 'function' ? next(prev) : next))
  }, [])
  useProjectToolData<JourneyData>('brugerrejse', data, setData)

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
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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

          <div className="overflow-x-auto">
            <div className="min-w-[640px]">

              {/* ── Phase header row ── */}
              <div className="flex border-b border-gray-100">
                <div className={ROW_LABEL_W} />
                {data.phases.map((phase, pi) => {
                  const c = getPhaseColor(phase)
                  const count = Math.max(1, stepsForPhase(phase.id).length)
                  return (
                    <div
                      key={phase.id}
                      className="flex-shrink-0 border-l border-gray-100 first:border-l-0"
                      style={{ width: `${count * 180}px` }}
                    >
                      <div className={`${c.bg} px-3 py-2 flex items-center gap-2`}>
                        <input
                          value={phase.label}
                          onChange={(e) => updatePhase(phase.id, e.target.value)}
                          className="flex-1 bg-transparent text-white text-xs font-bold placeholder:text-white/60 focus:outline-none border-b border-white/30 focus:border-white/80"
                          placeholder="Fasenavn"
                        />
                        <button
                          type="button"
                          onClick={() => addStep(phase.id)}
                          title="Tilføj trin"
                          className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-white/20 text-white hover:bg-white/30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {data.phases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhase(phase.id)}
                            title="Fjern fase"
                            className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-white/20 text-white hover:bg-red-400/60"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Helper: render one row across all phases/steps ── */}
              {(() => {
                // Build a flat ordered list of [phase, step, stepIndexWithinPhase]
                const allCols: { phase: JourneyPhase; step: JourneyStep; si: number }[] = []
                data.phases.forEach((phase) => {
                  const steps = stepsForPhase(phase.id)
                  steps.forEach((step, si) => allCols.push({ phase, step, si }))
                })

                // Map phaseId → steps for empty-phase placeholders
                const phaseStepMap = new Map(data.phases.map(ph => [ph.id, stepsForPhase(ph.id)]))

                // Shared cell style
                const cell = 'flex-shrink-0 border-l border-gray-100 first:border-l-0 px-3 min-w-[180px] w-[180px]'

                // Render a full row with label + one cell per step
                const Row = ({
                  label, labelCls, bg, children,
                }: {
                  label: string
                  labelCls: string
                  bg?: string
                  children: (col: { phase: JourneyPhase; step: JourneyStep; si: number }) => React.ReactNode
                }) => (
                  <div className={`flex border-b border-gray-100 ${bg ?? ''}`}>
                    <div className={ROW_LABEL_CLS + ' ' + labelCls}>{label}</div>
                    <div className="flex flex-1 overflow-x-visible">
                      {allCols.length === 0
                        ? data.phases.map(ph => (
                            <div key={ph.id} className={cell + ' py-3'} />
                          ))
                        : allCols.map((col) => (
                            <div key={col.step.id} className={cell}>
                              {children(col)}
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )

                return (
                  <>
                    {/* ── TOUCHPOINT / TRIN ── */}
                    <div className="flex border-b border-gray-100">
                      <div className={ROW_LABEL_CLS}>Touchpoint</div>
                      <div className="flex flex-1">
                        {allCols.length === 0
                          ? data.phases.map(ph => {
                              const c = getPhaseColor(ph)
                              return (
                                <div key={ph.id} className={cell + ' py-3 flex items-center justify-center'}>
                                  <button type="button" onClick={() => addStep(ph.id)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border ${c.border} ${c.light} ${c.text} font-medium`}>
                                    + Trin
                                  </button>
                                </div>
                              )
                            })
                          : allCols.map(({ phase, step, si }) => {
                              const c = getPhaseColor(phase)
                              return (
                                <div key={step.id} className={cell + ' py-3'}>
                                  <div className="flex items-center gap-1">
                                    <span className={`inline-flex w-4 h-4 rounded-full ${c.bg} text-white text-[9px] font-bold items-center justify-center shrink-0`}>
                                      {si + 1}
                                    </span>
                                    <input
                                      value={step.name}
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
                              )
                            })
                        }
                      </div>
                    </div>

                    {/* ── OPLEVELSE (experience curve) — above Handlinger ── */}
                    {allSteps.length > 0 && (
                      <div className="flex border-b border-gray-100">
                        <div className={ROW_LABEL_CLS + ' text-gray-500 self-center'}>Oplevelse</div>
                        <div className="flex-1 px-4 py-4 border-l border-gray-100">
                          <div className="relative h-[120px]">
                            {[0, 25, 50, 75, 100].map((pct) => (
                              <div key={pct} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${pct}%` }} />
                            ))}
                            <div className="absolute left-0 top-0 text-[9px] text-gray-400 -translate-y-1/2">😄</div>
                            <div className="absolute left-0 top-1/2 text-[9px] text-gray-400 -translate-y-1/2">😐</div>
                            <div className="absolute left-0 bottom-0 text-[9px] text-gray-400 translate-y-1/2">😢</div>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pl-5">
                              <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" vectorEffect="nonScalingStroke" />
                              {curvePath && (
                                <path d={curvePath} fill="none" stroke="url(#curveGrad)" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="nonScalingStroke" />
                              )}
                              <defs>
                                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="50%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                                <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              {curvePath && (
                                <path
                                  d={`${curvePath} L ${curvePoints[curvePoints.length - 1].x} 100 L ${curvePoints[0].x} 100 Z`}
                                  fill="url(#fillGrad)"
                                />
                              )}
                              {curvePoints.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r={2.5}
                                  fill={sentimentColor(p.sentiment)} stroke="white" strokeWidth="1.5" vectorEffect="nonScalingStroke" />
                              ))}
                            </svg>
                          </div>
                          <div className="flex mt-2 pl-5">
                            {allSteps.map((s, i) => (
                              <div key={s.id} className="flex-1 text-center text-[9px] text-gray-400 truncate px-1">
                                {s.name || `Trin ${i + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── HANDLINGER ── */}
                    <Row label="Handlinger" labelCls="text-sky-600" bg="bg-sky-50/30">
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
                    </Row>

                    {/* ── TANKER ── */}
                    <Row label="Tanker" labelCls="text-violet-600" bg="bg-violet-50/30">
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
                    </Row>

                    {/* ── EMOTION ── */}
                    <Row label="Emotion" labelCls="text-amber-600" bg="bg-amber-50/30">
                      {({ step }) => (
                        <div className="py-3 flex items-center gap-1 flex-wrap">
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
                    </Row>

                    {/* ── PAINS ── */}
                    <Row label="Pains" labelCls="text-rose-600" bg="bg-rose-50/30">
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
                    </Row>

                    {/* ── GAINS ── */}
                    <Row label="Gains" labelCls="text-emerald-600" bg="bg-emerald-50/30">
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
                    </Row>

                    {/* ── INDSIGT ── */}
                    <Row label="Indsigt" labelCls="text-amber-700" bg="bg-amber-50/20">
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
                    </Row>
                  </>
                )
              })()}

            </div>
          </div>
        </section>

      </div>
    </ToolLayout>
  )
}
