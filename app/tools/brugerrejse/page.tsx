'use client'

import { useCallback, useMemo, useState, type DragEvent, type SetStateAction } from 'react'
import { GripVertical } from 'lucide-react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { getProjectToolData } from '@/lib/projects'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

type JourneyCardType = 'actions' | 'pains' | 'gains' | 'needs'

type JourneyCard = {
  id: string
  text: string
  value: number // -3 to +3
}

type JourneyPhase = {
  id: string
  label: string
}

type JourneyStep = {
  id: string
  /** Reference til én af `phases` — flere trin kan dele samme fase */
  phaseId: string
  stepName: string
  cards: Record<JourneyCardType, JourneyCard[]>
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
  phases: JourneyPhase[]
  steps: JourneyStep[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createCard = (text = '', value = 0): JourneyCard => ({
  id: createId(),
  text,
  value,
})

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/** Standardværdi pr. korttype (kan altid overrides med slideren). */
const defaultValueForCardType = (type: JourneyCardType): number => {
  if (type === 'pains') return -1
  if (type === 'gains') return 1
  return 0
}

/**
 * Vægtet bidrag til oplevelsesscore (-3…+3).
 * Pains tæller negativt (positive værdier flippes til negativt bidrag); gains bruger signed værdi
 * (standard +1); actions/needs er halv vægt.
 * Brugeren kan stadig justere slideren frit (fx en værre pain end standard).
 */
const getCardContribution = (type: JourneyCardType, value: number): number => {
  const v = clamp(Number(value) || 0, -3, 3)
  switch (type) {
    case 'pains':
      return v <= 0 ? v : -v
    case 'gains':
      return v
    case 'actions':
    case 'needs':
      return v * 0.5
    default:
      return 0
  }
}

const emptyStep = (phaseId: string): JourneyStep => ({
  id: createId(),
  phaseId,
  stepName: '',
  cards: {
    actions: [createCard('', defaultValueForCardType('actions'))],
    pains: [createCard('', defaultValueForCardType('pains'))],
    gains: [createCard('', defaultValueForCardType('gains'))],
    needs: [createCard('', defaultValueForCardType('needs'))],
  },
})

/** Stabil id til default/migrering så gemt data matcher på tværs af loads */
const DEFAULT_PHASE_ID = 'fl-ph-default'

const DEFAULT_DATA_RAW: JourneyData = {
  persona: '',
  scenario: '',
  linkedPersona: null,
  phases: [{ id: DEFAULT_PHASE_ID, label: 'Fase 1' }],
  steps: [emptyStep(DEFAULT_PHASE_ID)],
}

type PersonaCanvasData = {
  name?: string
  age?: string
  role?: string
  context?: string
  quote?: string
}

const CARD_SECTIONS: Array<{ key: JourneyCardType; label: string; accent: string; ring: string; pill: string }> = [
  { key: 'actions', label: 'Handlinger', accent: 'text-sky-800', ring: 'focus:ring-sky-300', pill: 'bg-sky-100 text-sky-800' },
  { key: 'pains', label: 'Pains', accent: 'text-rose-800', ring: 'focus:ring-rose-300', pill: 'bg-rose-100 text-rose-800' },
  { key: 'gains', label: 'Gains', accent: 'text-emerald-800', ring: 'focus:ring-emerald-300', pill: 'bg-emerald-100 text-emerald-800' },
  { key: 'needs', label: 'Behov', accent: 'text-violet-800', ring: 'focus:ring-violet-300', pill: 'bg-violet-100 text-violet-800' },
]

const PHASE_SURFACE: Array<{ bg: string; border: string; text: string }> = [
  { bg: 'bg-violet-100/90', border: 'border-violet-200', text: 'text-violet-900' },
  { bg: 'bg-fuchsia-100/90', border: 'border-fuchsia-200', text: 'text-fuchsia-900' },
  { bg: 'bg-sky-100/90', border: 'border-sky-200', text: 'text-sky-900' },
  { bg: 'bg-amber-100/90', border: 'border-amber-200', text: 'text-amber-900' },
  { bg: 'bg-teal-100/90', border: 'border-teal-200', text: 'text-teal-900' },
]

const phaseSurfaceFor = (phaseLabel: string, phaseIndex: number) => {
  const key = phaseLabel.trim() || `__idx_${phaseIndex}`
  const hash = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PHASE_SURFACE[hash % PHASE_SURFACE.length]
}

/** Stroke/fill til kurve-punkter fra score (-3…+3). */
const scoreToWarmStroke = (score: number) => {
  const t = (clamp(score, -3, 3) + 3) / 6
  const r = Math.round(249 + (20 - 249) * t)
  const g = Math.round(115 + (184 - 115) * t)
  const b = Math.round(22 + (129 - 22) * t)
  return `rgb(${r},${g},${b})`
}

const normalizeStep = (raw: any): JourneyStep => {
  const safeCards = raw?.cards && typeof raw.cards === 'object' ? raw.cards : {}
  const fallbackActions = raw?.touchpoint || raw?.userGoal ? `${raw?.touchpoint || ''} ${raw?.userGoal || ''}`.trim() : ''

  const normalizeCardList = (
    list: any,
    fallbackText = '',
    defaultValue = 0
  ): JourneyCard[] => {
    if (Array.isArray(list) && list.length > 0) {
      const mapped = list
        .map((c: any) => {
          if (typeof c === 'string') return createCard(c, defaultValue)
          if (!c || typeof c !== 'object') return null
          return {
            id: typeof c.id === 'string' && c.id ? c.id : createId(),
            text: typeof c.text === 'string' ? c.text : '',
            value: clamp(Number(c.value) || defaultValue, -3, 3),
          } satisfies JourneyCard
        })
        .filter(Boolean) as JourneyCard[]
      return mapped.length > 0 ? mapped : [createCard(fallbackText, defaultValue)]
    }
    return [createCard(fallbackText, defaultValue)]
  }

  return {
    id: typeof raw?.id === 'string' ? raw.id : createId(),
    phaseId: typeof raw?.phaseId === 'string' && raw.phaseId ? raw.phaseId : '',
    stepName: typeof raw?.stepName === 'string' ? raw.stepName : '',
    cards: {
      actions: normalizeCardList(safeCards.actions, fallbackActions, defaultValueForCardType('actions')),
      pains: normalizeCardList(
        safeCards.pains,
        typeof raw?.painPoint === 'string' ? raw.painPoint : '',
        defaultValueForCardType('pains')
      ),
      gains: normalizeCardList(
        safeCards.gains,
        typeof raw?.opportunity === 'string' ? raw.opportunity : '',
        defaultValueForCardType('gains')
      ),
      needs: normalizeCardList(
        safeCards.needs,
        typeof raw?.thought === 'string' ? raw.thought : '',
        defaultValueForCardType('needs')
      ),
    },
  }
}

const hashShort = (s: string) =>
  Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0).toString(36)

/**
 * Rækkefølge på boardet: faser i `phases`-orden, trin inden for hver fase i original rækkefølge.
 */
function getOrderedSteps(steps: JourneyStep[], phases: JourneyPhase[]): JourneyStep[] {
  const phaseIds = new Set(phases.map((p) => p.id))
  const fallback = phases[0]?.id
  const fixed = steps.map((s) =>
    !s.phaseId || !phaseIds.has(s.phaseId) ? { ...s, phaseId: fallback ?? s.phaseId } : s
  )
  const order = new Map(fixed.map((s, i) => [s.id, i]))
  return phases.flatMap((p) =>
    fixed
      .filter((s) => s.phaseId === p.id)
      .sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
  )
}

function addStepToPhaseInData(prev: JourneyData, phaseId: string): JourneyData {
  const ordered = getOrderedSteps(prev.steps.map(normalizeStep), prev.phases)
  const newStep = emptyStep(phaseId)
  const phIdx = prev.phases.findIndex((p) => p.id === phaseId)
  const nextPhase = prev.phases[phIdx + 1]
  const inThisPhase = ordered.filter((s) => s.phaseId === phaseId)
  let insertAt: number
  if (inThisPhase.length === 0) {
    insertAt = nextPhase ? ordered.findIndex((s) => s.phaseId === nextPhase.id) : ordered.length
    if (insertAt < 0) insertAt = ordered.length
  } else {
    const lastI = ordered.map((s, i) => (s.phaseId === phaseId ? i : -1)).filter((i) => i >= 0)
    insertAt = lastI.length ? lastI[lastI.length - 1] + 1 : 0
  }
  const nextSteps = [...ordered.slice(0, insertAt), newStep, ...ordered.slice(insertAt)]
  return { ...prev, steps: nextSteps }
}

const STEP_DRAG_MIME = 'text/plain'

/** Flyt trin til anden fase og/eller rækkefølge. `insertBeforeStepId === null` = indsæt sidst i mål-fasen. */
function moveStepInData(
  prev: JourneyData,
  draggedStepId: string,
  targetPhaseId: string,
  insertBeforeStepId: string | null
): JourneyData {
  if (!prev.phases.some((p) => p.id === targetPhaseId)) return prev

  const steps = prev.steps.map(normalizeStep)
  const moving = steps.find((s) => s.id === draggedStepId)
  if (!moving) return prev
  if (insertBeforeStepId === draggedStepId) return prev

  const rest = steps.filter((s) => s.id !== draggedStepId)
  const updated: JourneyStep = { ...moving, phaseId: targetPhaseId }
  const ordered = getOrderedSteps(rest, prev.phases)

  let insertAt: number
  if (insertBeforeStepId === null) {
    const inPhase = ordered.filter((s) => s.phaseId === targetPhaseId)
    if (inPhase.length === 0) {
      const pi = prev.phases.findIndex((p) => p.id === targetPhaseId)
      const nextPhase = prev.phases[pi + 1]
      insertAt = nextPhase
        ? ordered.findIndex((s) => s.phaseId === nextPhase.id)
        : ordered.length
      if (insertAt < 0) insertAt = ordered.length
    } else {
      const last = inPhase[inPhase.length - 1]
      insertAt = ordered.findIndex((s) => s.id === last.id) + 1
    }
  } else {
    insertAt = ordered.findIndex((s) => s.id === insertBeforeStepId)
    if (insertAt < 0) insertAt = ordered.length
  }

  const nextSteps = [...ordered.slice(0, insertAt), updated, ...ordered.slice(insertAt)]
  return { ...prev, steps: nextSteps }
}

function normalizeJourneyData(raw: Partial<JourneyData> & Record<string, unknown>): JourneyData {
  const persona = typeof raw?.persona === 'string' ? raw.persona : ''
  const scenario = typeof raw?.scenario === 'string' ? raw.scenario : ''
  const linkedPersona = raw?.linkedPersona ?? null

  const rawSteps = Array.isArray(raw?.steps) ? raw.steps : []

  let phases: JourneyPhase[] = Array.isArray(raw?.phases)
    ? raw.phases
        .filter((p: unknown) => p && typeof p === 'object')
        .map((p: any) => ({
          id: typeof p.id === 'string' && p.id ? p.id : createId(),
          label: typeof p.label === 'string' ? p.label : '',
        }))
    : []

  const labelOrder: string[] = []
  const seen = new Set<string>()
  for (const s of rawSteps) {
    const lbl = typeof (s as any)?.phase === 'string' ? (s as any).phase.trim() : ''
    if (lbl && !seen.has(lbl)) {
      seen.add(lbl)
      labelOrder.push(lbl)
    }
  }

  if (phases.length === 0) {
    if (labelOrder.length > 0) {
      phases = labelOrder.map((lbl, i) => ({
        id: `fl-ph-${i}-${hashShort(lbl)}`,
        label: lbl,
      }))
    } else {
      phases = [{ id: DEFAULT_PHASE_ID, label: 'Fase 1' }]
    }
  }

  const phaseIds = new Set(phases.map((p) => p.id))
  const fallbackPhaseId = phases[0].id

  const steps: JourneyStep[] = rawSteps.map((s: any) => {
    const base = normalizeStep(s)
    let phaseId = base.phaseId
    if (!phaseId || !phaseIds.has(phaseId)) {
      const lbl = typeof s?.phase === 'string' ? s.phase.trim() : ''
      if (lbl) {
        const found = phases.find((p) => p.label === lbl)
        phaseId = found?.id ?? fallbackPhaseId
      } else {
        phaseId = fallbackPhaseId
      }
    }
    return {
      id: base.id,
      phaseId,
      stepName: base.stepName,
      cards: base.cards,
    }
  })

  const finalSteps = steps.length > 0 ? steps : [emptyStep(fallbackPhaseId)]

  return {
    persona,
    scenario,
    linkedPersona: linkedPersona as JourneyData['linkedPersona'],
    phases,
    steps: getOrderedSteps(finalSteps, phases),
  }
}

export default function BrugerrejsePage() {
  const [data, setInternal] = useState<JourneyData>(() => normalizeJourneyData(DEFAULT_DATA_RAW))
  const setDataNormalized = useCallback((next: SetStateAction<JourneyData>) => {
    setInternal((prev) =>
      normalizeJourneyData(
        typeof next === 'function' ? (next as (p: JourneyData) => JourneyData)(prev) : next
      )
    )
  }, [])
  useProjectToolData<JourneyData>('brugerrejse', data, setDataNormalized)
  const [importingPersona, setImportingPersona] = useState(false)

  const updateMeta = (key: 'persona' | 'scenario', value: string) => {
    setDataNormalized((prev) => ({ ...prev, [key]: value }))
  }

  const updateStepName = (id: string, value: string) => {
    setDataNormalized((prev) => ({
      ...prev,
      steps: prev.steps.map((stepRaw) => {
        const step = normalizeStep(stepRaw)
        return step.id === id ? { ...step, stepName: value } : step
      }),
    }))
  }

  const [draggingStepId, setDraggingStepId] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const moveStep = useCallback(
    (draggedId: string, targetPhaseId: string, insertBeforeStepId: string | null) => {
      setDataNormalized((prev) => moveStepInData(prev, draggedId, targetPhaseId, insertBeforeStepId))
      setDragOverKey(null)
    },
    []
  )

  const allowStepDrop = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleStepDragStart = (e: DragEvent, stepId: string) => {
    e.dataTransfer.setData(STEP_DRAG_MIME, stepId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingStepId(stepId)
  }

  const handleStepDragEnd = () => {
    setDraggingStepId(null)
    setDragOverKey(null)
  }

  const addPhase = () => {
    setDataNormalized((prev) => ({
      ...prev,
      phases: [...prev.phases, { id: createId(), label: `Fase ${prev.phases.length + 1}` }],
    }))
  }

  const updatePhaseLabel = (phaseId: string, label: string) => {
    setDataNormalized((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => (p.id === phaseId ? { ...p, label } : p)),
    }))
  }

  const removePhase = (phaseId: string) => {
    setDataNormalized((prev) => {
      if (prev.phases.length <= 1) return prev
      const nextPhases = prev.phases.filter((p) => p.id !== phaseId)
      const fallback = nextPhases[0].id
      return {
        ...prev,
        phases: nextPhases,
        steps: prev.steps.map((s) => {
          const step = normalizeStep(s)
          return step.phaseId === phaseId ? { ...step, phaseId: fallback } : step
        }),
      }
    })
  }

  const addStepToPhase = (phaseId: string) => {
    setDataNormalized((prev) => addStepToPhaseInData(prev, phaseId))
  }

  const addStep = () => {
    setDataNormalized((prev) => {
      const pid = prev.phases[prev.phases.length - 1]?.id ?? prev.phases[0].id
      return addStepToPhaseInData(prev, pid)
    })
  }

  const removeStep = (id: string) => {
    setDataNormalized((prev) => {
      const filtered = prev.steps.filter((step) => step.id !== id)
      const pid = prev.phases[0].id
      return { ...prev, steps: filtered.length > 0 ? filtered : [emptyStep(pid)] }
    })
  }

  const updateCard = (
    stepId: string,
    cardType: JourneyCardType,
    cardId: string,
    patch: Partial<JourneyCard>
  ) => {
    setDataNormalized((prev) => ({
      ...prev,
      steps: prev.steps.map((stepRaw) => {
        const step = normalizeStep(stepRaw)
        if (step.id !== stepId) return step
        return {
          ...step,
          cards: {
            ...step.cards,
            [cardType]: step.cards[cardType].map((card) =>
              card.id === cardId ? { ...card, ...patch } : card
            ),
          },
        }
      }),
    }))
  }

  const addCard = (stepId: string, cardType: JourneyCardType) => {
    setDataNormalized((prev) => ({
      ...prev,
      steps: prev.steps.map((stepRaw) => {
        const step = normalizeStep(stepRaw)
        if (step.id !== stepId) return step
        return {
          ...step,
          cards: {
            ...step.cards,
            [cardType]: [...step.cards[cardType], createCard('', defaultValueForCardType(cardType))],
          },
        }
      }),
    }))
  }

  const removeCard = (stepId: string, cardType: JourneyCardType, cardId: string) => {
    setDataNormalized((prev) => ({
      ...prev,
      steps: prev.steps.map((stepRaw) => {
        const step = normalizeStep(stepRaw)
        if (step.id !== stepId) return step
        const filtered = step.cards[cardType].filter((card) => card.id !== cardId)
        return {
          ...step,
          cards: {
            ...step.cards,
            [cardType]:
              filtered.length > 0 ? filtered : [createCard('', defaultValueForCardType(cardType))],
          },
        }
      }),
    }))
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
      setDataNormalized((prev) => ({
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

  /** ViewBox 0–100 så x kan være præcis kolonne-centrum: (i+0.5)/n × 100 — matcher grid under. */
  const CHART_VB = { w: 100, h: 100 }
  const CHART_PAD_Y = 8
  const minScore = -3
  const maxScore = 3

  const getYFromScore = (score: number) => {
    const normalized = (score - minScore) / (maxScore - minScore)
    return (
      CHART_VB.h - CHART_PAD_Y - normalized * (CHART_VB.h - 2 * CHART_PAD_Y)
    )
  }

  const normalizedSteps = useMemo(() => data.steps.map((step) => normalizeStep(step)), [data.steps])
  const orderedSteps = useMemo(
    () => getOrderedSteps(normalizedSteps, data.phases),
    [normalizedSteps, data.phases]
  )
  const phaseGroups = useMemo(
    () =>
      data.phases.map((phase) => ({
        phase,
        steps: orderedSteps.filter((s) => s.phaseId === phase.id),
      })),
    [data.phases, orderedSteps]
  )
  const totalStepColumns = useMemo(
    () => phaseGroups.reduce((n, g) => n + Math.max(1, g.steps.length), 0),
    [phaseGroups]
  )

  /** Luft og skillelinje mellem faser (første fase uden ekstra venstre-margin). */
  const phaseStartClass = (phaseIdx: number) =>
    phaseIdx > 0 ? 'border-l border-gray-200 pl-4 ml-3' : ''

  const getExperienceForStep = (step: JourneyStep) => {
    const pairs: Array<{ type: JourneyCardType; card: JourneyCard }> = []
    ;(['actions', 'pains', 'gains', 'needs'] as const).forEach((type) => {
      step.cards[type].forEach((card) => pairs.push({ type, card }))
    })
    if (pairs.length === 0) return 0
    const sum = pairs.reduce(
      (acc, { type, card }) => acc + getCardContribution(type, card.value),
      0
    )
    return clamp(Math.round(sum / pairs.length), minScore, maxScore)
  }

  const points = useMemo(() => {
    if (orderedSteps.length === 0) return []
    const n = orderedSteps.length
    return orderedSteps.map((step, index) => {
      const x = n === 1 ? 50 : ((index + 0.5) / n) * CHART_VB.w
      const score = getExperienceForStep(step)
      const y = getYFromScore(score)
      return { x, y, score }
    })
  }, [orderedSteps])

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

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Brugerrejse-board</h2>
              <p className="text-sm text-gray-500">
                Hver fase kan rumme flere trin — fasen bliver bredere når du tilføjer trin.                 Træk et trin via grebet til venstre og slip på en anden fase eller foran et andet trin for at
                flytte det.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={addPhase}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50"
              >
                + Tilføj fase
              </button>
              <button
                type="button"
                onClick={addStep}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                + Tilføj trin
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              className="min-w-[720px] grid"
              style={{
                gridTemplateColumns: `112px repeat(${totalStepColumns}, minmax(160px, 1fr))`,
              }}
            >
              {/* Row: Fase-bånd (én celle pr. fase, udvider sig med antal trin) */}
              <div className="border-b border-r border-gray-200 bg-gray-50/90 px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Faser
              </div>
              {phaseGroups.map(({ phase, steps }, phaseIdx) => {
                const span = Math.max(1, steps.length)
                const pi = data.phases.findIndex((p) => p.id === phase.id)
                const surface = phaseSurfaceFor(phase.label, pi >= 0 ? pi : 0)
                return (
                  <div
                    key={`ph-band-${phase.id}`}
                    style={{ gridColumn: `span ${span}` }}
                    onDragOver={(e) => {
                      allowStepDrop(e)
                      setDragOverKey(`end:${phase.id}`)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData(STEP_DRAG_MIME)
                      if (id) moveStep(id, phase.id, null)
                    }}
                    className={`border-b border-r border-gray-200 px-2 py-2.5 transition-colors ${surface.bg} ${surface.border} ${phaseStartClass(phaseIdx)} ${
                      dragOverKey === `end:${phase.id}` ? 'ring-2 ring-amber-400/70 ring-inset bg-white/30' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={phase.label}
                        onChange={(e) => updatePhaseLabel(phase.id, e.target.value)}
                        onKeyDown={(e) =>
                          deleteEmptyFieldRow(e, phase.label, data.phases.length > 1, () =>
                            removePhase(phase.id)
                          )
                        }
                        placeholder="Fasenavn"
                        className={`min-w-0 flex-1 rounded-lg border border-white/60 bg-white/85 px-2 py-1.5 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300 ${surface.text}`}
                      />
                      <button
                        type="button"
                        onClick={() => addStepToPhase(phase.id)}
                        className="shrink-0 rounded-md border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold text-gray-800 hover:bg-white"
                      >
                        + Trin
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Row: Trin (inde under fase-båndene) */}
              <div className="border-b border-r border-gray-200 bg-gray-50/90 px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Trin
              </div>
              {phaseGroups.flatMap(({ phase, steps }, phaseIdx) =>
                steps.length === 0 ? (
                  <div
                    key={`trin-empty-${phase.id}`}
                    onDragOver={(e) => {
                      allowStepDrop(e)
                      setDragOverKey(`end:${phase.id}`)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData(STEP_DRAG_MIME)
                      if (id) moveStep(id, phase.id, null)
                    }}
                    className={`border-b border-r border-dashed border-gray-300 bg-gray-50/50 px-2 py-3 transition-colors ${phaseStartClass(phaseIdx)} ${
                      dragOverKey === `end:${phase.id}` ? 'ring-2 ring-amber-400/70 ring-inset bg-amber-50/50' : ''
                    }`}
                  >
                    <p className="mb-2 text-[10px] text-gray-400">Ingen trin i denne fase endnu.</p>
                    <button
                      type="button"
                      onClick={() => addStepToPhase(phase.id)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/80 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                    >
                      + Tilføj trin
                    </button>
                  </div>
                ) : (
                  steps.map((step, si) => {
                    const globalIdx = orderedSteps.findIndex((s) => s.id === step.id)
                    return (
                      <div
                        key={`st-${step.id}`}
                        onDragOver={(e) => {
                          allowStepDrop(e)
                          setDragOverKey(`before:${step.id}`)
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const id = e.dataTransfer.getData(STEP_DRAG_MIME)
                          if (id) moveStep(id, phase.id, step.id)
                        }}
                        className={`border-b border-r border-gray-200 bg-white px-2 py-3 transition-colors ${
                          phaseIdx > 0 && si === 0 ? phaseStartClass(phaseIdx) : ''
                        } ${dragOverKey === `before:${step.id}` ? 'ring-2 ring-amber-400/70 ring-inset bg-amber-50/40' : ''} ${
                          draggingStepId === step.id ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <div
                            draggable
                            onDragStart={(e) => handleStepDragStart(e, step.id)}
                            onDragEnd={handleStepDragEnd}
                            className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
                            title="Træk for at flytte til anden fase eller rækkefølge"
                            aria-label="Træk for at flytte trin"
                          >
                            <GripVertical className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-[10px] leading-tight text-gray-400">
                              Slip på en anden fase eller foran et andet trin.
                            </p>
                            <div className="flex items-start gap-1">
                              <span className="mt-1.5 inline-block h-2 w-2 rotate-45 border border-amber-400 bg-amber-100" />
                              <input
                                value={step.stepName}
                                onChange={(e) => updateStepName(step.id, e.target.value)}
                                onKeyDown={(e) =>
                                  deleteEmptyFieldRow(e, step.stepName, true, () => removeStep(step.id))
                                }
                                placeholder={`Trin ${globalIdx + 1}`}
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              )}

              {/* Row: Oplevelse (kurve) */}
              <div className="border-b border-r border-gray-200 bg-gray-50/90 px-2 py-3 align-top text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Oplevelse
              </div>
              <div
                className="border-b border-gray-200 bg-[#fafafa] min-w-0 w-full"
                style={{ gridColumn: '2 / -1' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-1.5">
                  <p className="text-xs text-gray-500">
                    {data.persona ? (
                      <span className="font-medium text-gray-800">{data.persona}</span>
                    ) : (
                      <span>Persona (øverst)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400">Kurve opdateres fra kortenes værdier</p>
                </div>
                <svg
                  viewBox="0 0 100 100"
                  className="block h-[240px] w-full min-w-0"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Experience curve"
                >
                  {[3, 2, 1, 0, -1, -2, -3].map((tick) => {
                    const y = getYFromScore(tick)
                    return (
                      <g key={tick}>
                        <line
                          x1={0}
                          y1={y}
                          x2={CHART_VB.w}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth={0.35}
                          vectorEffect="nonScalingStroke"
                        />
                        <text x={3.5} y={y + 1.2} fontSize={3.2} fill="#6b7280">
                          {tick}
                        </text>
                      </g>
                    )
                  })}

                  {points.length > 1 &&
                    points.slice(0, -1).map((p, i) => {
                      const q = points[i + 1]
                      const mid = (p.score + q.score) / 2
                      return (
                        <line
                          key={`seg-${i}`}
                          x1={p.x}
                          y1={p.y}
                          x2={q.x}
                          y2={q.y}
                          stroke={scoreToWarmStroke(mid)}
                          strokeWidth={1.75}
                          strokeLinecap="round"
                          vectorEffect="nonScalingStroke"
                        />
                      )
                    })}

                  {points.map((p, index) => (
                    <g key={orderedSteps[index].id}>
                      <line
                        x1={p.x}
                        y1={CHART_PAD_Y}
                        x2={p.x}
                        y2={CHART_VB.h - 4}
                        stroke="#e5e7eb"
                        strokeWidth={0.35}
                        vectorEffect="nonScalingStroke"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={2.4}
                        fill={scoreToWarmStroke(p.score)}
                        stroke="#ffffff"
                        strokeWidth={0.9}
                        vectorEffect="nonScalingStroke"
                      />
                      <text
                        x={p.x}
                        y={p.y - 3.2}
                        textAnchor="middle"
                        fontSize={3.2}
                        fill="#451a03"
                        fontWeight={700}
                      >
                        {p.score > 0 ? `+${p.score}` : p.score}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Row: Indsigt */}
              <div className="border-r border-gray-200 bg-gray-50/90 px-2 py-3 align-top text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Indsigt
              </div>
              {phaseGroups.flatMap(({ phase, steps }, phaseIdx) =>
                steps.length === 0 ? (
                  <div
                    key={`in-empty-${phase.id}`}
                    onDragOver={(e) => {
                      allowStepDrop(e)
                      setDragOverKey(`end:${phase.id}`)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData(STEP_DRAG_MIME)
                      if (id) moveStep(id, phase.id, null)
                    }}
                    className={`border-r border-gray-200 bg-gray-50/40 px-2 py-3 transition-colors ${phaseStartClass(phaseIdx)} ${
                      dragOverKey === `end:${phase.id}` ? 'ring-2 ring-amber-400/70 ring-inset bg-amber-50/50' : ''
                    }`}
                    aria-label="Tom fase — slip et trin her for at flytte det til denne fase"
                  />
                ) : (
                  steps.map((step, si) => (
                    <div
                      key={`in-${step.id}`}
                      onDragOver={(e) => {
                        allowStepDrop(e)
                        setDragOverKey(`before:${step.id}`)
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey(null)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const id = e.dataTransfer.getData(STEP_DRAG_MIME)
                        if (id) moveStep(id, phase.id, step.id)
                      }}
                      className={`border-r border-gray-200 bg-white px-2 py-3 last:border-r-0 transition-colors ${
                        phaseIdx > 0 && si === 0 ? phaseStartClass(phaseIdx) : ''
                      } ${dragOverKey === `before:${step.id}` ? 'ring-2 ring-amber-400/70 ring-inset bg-amber-50/40' : ''} ${
                        draggingStepId === step.id ? 'opacity-60' : ''
                      }`}
                    >
                  <div className="mb-2 rounded-lg border border-amber-100 bg-amber-50/60 px-2 py-1 text-center text-[11px] font-semibold text-amber-900">
                    Score: {getExperienceForStep(step)}
                  </div>
                  <div className="space-y-3">
                    {CARD_SECTIONS.map((section) => (
                      <div key={section.key} className="rounded-xl border border-gray-100 bg-gray-50/80 p-2">
                        <div className="mb-1.5 flex items-center justify-between gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${section.pill}`}>
                            {section.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => addCard(step.id, section.key)}
                            className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <div className="space-y-2">
                          {step.cards[section.key].map((card) => {
                            const contribution = getCardContribution(section.key, card.value)
                            return (
                              <div
                                key={card.id}
                                className="relative rounded-lg border border-white bg-white p-2 shadow-sm"
                              >
                                <input
                                  value={card.text}
                                  onChange={(e) =>
                                    updateCard(step.id, section.key, card.id, { text: e.target.value })
                                  }
                                  onKeyDown={(e) =>
                                    deleteEmptyFieldRow(
                                      e,
                                      card.text,
                                      step.cards[section.key].length > 1,
                                      () => removeCard(step.id, section.key, card.id)
                                    )
                                  }
                                  placeholder="Skriv note..."
                                  className={`mb-2 w-full rounded-md border border-gray-100 bg-white px-2 py-1.5 text-xs leading-snug text-gray-800 focus:outline-none focus:ring-2 ${section.ring}`}
                                />
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500">Værdi</span>
                                    <input
                                      type="range"
                                      min={-3}
                                      max={3}
                                      step={1}
                                      value={card.value}
                                      onChange={(e) =>
                                        updateCard(step.id, section.key, card.id, {
                                          value: clamp(Number(e.target.value), -3, 3),
                                        })
                                      }
                                      className="flex-1 accent-amber-600"
                                    />
                                    <span className="w-7 text-right text-[10px] font-semibold text-gray-700">
                                      {card.value > 0 ? `+${card.value}` : card.value}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-500">
                                    Bidrag:{' '}
                                    <span className="font-semibold text-gray-800">
                                      {contribution > 0 ? `+${contribution}` : contribution}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}

