export type GoldenCircleLayerId = 'why' | 'how' | 'what'

export type GoldenCircleData = Record<GoldenCircleLayerId, string>

export type GoldenCircleLayerMeta = {
  id: GoldenCircleLayerId
  title: string
  label: string
  question: string
  subtitle: string
  fill: string
  stroke: string
  text: string
  muted: string
  placeholder: string
}

/** ForgeLab-tuned farver (amber / gray / violet som øvrige strategiværktøjer). */
export const GOLDEN_CIRCLE_LAYERS: Record<GoldenCircleLayerId, GoldenCircleLayerMeta> = {
  why: {
    id: 'why',
    title: 'WHY',
    label: 'WHY statement',
    question: 'Hvorfor eksisterer idéen?',
    subtitle: 'Purpose',
    fill: '#111827',
    stroke: '#d97706',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.72)',
    placeholder: 'Vi tror på…',
  },
  how: {
    id: 'how',
    title: 'HOW',
    label: 'HOW statement',
    question: 'Hvordan gør vi det?',
    subtitle: 'Approach',
    fill: '#fffbeb',
    stroke: '#d97706',
    text: '#111827',
    muted: '#6b7280',
    placeholder: 'Vi gør det ved at…',
  },
  what: {
    id: 'what',
    title: 'WHAT',
    label: 'WHAT statement',
    question: 'Hvad tilbyder vi?',
    subtitle: 'Offer',
    fill: '#f5f3ff',
    stroke: '#7c3aed',
    text: '#111827',
    muted: '#6b7280',
    placeholder: 'Vi tilbyder…',
  },
}

export const GOLDEN_CIRCLE_LAYER_ORDER: GoldenCircleLayerId[] = ['what', 'how', 'why']

export const GOLDEN_CIRCLE_RINGS: {
  id: GoldenCircleLayerId
  r: number
  labelY: number
  labelSize: number
}[] = [
  { id: 'what', r: 282, labelY: 98, labelSize: 28 },
  { id: 'how', r: 205, labelY: 184, labelSize: 30 },
  { id: 'why', r: 122, labelY: 336, labelSize: 36 },
]

export function createDefaultGoldenCircleData(): GoldenCircleData {
  return { why: '', how: '', what: '' }
}

export function normalizeGoldenCircleData(raw: Partial<GoldenCircleData> | undefined): GoldenCircleData {
  const base = createDefaultGoldenCircleData()
  if (!raw) return base
  for (const id of GOLDEN_CIRCLE_LAYER_ORDER) {
    if (typeof raw[id] === 'string') base[id] = raw[id]
  }
  return base
}

export function goldenCircleFilledCount(data: GoldenCircleData): number {
  return GOLDEN_CIRCLE_LAYER_ORDER.filter(id => data[id].trim().length > 0).length
}
