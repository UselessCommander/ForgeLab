/** Delte typer og defaults til Service Blueprint (værktøj + board-preview). */

export const COLUMN_WIDTH = 275
export const CARD_MIN_HEIGHT_PX = 200
export const CARD_MAX_HEIGHT_PX = 380
export const CELL_MIN_HEIGHT_PX = 220
export const DEFAULT_CARD_TYPE = 'ui'

export const CARD_TITLE_PLACEHOLDER = 'Korttitel'
export const CARD_BODY_PLACEHOLDER = 'Beskriv handling, systemrespons eller proces...'

export type Side = 'top' | 'right' | 'bottom' | 'left'

export interface Point {
  x: number
  y: number
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  type: string
  fromSide?: Side
  toSide?: Side
}

export interface ConnectionPath extends Connection {
  from: Point
  to: Point
  d: string
  stroke: string
}

export interface CardTypeDef {
  label: string
  dot: string
  stroke: string
  card: string
  muted: string
}

export type CardTypes = Record<string, CardTypeDef>

export interface Phase {
  id: string
  title: string
}

export interface Lane {
  id: string
  title: string
  hint: string
  dividerBefore?: boolean
  dividerInternalBefore?: boolean
}

export interface BlueprintCardData {
  id: string
  laneId: string
  phaseId: string
  type: string
  title: string
  body: string
  order: number
  colSpan: number
}

export interface BlueprintData {
  phases: Phase[]
  cardTypes: CardTypes
  cards: BlueprintCardData[]
  connections: Connection[]
  legendOrder?: string[]
}

export const defaultCardTypes: CardTypes = {
  user: {
    label: 'Bruger',
    dot: 'bg-blue-500',
    stroke: '#3b82f6',
    card: 'bg-blue-50 border-blue-200 text-blue-950',
    muted: 'text-blue-700',
  },
  ui: {
    label: 'Frontstage / UI',
    dot: 'bg-slate-500',
    stroke: '#64748b',
    card: 'bg-slate-50 border-slate-200 text-slate-950',
    muted: 'text-slate-600',
  },
  ai: {
    label: 'AI / ML',
    dot: 'bg-purple-500',
    stroke: '#a855f7',
    card: 'bg-purple-50 border-purple-200 text-purple-950',
    muted: 'text-purple-700',
  },
  api: {
    label: 'API / data',
    dot: 'bg-emerald-500',
    stroke: '#10b981',
    card: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    muted: 'text-emerald-700',
  },
  analytics: {
    label: 'Analytics',
    dot: 'bg-amber-500',
    stroke: '#f59e0b',
    card: 'bg-amber-50 border-amber-200 text-amber-950',
    muted: 'text-amber-700',
  },
  fail: {
    label: 'Fail state',
    dot: 'bg-red-500',
    stroke: '#ef4444',
    card: 'bg-red-50 border-red-200 text-red-950',
    muted: 'text-red-700',
  },
}

export const defaultPhases: Phase[] = [
  { id: 'phase-1', title: '1. Opstart' },
  { id: 'phase-2', title: '2. Udforskning' },
  { id: 'phase-3', title: '3. Interaktion' },
  { id: 'phase-4', title: '4. Konvertering' },
  { id: 'phase-5', title: '5. Forgrening' },
  { id: 'phase-6', title: '6. Retention' },
]

export const blueprintLanes: Lane[] = [
  { id: 'evidence', title: 'Evidence', hint: 'Visuelt, håndgribeligt bevis' },
  { id: 'journey', title: 'Customer Journey', hint: 'Brugerens handlinger' },
  { id: 'frontstage', title: 'Frontstage', hint: 'UI og system feedback' },
  {
    id: 'backstage',
    title: 'Backstage',
    hint: 'Core engine, DB, events, katalog og data',
    dividerBefore: true,
  },
  {
    id: 'support',
    title: 'Support / infra',
    hint: 'Levering, assets, hosting og drift',
    dividerInternalBefore: true,
  },
  { id: 'external', title: 'External', hint: 'Systemer uden for direkte kontrol' },
]

export function hexToTailwindClasses(hex: string): Omit<CardTypeDef, 'label'> {
  return {
    dot: '',
    stroke: hex,
    card: 'border-opacity-30 bg-opacity-10',
    muted: 'text-slate-600',
  }
}

export function getSafeColSpan(requestedSpan: number, startPhaseId: string, phases: Phase[]): number {
  const startIndex = phases.findIndex((phase) => phase.id === startPhaseId)
  if (startIndex === -1) return 1
  const maxSpan = phases.length - startIndex
  return Math.min(Math.max(1, requestedSpan), maxSpan)
}

export function normalizeBlueprintFromRaw(raw: unknown): BlueprintData {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

  const phases = Array.isArray(record.phases) && record.phases.length > 0
    ? (record.phases as Phase[])
    : defaultPhases

  const cardTypes =
    record.cardTypes && typeof record.cardTypes === 'object'
      ? { ...defaultCardTypes, ...(record.cardTypes as CardTypes) }
      : defaultCardTypes

  const cards = Array.isArray(record.cards) ? (record.cards as BlueprintCardData[]) : []
  const connections = Array.isArray(record.connections)
    ? (record.connections as Connection[])
    : []
  const legendOrder = Array.isArray(record.legendOrder)
    ? (record.legendOrder as string[])
    : Object.keys(cardTypes)

  return { phases, cardTypes, cards, connections, legendOrder }
}

export function blueprintNaturalWidth(phaseCount: number): number {
  return 290 + phaseCount * COLUMN_WIDTH
}

/** Board padding (p-6 = 24px per side) */
export const BLUEPRINT_BOARD_PADDING_X = 48

export function blueprintBoardOuterWidth(phaseCount: number): number {
  return blueprintNaturalWidth(phaseCount) + BLUEPRINT_BOARD_PADDING_X
}

export function hasDisplayCardTitle(title: string | undefined): boolean {
  const t = (title ?? '').trim()
  return t.length > 0 && t !== CARD_TITLE_PLACEHOLDER && t !== 'Nyt kort' && t !== 'Opgave'
}

export function hasDisplayCardBody(body: string | undefined): boolean {
  const b = (body ?? '').trim()
  return b.length > 0 && b !== CARD_BODY_PLACEHOLDER
}

/** Skjul touchpoint-markør i UI når pile viser forbindelser. */
export function shouldShowCardTypeLabel(label: string | undefined): boolean {
  const text = (label ?? '').trim().toLowerCase()
  if (!text) return false
  if (text.includes('touchpoint')) return false
  if (text.includes('synlige') && text.includes('frontstage')) return false
  return true
}

export function makeConnectionPath(
  from: Point,
  to: Point,
  fromSide: Side = 'right',
  toSide: Side = 'left',
): string {
  const gap = 24
  let startX = from.x
  let startY = from.y

  if (fromSide === 'right') startX += gap
  else if (fromSide === 'left') startX -= gap
  else if (fromSide === 'top') startY -= gap
  else if (fromSide === 'bottom') startY += gap

  let endX = to.x
  let endY = to.y

  if (toSide === 'right') endX += gap
  else if (toSide === 'left') endX -= gap
  else if (toSide === 'top') endY -= gap
  else if (toSide === 'bottom') endY += gap

  let path = `M ${from.x} ${from.y} L ${startX} ${startY} `

  if (fromSide === 'left' || fromSide === 'right') {
    if (toSide === 'top' || toSide === 'bottom') {
      path += `L ${endX} ${startY} L ${endX} ${endY} `
    } else {
      const midX = (startX + endX) / 2
      path += `L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY} `
    }
  } else if (toSide === 'left' || toSide === 'right') {
    path += `L ${startX} ${endY} L ${endX} ${endY} `
  } else {
    const midY = (startY + endY) / 2
    path += `L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY} `
  }

  path += `L ${to.x} ${to.y}`
  return path
}

/** Map screen pixels to board layout coords (handles CSS transform scale on board or ancestors). */
export function getBoardLayoutScale(board: HTMLElement): { scaleX: number; scaleY: number } {
  const boardRect = board.getBoundingClientRect()
  const scaleX = board.offsetWidth > 0 ? boardRect.width / board.offsetWidth : 1
  const scaleY = board.offsetHeight > 0 ? boardRect.height / board.offsetHeight : 1
  return {
    scaleX: Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1,
  }
}

export function getCardAnchor(
  board: HTMLElement,
  cardId: string,
  side: Side = 'right',
): Point | null {
  const element = board.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`)
  if (!element) return null

  const boardRect = board.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  const { scaleX, scaleY } = getBoardLayoutScale(board)
  const width = rect.width / scaleX
  const height = rect.height / scaleY

  let x = (rect.left - boardRect.left) / scaleX
  let y = (rect.top - boardRect.top) / scaleY

  if (side === 'left') {
    y += height / 2
  } else if (side === 'right') {
    x += width
    y += height / 2
  } else if (side === 'top') {
    x += width / 2
  } else if (side === 'bottom') {
    x += width / 2
    y += height
  }

  return { x, y }
}

export function buildConnectionPaths(
  board: HTMLElement,
  connections: Connection[],
  cardTypes: CardTypes,
): ConnectionPath[] {
  return connections
    .map((conn) => {
      const from = getCardAnchor(board, conn.fromId, conn.fromSide || 'right')
      const to = getCardAnchor(board, conn.toId, conn.toSide || 'left')
      if (!from || !to) return null

      const typeDef = cardTypes[conn.type] || cardTypes[DEFAULT_CARD_TYPE]
      return {
        ...conn,
        from,
        to,
        d: makeConnectionPath(from, to, conn.fromSide || 'right', conn.toSide || 'left'),
        stroke: typeDef?.stroke || '#64748b',
      }
    })
    .filter((value): value is ConnectionPath => value !== null)
}
