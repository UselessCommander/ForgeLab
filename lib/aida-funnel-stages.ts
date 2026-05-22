export type AidaStageId = 'attention' | 'interest' | 'desire' | 'action'

export type AidaStage = {
  id: AidaStageId
  title: string
  subtitle: string
  prompt: string
  fill: string
  activeFill: string
}

export type AidaValues = Record<AidaStageId, string>

export const AIDA_STAGES: AidaStage[] = [
  {
    id: 'attention',
    title: 'Attention',
    subtitle: 'Opmærksomhed',
    prompt: 'Skriv hook, blikfang eller første budskab...',
    fill: '#3b82f6',
    activeFill: '#2563eb',
  },
  {
    id: 'interest',
    title: 'Interest',
    subtitle: 'Interesse',
    prompt: 'Skriv relevans, problem eller behov...',
    fill: '#22c55e',
    activeFill: '#16a34a',
  },
  {
    id: 'desire',
    title: 'Desire',
    subtitle: 'Ønske',
    prompt: 'Skriv gevinst, værdi eller bevis...',
    fill: '#eab308',
    activeFill: '#ca8a04',
  },
  {
    id: 'action',
    title: 'Action',
    subtitle: 'Handling',
    prompt: 'Skriv CTA eller næste skridt...',
    fill: '#ef4444',
    activeFill: '#dc2626',
  },
]

export const AIDA_EMPTY_VALUES: AidaValues = {
  attention: '',
  interest: '',
  desire: '',
  action: '',
}

export const VIEWBOX_WIDTH = 900
export const VIEWBOX_HEIGHT = 720
export const CENTER_X = VIEWBOX_WIDTH / 2
export const FUNNEL_TOP_Y = 40
export const FUNNEL_HEIGHT = 640
export const FUNNEL_TOP_WIDTH = 820
export const FUNNEL_BOTTOM_WIDTH = 180
export const SEGMENT_HEIGHT = FUNNEL_HEIGHT / AIDA_STAGES.length
export const SEGMENT_GAP = 9

export function widthAtY(y: number) {
  const progress = (y - FUNNEL_TOP_Y) / FUNNEL_HEIGHT
  return FUNNEL_TOP_WIDTH - (FUNNEL_TOP_WIDTH - FUNNEL_BOTTOM_WIDTH) * progress
}

export function pointsForSegment(y1: number, y2: number) {
  const topWidth = widthAtY(y1)
  const bottomWidth = widthAtY(y2)
  const topLeft = CENTER_X - topWidth / 2
  const topRight = CENTER_X + topWidth / 2
  const bottomLeft = CENTER_X - bottomWidth / 2
  const bottomRight = CENTER_X + bottomWidth / 2
  return `${topLeft},${y1} ${topRight},${y1} ${bottomRight},${y2} ${bottomLeft},${y2}`
}

export type FunnelSegment = AidaStage & {
  index: number
  y1: number
  y2: number
  drawY1: number
  drawY2: number
  drawHeight: number
  midY: number
  midWidth: number
  points: string
}

export function buildFunnelSegments(): FunnelSegment[] {
  return AIDA_STAGES.map((stage, index) => {
    const y1 = FUNNEL_TOP_Y + SEGMENT_HEIGHT * index
    const y2 = FUNNEL_TOP_Y + SEGMENT_HEIGHT * (index + 1)
    const drawY1 = index === 0 ? y1 : y1 + SEGMENT_GAP / 2
    const drawY2 = index === AIDA_STAGES.length - 1 ? y2 : y2 - SEGMENT_GAP / 2
    const drawHeight = drawY2 - drawY1
    const midY = drawY1 + drawHeight / 2
    const midWidth = widthAtY(midY)

    return {
      ...stage,
      index,
      y1,
      y2,
      drawY1,
      drawY2,
      drawHeight,
      midY,
      midWidth,
      points: pointsForSegment(drawY1, drawY2),
    }
  })
}

export function normalizeAidaValues(raw: Partial<AidaValues> | undefined): AidaValues {
  const base = { ...AIDA_EMPTY_VALUES }
  if (!raw) return base
  for (const stage of AIDA_STAGES) {
    const value = raw[stage.id]
    if (typeof value === 'string') base[stage.id] = value
  }
  return base
}
