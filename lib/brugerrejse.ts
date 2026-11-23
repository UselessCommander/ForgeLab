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
  /** Values for custom text/list rows, keyed by JourneyRow.id */
  customFields?: Record<string, string | string[]>
}

export type JourneyRowKind = 'preset' | 'text' | 'list'

export type JourneyPresetId =
  | 'touchpoint'
  | 'channels'
  | 'curve'
  | 'actions'
  | 'thoughts'
  | 'emotion'
  | 'pains'
  | 'gains'
  | 'insight'

export type JourneyRow = {
  id: string
  /** Set for standard rows; omitted for custom */
  preset?: JourneyPresetId
  label: string
  kind: JourneyRowKind
  /** Palette index as string, or undefined for no tint */
  color?: string
}

export const JOURNEY_PRESET_CATALOG: {
  id: JourneyPresetId
  label: string
  /** Default soft row tint (palette index) */
  defaultColor?: string
}[] = [
  { id: 'touchpoint', label: 'Touchpoint' },
  { id: 'channels', label: 'Channels' },
  { id: 'curve', label: 'Oplevelse' },
  { id: 'actions', label: 'Handlinger', defaultColor: '1' },
  { id: 'thoughts', label: 'Tanker', defaultColor: '0' },
  { id: 'emotion', label: 'Emotion', defaultColor: '2' },
  { id: 'pains', label: 'Pains', defaultColor: '4' },
  { id: 'gains', label: 'Gains', defaultColor: '3' },
  { id: 'insight', label: 'Insight', defaultColor: '2' },
]

export function defaultJourneyRows(): JourneyRow[] {
  return JOURNEY_PRESET_CATALOG.map((p) => ({
    id: `row-${p.id}`,
    preset: p.id,
    label: p.label,
    kind: 'preset' as const,
    ...(p.defaultColor != null ? { color: p.defaultColor } : {}),
  }))
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
  rows: JourneyRow[]
}

export const LABEL_COL_WIDTH_PX = 144
export const LABEL_COL_WIDTH_MIN_PX = 144
export const LABEL_COL_WIDTH_MAX_PX = 360
export const LABEL_COL_WIDTH_DEFAULT_PX = 220
export const STEP_COL_MIN_PX = 200

/** Curated emojis for journey channels (picker + defaults). */
export const CHANNEL_EMOJI_OPTIONS = [
  '🔍', '💻', '🖥️', '📱', '☎️', '📞', '✉️', '📧', '💬', '💭',
  '🌐', '🛒', '🏪', '🏬', '📰', '📺', '📻', '📣', '📢', '🤝',
  '👤', '👥', '📍', '🗺️', '🚗', '🚌', '✈️', '🧾', '💳', '🏦',
  '🎧', '🤖', '📦', '🏠', '🏢', '🔗', '⭐', '💡', '📝', '🎯',
] as const

/** Hex palette — solid for phases, soft rgba for rows. Avoids Tailwind purge gaps. */
export type JourneyColorDef = {
  /** Solid phase header / swatch */
  hex: string
  /** Soft row wash */
  soft: string
  /** Label text */
  label: string
  /** Light fill for dashed buttons etc. */
  light: string
  /** Soft border */
  border: string
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Soft tint blended onto white — use for sticky cells so opacity does not stack. */
function softOnWhite(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  const mix = (c: number) => Math.round(255 * (1 - amount) + c * amount)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

const ROW_TINT_AMOUNT = 0.018

function colorDef(hex: string, label = hex): JourneyColorDef {
  return {
    hex,
    soft: rgba(hex, ROW_TINT_AMOUNT),
    label,
    light: rgba(hex, 0.04),
    border: rgba(hex, 0.14),
  }
}

/** 20 clearly separated hues (around the wheel + neutrals). */
export const JOURNEY_COLOR_PALETTE: readonly JourneyColorDef[] = [
  colorDef('#7c3aed', '#6d28d9'), // violet
  colorDef('#2563eb', '#1d4ed8'), // blue
  colorDef('#0891b2', '#0e7490'), // cyan
  colorDef('#0d9488', '#0f766e'), // teal
  colorDef('#16a34a', '#15803d'), // green
  colorDef('#65a30d', '#4d7c0f'), // lime
  colorDef('#ca8a04', '#a16207'), // yellow/gold
  colorDef('#d97706', '#b45309'), // amber
  colorDef('#ea580c', '#c2410c'), // orange
  colorDef('#dc2626', '#b91c1c'), // red
  colorDef('#e11d48', '#be123c'), // rose
  colorDef('#db2777', '#be185d'), // pink
  colorDef('#c026d3', '#a21caf'), // fuchsia
  colorDef('#9333ea', '#7e22ce'), // purple
  colorDef('#4f46e5', '#4338ca'), // indigo
  colorDef('#0284c7', '#0369a1'), // sky
  colorDef('#475569', '#334155'), // slate
  colorDef('#78716c', '#57534e'), // stone
  colorDef('#0f766e', '#115e59'), // deep teal
  colorDef('#9a3412', '#7c2d12'), // rust
]

/** Length helper for phase color cycling */
export const PHASE_COLORS = JOURNEY_COLOR_PALETTE.map((c) => ({
  bg: c.hex,
  light: c.light,
  border: c.border,
  text: c.label,
  header: c.hex,
}))

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
  customFields: {},
})

const PRESET_ID_SET = new Set<string>(JOURNEY_PRESET_CATALOG.map((p) => p.id))

export function normalizeJourneyRows(raw: unknown): JourneyRow[] {
  // Missing / invalid → full defaults. Empty array is valid (user removed all rows).
  if (raw === undefined || raw === null) return defaultJourneyRows()
  if (!Array.isArray(raw)) return defaultJourneyRows()
  const seenPresets = new Set<string>()
  const rows: JourneyRow[] = []
  for (const item of raw as any[]) {
    if (!item || typeof item !== 'object') continue
    const kind: JourneyRowKind =
      item.kind === 'text' || item.kind === 'list' || item.kind === 'preset'
        ? item.kind
        : item.preset
          ? 'preset'
          : 'text'
    if (kind === 'preset') {
      const preset = typeof item.preset === 'string' ? item.preset : ''
      if (!PRESET_ID_SET.has(preset) || seenPresets.has(preset)) continue
      seenPresets.add(preset)
      const catalog = JOURNEY_PRESET_CATALOG.find((p) => p.id === preset)!
      const color =
        typeof item.color === 'string' && item.color !== ''
          ? item.color
          : catalog.defaultColor
      rows.push({
        id: typeof item.id === 'string' && item.id ? item.id : `row-${preset}`,
        preset: preset as JourneyPresetId,
        label: typeof item.label === 'string' && item.label.trim() ? item.label : catalog.label,
        kind: 'preset',
        ...(color != null ? { color } : {}),
      })
      continue
    }
    rows.push({
      id: typeof item.id === 'string' && item.id ? item.id : createId(),
      label:
        typeof item.label === 'string' && item.label.trim()
          ? item.label
          : kind === 'list'
            ? 'Ny liste'
            : 'Ny række',
      kind,
      ...(typeof item.color === 'string' && item.color !== '' ? { color: item.color } : {}),
    })
  }
  return rows
}

export function availableJourneyPresets(rows: JourneyRow[]): typeof JOURNEY_PRESET_CATALOG {
  const used = new Set(rows.map((r) => r.preset).filter(Boolean))
  return JOURNEY_PRESET_CATALOG.filter((p) => !used.has(p.id))
}

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
  rows: defaultJourneyRows(),
}

export function sentimentColor(v: Sentiment): string {
  if (v <= -2) return '#ef4444'
  if (v === -1) return '#f97316'
  if (v === 0) return '#eab308'
  if (v === 1) return '#84cc16'
  return '#22c55e'
}

export function getJourneyColor(colorKey: string | undefined | null) {
  if (colorKey == null || colorKey === '') return null
  const idx = Number(colorKey)
  if (!Number.isFinite(idx)) return null
  return JOURNEY_COLOR_PALETTE[((idx % JOURNEY_COLOR_PALETTE.length) + JOURNEY_COLOR_PALETTE.length) % JOURNEY_COLOR_PALETTE.length] ?? null
}

export function getPhaseColor(phase: JourneyPhase) {
  const c = getJourneyColor(phase.color) ?? JOURNEY_COLOR_PALETTE[0]
  return {
    hex: c.hex,
    soft: c.soft,
    label: c.label,
    light: c.light,
    border: c.border,
    /** @deprecated use hex */
    bg: c.hex,
    text: c.label,
    header: c.hex,
  }
}

export function getRowTint(colorKey: string | undefined | null) {
  const c = getJourneyColor(colorKey)
  if (!c) {
    return {
      backgroundColor: undefined as string | undefined,
      /** Opaque soft blend for sticky/stacking contexts */
      solidBackgroundColor: undefined as string | undefined,
      color: undefined as string | undefined,
      borderColor: undefined as string | undefined,
    }
  }
  return {
    backgroundColor: c.soft,
    solidBackgroundColor: softOnWhite(c.hex, ROW_TINT_AMOUNT),
    color: c.label,
    borderColor: c.border,
  }
}

export function stepsForPhase(data: JourneyData, phaseId: string): JourneyStep[] {
  return data.steps.filter((s) => s.phaseId === phaseId)
}

export function buildJourneyGridCols(
  data: JourneyData,
  stepMinPx = STEP_COL_MIN_PX,
  labelWidthPx = LABEL_COL_WIDTH_PX,
  /** When false, step columns stay fixed width and never grow with the card. */
  allowGrow = true,
): string {
  const stepColUnit = allowGrow ? `minmax(${stepMinPx}px, 1fr)` : `${stepMinPx}px`
  const stepCols = data.phases.flatMap((ph) => {
    const n = stepsForPhase(data, ph.id).length
    return n === 0 ? [stepColUnit] : Array(n).fill(stepColUnit)
  })
  return `${labelWidthPx}px ${stepCols.join(' ')}`
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
    ? r.steps.map((s: any) => {
        const customFields: Record<string, string | string[]> = {}
        if (s?.customFields && typeof s.customFields === 'object') {
          for (const [key, val] of Object.entries(s.customFields as Record<string, unknown>)) {
            if (typeof val === 'string') customFields[key] = val
            else if (Array.isArray(val)) {
              customFields[key] = val.filter((x): x is string => typeof x === 'string')
            }
          }
        }
        return {
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
          customFields,
        }
      })
    : DEFAULT_JOURNEY_DATA.steps

  return {
    persona: typeof r.persona === 'string' ? r.persona : '',
    scenario: typeof r.scenario === 'string' ? r.scenario : '',
    linkedPersona: (r.linkedPersona as PersonaData | null) ?? null,
    channels,
    phases,
    steps: steps.length > 0 ? steps : [emptyStep(phases[0]?.id)],
    rows: Object.prototype.hasOwnProperty.call(r, 'rows')
      ? normalizeJourneyRows(r.rows)
      : defaultJourneyRows(),
  }
}

export function journeyNaturalWidth(data: JourneyData, stepMinPx = STEP_COL_MIN_PX): number {
  const stepCount = Math.max(
    1,
    data.phases.reduce((sum, ph) => sum + Math.max(1, stepsForPhase(data, ph.id).length), 0),
  )
  return LABEL_COL_WIDTH_PX + stepCount * stepMinPx
}
