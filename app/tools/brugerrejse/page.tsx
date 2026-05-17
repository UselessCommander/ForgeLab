'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { getProjectToolData } from '@/lib/projects'

// ─── Types ───────────────────────────────────────────────────────────────────

type Sentiment = -2 | -1 | 0 | 1 | 2

type JourneyStep = {
  id: string
  phaseId: string
  name: string        // Touchpoint / trin-navn
  activeChannelIds: string[] // ID-er på aktive kanaler i dette trin
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

type Channel = {
  id: string
  name: string
  icon: string
  order: number
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
  channels: Channel[]
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

const cleanList = (arr: string[]): string[] =>
  arr.length === 1 && arr[0] === '' ? [] : arr

// Deterministisk seed til DEFAULT_DATA — undgår SSR/CSR-hydration mismatch fra createId().
const seedStep = (id: string, phaseId: string): JourneyStep => ({
  id,
  phaseId,
  name: '',
  activeChannelIds: [],
  action: '',
  thought: '',
  sentiment: 0,
  pains: [],
  gains: [],
  opportunity: '',
})

const emptyStep = (phaseId: string, index: number): JourneyStep => ({
  ...seedStep(createId(), phaseId),
})

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'ch-search',  name: 'Search',         icon: '🔍', order: 0 },
  { id: 'ch-website', name: 'Website',        icon: '💻', order: 1 },
  { id: 'ch-email',   name: 'Email',          icon: '✉️', order: 2 },
  { id: 'ch-social',  name: 'Social media',   icon: '📱', order: 3 },
  { id: 'ch-phone',   name: 'Phone',          icon: '📞', order: 4 },
  { id: 'ch-wom',     name: 'Word of mouth',  icon: '💬', order: 5 },
]

const DEFAULT_PHASE_ID = 'fl-ph-1'
const DEFAULT_DATA: JourneyData = {
  persona: '',
  scenario: '',
  linkedPersona: null,
  channels: DEFAULT_CHANNELS,
  phases: [
    { id: DEFAULT_PHASE_ID, label: 'Opmærksomhed', color: '0' },
    { id: 'fl-ph-2', label: 'Overvejelse', color: '1' },
    { id: 'fl-ph-3', label: 'Beslutning', color: '2' },
  ],
  steps: [
    seedStep('fl-step-1', DEFAULT_PHASE_ID),
    seedStep('fl-step-2', 'fl-ph-2'),
    seedStep('fl-step-3', 'fl-ph-3'),
  ],
}

// ─── Sub-components (defined at module level to avoid re-creation on render) ──

function JourneyLabelCell({ children, cls, bg = 'bg-white' }: { children: React.ReactNode; cls?: string; bg?: string }) {
  return (
    <div className={`sticky left-0 z-10 ${bg} flex items-center justify-end pr-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 border-r border-gray-100 select-none ${cls ?? ''}`}>
      {children}
    </div>
  )
}

function stepStateCls(isSelected: boolean, isHovered: boolean) {
  if (isSelected) return 'bg-amber-50/40 ring-1 ring-inset ring-amber-200/60'
  if (isHovered) return 'bg-gray-50/60'
  return ''
}

function JourneyRow({
  label, labelCls, bg, gridCols, cellCls, phases, stepsForPhase, children,
  selectedStepId, hoveredStepId, onSelectStep, onHoverStep,
}: {
  label: string
  labelCls?: string
  bg?: string
  gridCols: string
  cellCls: string
  phases: JourneyPhase[]
  stepsForPhase: (phaseId: string) => JourneyStep[]
  children: (col: { phase: JourneyPhase; step: JourneyStep; si: number }) => React.ReactNode
  selectedStepId?: string | null
  hoveredStepId?: string | null
  onSelectStep?: (id: string) => void
  onHoverStep?: (id: string | null) => void
}) {
  return (
    <div className={`grid border-b border-gray-100 ${bg ?? ''}`} style={{ gridTemplateColumns: gridCols }}>
      <JourneyLabelCell cls={labelCls}>{label}</JourneyLabelCell>
      {phases.flatMap((phase) => {
        const steps = stepsForPhase(phase.id)
        if (steps.length === 0) return [<div key={phase.id} className={cellCls} />]
        return steps.map((step, si) => {
          const stateCls = stepStateCls(selectedStepId === step.id, hoveredStepId === step.id)
          return (
            <div
              key={step.id}
              className={`${cellCls} transition-colors ${stateCls}`}
              onMouseEnter={() => onHoverStep?.(step.id)}
              onMouseLeave={() => onHoverStep?.(null)}
              onClick={(e) => {
                if (e.target instanceof HTMLElement && e.target.closest('input, textarea, button, select, a, label'))
                  return
                onSelectStep?.(step.id)
              }}
            >
              {children({ phase, step, si })}
            </div>
          )
        })
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

  const channels: Channel[] = Array.isArray(r.channels) && (r.channels as any[]).length > 0
    ? (r.channels as any[]).map((c: any, i: number) => ({
        id: c?.id || createId(),
        name: typeof c?.name === 'string' ? c.name : `Kanal ${i + 1}`,
        icon: typeof c?.icon === 'string' && c.icon ? c.icon : '🔘',
        order: typeof c?.order === 'number' ? c.order : i,
      }))
    : DEFAULT_CHANNELS

  const channelIdSet = new Set(channels.map((c) => c.id))

  const steps: JourneyStep[] = Array.isArray(r.steps)
    ? r.steps.map((s: any) => ({
        id: s?.id || createId(),
        phaseId: s?.phaseId || phases[0]?.id,
        name: s?.name || s?.stepName || '',
        activeChannelIds: Array.isArray(s?.activeChannelIds)
          ? (s.activeChannelIds as any[]).filter((id): id is string => typeof id === 'string' && channelIdSet.has(id))
          : [],
        action: s?.action || '',
        thought: s?.thought || '',
        sentiment: ([-2, -1, 0, 1, 2].includes(Number(s?.sentiment)) ? Number(s.sentiment) : 0) as Sentiment,
        pains: cleanList(Array.isArray(s?.pains) ? s.pains : (s?.painPoint ? [s.painPoint] : [])),
        gains: cleanList(Array.isArray(s?.gains) ? s.gains : (s?.opportunity ? [s.opportunity] : [])),
        opportunity: s?.opportunity || '',
      }))
    : DEFAULT_DATA.steps

  return {
    persona: typeof r.persona === 'string' ? r.persona : '',
    scenario: typeof r.scenario === 'string' ? r.scenario : '',
    linkedPersona: (r.linkedPersona as PersonaData | null) ?? null,
    channels,
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
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const [backNav, setBackNav] = useState<{ href: string; label: string }>({
    href: '/dashboard',
    label: 'Tilbage til Dashboard',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const projectId = new URLSearchParams(window.location.search).get('projectId')
    if (projectId) {
      setBackNav({
        href: `/dashboard/projects/${encodeURIComponent(projectId)}`,
        label: 'Tilbage til projekt',
      })
    }
  }, [])

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

  const removeStep = (stepId: string) => {
    setData((p) => ({ ...p, steps: p.steps.length > 1 ? p.steps.filter((s) => s.id !== stepId) : p.steps }))
    if (selectedStepId === stepId) setSelectedStepId(null)
  }

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
        return { ...s, [field]: arr }
      }),
    }))

  // ── channel mutations ──
  const addChannel = () =>
    setData((p) => ({
      ...p,
      channels: [
        ...p.channels,
        { id: createId(), name: 'Ny kanal', icon: '🔘', order: p.channels.length },
      ],
    }))

  const updateChannel = (channelId: string, patch: Partial<Channel>) =>
    setData((p) => ({
      ...p,
      channels: p.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)),
    }))

  const removeChannel = (channelId: string) =>
    setData((p) => ({
      ...p,
      channels: p.channels.filter((c) => c.id !== channelId),
      steps: p.steps.map((s) => ({
        ...s,
        activeChannelIds: s.activeChannelIds.filter((id) => id !== channelId),
      })),
    }))

  const moveChannel = (channelId: string, direction: -1 | 1) =>
    setData((p) => {
      const idx = p.channels.findIndex((c) => c.id === channelId)
      const next = idx + direction
      if (idx < 0 || next < 0 || next >= p.channels.length) return p
      const reordered = [...p.channels]
      const [moved] = reordered.splice(idx, 1)
      reordered.splice(next, 0, moved)
      return { ...p, channels: reordered.map((c, i) => ({ ...c, order: i })) }
    })

  const toggleChannelStep = (stepId: string, channelId: string) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const has = s.activeChannelIds.includes(channelId)
        return {
          ...s,
          activeChannelIds: has
            ? s.activeChannelIds.filter((id) => id !== channelId)
            : [...s.activeChannelIds, channelId],
        }
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
    <div className="flex min-h-screen flex-col bg-[#fafbfc] text-gray-900">
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backNav.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">{backNav.label}</span>
          </Link>
          <div className="hidden h-6 w-px bg-gray-200 md:block" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 flex items-center justify-center">
              <span className="text-sm font-extrabold select-none">F</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900">Brugerrejse</h1>
              <p className="hidden truncate text-[11px] font-medium text-gray-500 md:block">
                Kortlæg brugerens oplevelse trin for trin — fra første kontakt til afslutning.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-6 py-6">
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
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">Scenarie</label>
              <input
                value={data.scenario}
                onChange={(e) => setMeta('scenario', e.target.value)}
                placeholder="Fx: Opretter sin første ordre"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                suppressHydrationWarning
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
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Journey Map</h2>
              <p className="text-xs text-gray-500 mt-0.5">Faser vandret · trin lodret inden for hver fase</p>
            </div>
            <button
              type="button"
              onClick={addPhase}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg border border-dashed border-gray-300 bg-white text-gray-600 font-medium transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Tilføj fase
            </button>
          </div>

          {(() => {
            // ── Build flat step list in phase order ──
            const allCols: { phase: JourneyPhase; step: JourneyStep; si: number }[] = []
            data.phases.forEach((ph) => stepsForPhase(ph.id).forEach((s, si) => allCols.push({ phase: ph, step: s, si })))
            const totalCols = Math.max(allCols.length, data.phases.length)

            // CSS grid: label col (112px) + minmax-cols per step så faserne udfylder hele containeren,
            // men hver kolonne beholder en minimum bredde (200px) → vandret scroll ved mange trin.
            const stepColUnit = 'minmax(200px, 1fr)'
            const stepCols = data.phases.flatMap(ph => {
              const n = stepsForPhase(ph.id).length
              return n === 0 ? [stepColUnit] : Array(n).fill(stepColUnit)
            })
            const gridCols = `144px ${stepCols.join(' ')}`

            // shared cell padding
            const cellCls = 'border-l border-gray-100 px-3'
            const rowProps = {
              gridCols,
              cellCls,
              phases: data.phases,
              stepsForPhase,
              selectedStepId,
              hoveredStepId,
              onSelectStep: setSelectedStepId,
              onHoverStep: setHoveredStepId,
            }

            return (
          <div className="overflow-x-auto scroll-smooth bg-white">

              {/* ── Phase header row ── */}
              <div className="grid border-b border-gray-100 sticky top-0 z-20 bg-white" style={{ gridTemplateColumns: gridCols }}>
                <div className="sticky left-0 z-10 bg-white border-r border-gray-100" />
                {data.phases.map((phase) => {
                  const c = getPhaseColor(phase)
                  const n = Math.max(1, stepsForPhase(phase.id).length)
                  return (
                    <div key={phase.id} className="border-l border-gray-100 first:border-l-0" style={{ gridColumn: `span ${n}` }}>
                      <div className={`${c.bg} px-4 py-3 flex items-center gap-2 shadow-[inset_0_-1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.04)]`}>
                        <input
                          value={phase.label}
                          onChange={(e) => updatePhase(phase.id, e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-white text-[13px] font-semibold tracking-wide placeholder:text-white/60 focus:outline-none border-b border-white/0 focus:border-white/70 hover:border-white/40 cursor-text transition-colors"
                          placeholder="Fasenavn"
                          title="Klik for at omdøbe fase"
                          suppressHydrationWarning
                        />
                        <button type="button" onClick={() => addStep(phase.id)} title="Tilføj trin"
                          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-white/15 text-white transition-all hover:bg-white/30 active:scale-95">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {data.phases.length > 1 && (
                          <button type="button" onClick={() => removePhase(phase.id)} title="Fjern fase"
                            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-white/15 text-white/90 transition-all hover:bg-rose-500/80 hover:text-white active:scale-95">
                            <Trash2 className="w-3.5 h-3.5" />
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
                        className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-dashed ${c.border} ${c.light} ${c.text} font-medium transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                        <Plus className="w-3 h-3" /> Trin
                      </button>
                    </div>
                  )]
                  return steps.map((step, si) => {
                    const stateCls = stepStateCls(selectedStepId === step.id, hoveredStepId === step.id)
                    return (
                      <div
                        key={step.id}
                        className={`${cellCls} py-3 transition-colors ${stateCls}`}
                        onMouseEnter={() => setHoveredStepId(step.id)}
                        onMouseLeave={() => setHoveredStepId(null)}
                        onClick={(e) => {
                          if (e.target instanceof HTMLElement && e.target.closest('input, textarea, button, select, a, label'))
                            return
                          setSelectedStepId(step.id)
                        }}
                      >
                        <div className="group/step flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStepId(step.id)}
                            title="Åbn detaljer"
                            className={`inline-flex w-[18px] h-[18px] rounded-full ${c.bg} text-white text-[10px] font-semibold items-center justify-center shrink-0 ring-1 ring-white shadow-sm hover:scale-110 transition-transform`}
                          >
                            {si + 1}
                          </button>
                          <input
                            value={step.name}
                            onChange={(e) => updateStep(step.id, { name: e.target.value })}
                            placeholder={`Trin ${si + 1}`}
                            title="Klik for at omdøbe trin"
                            className="flex-1 min-w-0 text-[13px] font-semibold text-gray-800 bg-transparent border-b border-transparent placeholder:text-gray-300 placeholder:font-normal hover:border-gray-200 focus:border-amber-400 focus:outline-none py-0.5 cursor-text transition-colors"
                            suppressHydrationWarning
                          />
                          <button type="button" onClick={() => removeStep(step.id)}
                            title="Slet trin"
                            className="shrink-0 text-gray-300 hover:text-rose-500 p-0.5 rounded opacity-0 group-hover/step:opacity-100 focus:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                })}
              </div>

              {/* ── CHANNELS (section header) ── */}
              <div className="grid border-b border-gray-100 bg-gray-50/50" style={{ gridTemplateColumns: gridCols }}>
                <JourneyLabelCell bg="bg-gray-50">Channels</JourneyLabelCell>
                <div
                  className="border-l border-gray-100 flex items-center justify-end px-3 py-2"
                  style={{ gridColumn: `span ${stepCols.length}` }}
                >
                  <button
                    type="button"
                    onClick={addChannel}
                    className="text-[11px] text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-gray-300 bg-white/60 transition-colors hover:border-gray-400 hover:bg-white"
                  >
                    <Plus className="w-3 h-3" /> Tilføj kanal
                  </button>
                </div>
              </div>

              {/* ── CHANNELS (one row per channel) ── */}
              {data.channels.map((channel, channelIdx) => {
                const isFirst = channelIdx === 0
                const isLast = channelIdx === data.channels.length - 1
                return (
                  <div
                    key={channel.id}
                    className="grid border-b border-gray-50"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="sticky left-0 z-10 bg-white flex items-center gap-1.5 pl-3 pr-1.5 py-2 border-r border-gray-100 group hover:bg-gray-50/40 transition-colors">
                      <input
                        value={channel.icon}
                        onChange={(e) => updateChannel(channel.id, { icon: e.target.value })}
                        maxLength={6}
                        className="w-7 text-base text-center bg-transparent border border-transparent rounded transition-colors hover:border-gray-200 hover:bg-white focus:border-amber-300 focus:bg-white focus:outline-none cursor-text shrink-0"
                        title="Skift ikon (emoji)"
                        aria-label="Kanal-ikon"
                        suppressHydrationWarning
                      />
                      <input
                        value={channel.name}
                        onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                        placeholder="Kanal"
                        className="flex-1 min-w-0 text-[12px] font-medium text-gray-700 bg-transparent border-b border-transparent placeholder:text-gray-400 placeholder:font-normal transition-colors hover:border-gray-200 focus:border-amber-400 focus:outline-none py-0.5"
                        aria-label="Kanal-navn"
                        suppressHydrationWarning
                      />
                      <div className="flex items-center gap-px shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveChannel(channel.id, -1)}
                          disabled={isFirst}
                          className="text-gray-400 hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Flyt op"
                          aria-label="Flyt kanal op"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveChannel(channel.id, 1)}
                          disabled={isLast}
                          className="text-gray-400 hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Flyt ned"
                          aria-label="Flyt kanal ned"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChannel(channel.id)}
                          className="text-gray-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Slet kanal"
                          aria-label="Slet kanal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {data.phases.flatMap((phase) => {
                      const steps = stepsForPhase(phase.id)
                      if (steps.length === 0) {
                        return [<div key={phase.id} className="border-l border-gray-100" />]
                      }
                      return steps.map((step) => {
                        const active = step.activeChannelIds.includes(channel.id)
                        const stateCls = stepStateCls(selectedStepId === step.id, hoveredStepId === step.id)
                        return (
                          <button
                            type="button"
                            key={step.id}
                            onClick={() => toggleChannelStep(step.id, channel.id)}
                            onMouseEnter={() => setHoveredStepId(step.id)}
                            onMouseLeave={() => setHoveredStepId(null)}
                            aria-pressed={active}
                            title={`${active ? 'Fjern' : 'Tilføj'} ${channel.name || 'kanal'}${step.name ? ' – ' + step.name : ''}`}
                            className={`group/cell relative border-l border-gray-100 py-2.5 flex items-center justify-center transition-all ${stateCls} ${
                              active
                                ? 'bg-amber-50/70 hover:bg-amber-100/80 ring-1 ring-inset ring-amber-200/70'
                                : 'hover:bg-gray-50 hover:ring-1 hover:ring-inset hover:ring-gray-200'
                            }`}
                          >
                            {active ? (
                              <span className="text-lg leading-none select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.06)] transition-transform group-hover/cell:scale-110">{channel.icon}</span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 opacity-40 transition-all group-hover/cell:opacity-100 group-hover/cell:bg-gray-400 group-hover/cell:scale-125" />
                            )}
                          </button>
                        )
                      })
                    })}
                  </div>
                )
              })}

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
                  <div className="grid border-b border-gray-100 bg-gradient-to-b from-gray-50/40 via-white to-gray-50/30" style={{ gridTemplateColumns: gridCols }}>
                    <JourneyLabelCell bg="bg-white/70">Oplevelse</JourneyLabelCell>
                    <div className="border-l border-gray-100 py-5" style={{ gridColumn: `span ${stepCols.length}` }}>
                      <svg viewBox="0 0 1000 100" preserveAspectRatio="none"
                        style={{ width: '100%', height: 88, display: 'block' }}>
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
                      <div className="grid mt-1" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                        {allSteps.map((s, i) => (
                          <div key={s.id} className="text-center text-[10px] font-medium text-gray-500 truncate px-1">
                            {s.name || `Trin ${i + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── HANDLINGER ── */}
              <JourneyRow label="Handlinger" labelCls="text-sky-600" bg="bg-sky-50/20" {...rowProps}>
                {({ step }) => {
                  const empty = !step.action.trim()
                  return (
                    <div className="py-2">
                      <textarea value={step.action}
                        onChange={(e) => updateStep(step.id, { action: e.target.value })}
                        placeholder="Hvad gør brugeren?"
                        rows={2}
                        className={`w-full text-xs text-gray-700 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white focus:border-sky-200 placeholder:text-gray-300 transition-colors border ${empty ? 'bg-transparent border-transparent hover:border-sky-100/80' : 'bg-white border-sky-100'}`}
                        suppressHydrationWarning
                      />
                    </div>
                  )
                }}
              </JourneyRow>

              {/* ── TANKER ── */}
              <JourneyRow label="Tanker" labelCls="text-violet-600" bg="bg-violet-50/20" {...rowProps}>
                {({ step }) => {
                  const empty = !step.thought.trim()
                  return (
                    <div className="py-2">
                      <textarea value={step.thought}
                        onChange={(e) => updateStep(step.id, { thought: e.target.value })}
                        placeholder='"Jeg håber det er nemt..."'
                        rows={2}
                        className={`w-full text-xs text-gray-700 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white focus:border-violet-200 placeholder:text-gray-300 italic transition-colors border ${empty ? 'bg-transparent border-transparent hover:border-violet-100/80' : 'bg-white border-violet-100'}`}
                        suppressHydrationWarning
                      />
                    </div>
                  )
                }}
              </JourneyRow>

              {/* ── EMOTION ── */}
              <JourneyRow label="Emotion" labelCls="text-amber-600" bg="bg-amber-50/20" {...rowProps}>
                {({ step }) => (
                  <div className="py-3 flex items-center gap-1.5 flex-nowrap">
                    {SENTIMENT_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" title={opt.label}
                        onClick={() => updateStep(step.id, { sentiment: opt.value })}
                        className={`text-xl leading-none p-1 rounded-lg transition-all ${
                          step.sentiment === opt.value
                            ? 'bg-white shadow-sm scale-110 ring-2 ring-amber-400'
                            : 'opacity-50 hover:opacity-100 hover:scale-110 hover:bg-white/70'
                        }`}
                      >{opt.emoji}</button>
                    ))}
                  </div>
                )}
              </JourneyRow>

              {/* ── PAINS ── */}
              <JourneyRow label="Pains" labelCls="text-rose-600" bg="bg-rose-50/20" {...rowProps}>
                {({ step }) =>
                  step.pains.length === 0 ? (
                    <div className="py-2">
                      <button
                        type="button"
                        onClick={() => addListItem(step.id, 'pains')}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-700 font-medium px-2 py-1 rounded-md border border-dashed border-rose-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Tilføj pain
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1.5">
                      {step.pains.map((pain, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-rose-400 text-xs shrink-0 leading-none">—</span>
                          <input value={pain}
                            onChange={(e) => updateListItem(step.id, 'pains', idx, e.target.value)}
                            placeholder="Udfordring..."
                            className="flex-1 min-w-0 text-xs text-gray-700 bg-white border border-rose-100 rounded-md px-2 py-1 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                            suppressHydrationWarning
                          />
                          <button type="button" onClick={() => removeListItem(step.id, 'pains', idx)}
                            title="Fjern"
                            className="text-gray-300 hover:text-rose-500 shrink-0 p-0.5 rounded transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addListItem(step.id, 'pains')}
                        className="inline-flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-700 font-medium transition-colors">
                        <Plus className="w-2.5 h-2.5" /> Tilføj
                      </button>
                    </div>
                  )
                }
              </JourneyRow>

              {/* ── GAINS ── */}
              <JourneyRow label="Gains" labelCls="text-emerald-600" bg="bg-emerald-50/20" {...rowProps}>
                {({ step }) =>
                  step.gains.length === 0 ? (
                    <div className="py-2">
                      <button
                        type="button"
                        onClick={() => addListItem(step.id, 'gains')}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-700 font-medium px-2 py-1 rounded-md border border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Tilføj gain
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1.5">
                      {step.gains.map((gain, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-emerald-500 text-xs shrink-0 leading-none">+</span>
                          <input value={gain}
                            onChange={(e) => updateListItem(step.id, 'gains', idx, e.target.value)}
                            placeholder="Mulighed..."
                            className="flex-1 min-w-0 text-xs text-gray-700 bg-white border border-emerald-100 rounded-md px-2 py-1 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                            suppressHydrationWarning
                          />
                          <button type="button" onClick={() => removeListItem(step.id, 'gains', idx)}
                            title="Fjern"
                            className="text-gray-300 hover:text-emerald-600 shrink-0 p-0.5 rounded transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addListItem(step.id, 'gains')}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-700 font-medium transition-colors">
                        <Plus className="w-2.5 h-2.5" /> Tilføj
                      </button>
                    </div>
                  )
                }
              </JourneyRow>

              {/* ── INSIGHT ── */}
              <JourneyRow label="Insight" labelCls="text-amber-700" bg="bg-amber-50/20" {...rowProps}>
                {({ step }) => {
                  const empty = !step.opportunity.trim()
                  return (
                    <div className="py-2">
                      <textarea value={step.opportunity}
                        onChange={(e) => updateStep(step.id, { opportunity: e.target.value })}
                        placeholder="Designmulighed / indsigt..."
                        rows={2}
                        className={`w-full text-xs text-gray-700 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-amber-50/80 focus:border-amber-200 placeholder:text-gray-300 transition-colors border ${empty ? 'bg-transparent border-transparent hover:border-amber-100' : 'bg-amber-50/60 border-amber-100'}`}
                        suppressHydrationWarning
                      />
                    </div>
                  )
                }}
              </JourneyRow>

            </div>
            )
          })()}
        </section>

        </div>
      </div>
    </div>
  )
}
