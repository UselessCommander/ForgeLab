/** Delte typer og normalisering til Brugerrejse (værktøj + board-preview). */

export type Sentiment = -2 | -1 | 0 | 1 | 2

export type JourneyStep = {
  id: string
  phaseId: string
  name: string
  activeChannelIds: string[]
  action: string
  thought: string
  sentiment: Sentiment
  pains: string[]
  gains: string[]
  opportunity: string
}

export type JourneyPhase = {
  id: string
  label: string
  color: string
}

export type Channel = {
  id: string
  name: string
  icon: string
  order: number
}

export type PersonaData = {
  name?: string
  age?: string
  role?: string
  context?: string
  quote?: string
}

export type JourneyData = {
  persona: string
  scenario: string
  linkedPersona: PersonaData | null
  channels: Channel[]
  phases: JourneyPhase[]
  steps: JourneyStep[]
}

export const LABEL_COL_WIDTH_PX = 144
export const STEP_COL_MIN_PX = 200

export const PHASE_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', header: 'bg-violet-500' },
  { bg: 'bg-sky-500', light: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', header: 'bg-sky-500' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', header: 'bg-amber-500' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', header: 'bg-emerald-500' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', header: 'bg-rose-500' },
  { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', header: 'bg-fuchsia-500' },
] as const

export const SENTIMENT_OPTIONS: { value: Sentiment; emoji: string; label: string }[] = [
  { value: -2, emoji: '😢', label: 'Meget frustreret' },
  { value: -1, emoji: '😕', label: 'Lidt frustreret' },
  { value: 0, emoji: '😐', label: 'Neutral' },
  { value: 1, emoji: '🙂', label: 'Tilfreds' },
  { value: 2, emoji: '😄', label: 'Meget glad' },
]

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const cleanList = (arr: string[]): string[] =>
  arr.length === 1 && arr[0] === '' ? [] : arr

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

const emptyStep = (phaseId: string): JourneyStep => seedStep(createId(), phaseId)

export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'ch-search', name: 'Search', icon: '🔍', order: 0 },
  { id: 'ch-website', name: 'Website', icon: '💻', order: 1 },
  { id: 'ch-email', name: 'Email', icon: '✉️', order: 2 },
  { id: 'ch-social', name: 'Social media', icon: '📱', order: 3 },
  { id: 'ch-phone', name: 'Phone', icon: '📞', order: 4 },
  { id: 'ch-wom', name: 'Word of mouth', icon: '💬', order: 5 },
]

const DEFAULT_PHASE_ID = 'fl-ph-1'

export const DEFAULT_JOURNEY_DATA: JourneyData = {
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

export function sentimentColor(v: Sentiment): string {
  if (v <= -2) return '#ef4444'
  if (v === -1) return '#f97316'
  if (v === 0) return '#eab308'
  if (v === 1) return '#84cc16'
  return '#22c55e'
}

export function getPhaseColor(phase: JourneyPhase) {
  return PHASE_COLORS[Number(phase.color) % PHASE_COLORS.length] ?? PHASE_COLORS[0]
}

export function stepsForPhase(data: JourneyData, phaseId: string): JourneyStep[] {
  return data.steps.filter((s) => s.phaseId === phaseId)
}

export function buildJourneyGridCols(data: JourneyData, stepMinPx = STEP_COL_MIN_PX): string {
  const stepColUnit = `minmax(${stepMinPx}px, 1fr)`
  const stepCols = data.phases.flatMap((ph) => {
    const n = stepsForPhase(data, ph.id).length
    return n === 0 ? [stepColUnit] : Array(n).fill(stepColUnit)
  })
  return `${LABEL_COL_WIDTH_PX}px ${stepCols.join(' ')}`
}

export function allStepsInOrder(data: JourneyData): JourneyStep[] {
  return data.phases.flatMap((ph) => stepsForPhase(data, ph.id))
}

export function normalizeJourneyFromRaw(raw: unknown): JourneyData {
  if (!raw || typeof raw !== 'object') return DEFAULT_JOURNEY_DATA
  const r = raw as Record<string, unknown>
  const phases: JourneyPhase[] = Array.isArray(r.phases)
    ? r.phases.map((p: any, i: number) => ({
        id: p?.id || createId(),
        label: p?.label || `Fase ${i + 1}`,
        color: String(p?.color ?? i % PHASE_COLORS.length),
      }))
    : DEFAULT_JOURNEY_DATA.phases

  const channels: Channel[] =
    Array.isArray(r.channels) && (r.channels as any[]).length > 0
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
          ? (s.activeChannelIds as any[]).filter(
              (id): id is string => typeof id === 'string' && channelIdSet.has(id),
            )
          : [],
        action: s?.action || '',
        thought: s?.thought || '',
        sentiment: ([-2, -1, 0, 1, 2].includes(Number(s?.sentiment))
          ? Number(s.sentiment)
          : 0) as Sentiment,
        pains: cleanList(Array.isArray(s?.pains) ? s.pains : s?.painPoint ? [s.painPoint] : []),
        gains: cleanList(
          Array.isArray(s?.gains) ? s.gains : s?.opportunity ? [s.opportunity] : [],
        ),
        opportunity: s?.opportunity || '',
      }))
    : DEFAULT_JOURNEY_DATA.steps

  return {
    persona: typeof r.persona === 'string' ? r.persona : '',
    scenario: typeof r.scenario === 'string' ? r.scenario : '',
    linkedPersona: (r.linkedPersona as PersonaData | null) ?? null,
    channels,
    phases,
    steps: steps.length > 0 ? steps : [emptyStep(phases[0]?.id)],
  }
}

export function journeyNaturalWidth(data: JourneyData, stepMinPx = STEP_COL_MIN_PX): number {
  const stepCount = Math.max(
    1,
    data.phases.reduce((sum, ph) => sum + Math.max(1, stepsForPhase(data, ph.id).length), 0),
  )
  return LABEL_COL_WIDTH_PX + stepCount * stepMinPx
}
