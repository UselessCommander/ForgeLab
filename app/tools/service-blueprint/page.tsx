'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { useProjectToolData } from '@/lib/useProjectToolData'
import {
  buildConnectionPaths,
  getBoardLayoutScale,
  getCardAnchor as getCardAnchorOnBoard,
  shouldShowCardTypeLabel,
} from '@/lib/service-blueprint'
import { ServiceBlueprintLineDivider } from '@/components/service-blueprint/ServiceBlueprintLineDivider'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMN_WIDTH = 275
const DEFAULT_CARD_TYPE = 'ui'
const MIN_BOARD_ZOOM = 0.5
const MAX_BOARD_ZOOM = 1.6
const BOARD_ZOOM_STEP = 0.1

// ─── Types ────────────────────────────────────────────────────────────────────

type IconName = 'plus' | 'trash' | 'copy' | 'grip' | 'check' | 'eye' | 'eyeOff'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface CardTypeDef {
  label: string
  dot: string
  stroke: string
  card: string
  muted: string
}

type CardTypes = Record<string, CardTypeDef>

interface Phase {
  id: string
  title: string
}

interface Lane {
  id: string
  title: string
  hint: string
  /** Line of Visibility (customer-facing vs internal) */
  dividerBefore?: boolean
  /** Line of internal interaction (fx mellem backstage og support) */
  dividerInternalBefore?: boolean
}

interface BlueprintCardData {
  id: string
  laneId: string
  phaseId: string
  type: string
  title: string
  body: string
  order: number
  colSpan: number
}

interface Connection {
  id: string
  fromId: string
  toId: string
  type: string
  fromSide: Side
  toSide: Side
}

interface Point {
  x: number
  y: number
}

interface ConnectionPath extends Connection {
  from: Point
  to: Point
  d: string
  stroke: string
}

type DraftConnection =
  | {
      mode: 'new'
      fromId: string
      fromSide: Side
      startX: number
      startY: number
      x: number
      y: number
    }
  | {
      mode: 'edit'
      connectionId: string
      editingEnd: 'from' | 'to'
      toId?: string
      toSide?: Side
      fromId?: string
      fromSide?: Side
      startX?: number
      startY?: number
      endX?: number
      endY?: number
      x: number
      y: number
    }

interface BlueprintData {
  phases: Phase[]
  cardTypes: CardTypes
  cards: BlueprintCardData[]
  connections: Connection[]
  /** Rækkefølge af legend-typer (keys i cardTypes) */
  legendOrder?: string[]
}

// ─── Icon component ───────────────────────────────────────────────────────────

const Icon = ({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) => {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const icons: Record<IconName, React.ReactElement> = {
    plus: (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    trash: (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    ),
    copy: (
      <svg {...common}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    grip: (
      <svg {...common}>
        <circle cx="9" cy="5" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="19" r="1" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    eye: (
      <svg {...common}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    eyeOff: (
      <svg {...common}>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
        <path d="M9.9 4.4A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16.8 16.8 0 0 1-3.1 4.2" />
        <path d="M6.1 6.8C3.5 8.7 2 12 2 12s3.5 8 10 8c1.4 0 2.7-.3 3.8-.8" />
      </svg>
    ),
  }

  return icons[name] || icons.plus
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultCardTypes: CardTypes = {
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

const defaultPhases: Phase[] = [
  { id: 'phase-1', title: '1. Opstart' },
  { id: 'phase-2', title: '2. Udforskning' },
  { id: 'phase-3', title: '3. Interaktion' },
  { id: 'phase-4', title: '4. Konvertering' },
  { id: 'phase-5', title: '5. Forgrening' },
  { id: 'phase-6', title: '6. Retention' },
]

const defaultLanes: Lane[] = [
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

const defaultCards: BlueprintCardData[] = [
  {
    id: 'c1',
    laneId: 'journey',
    phaseId: 'phase-1',
    type: 'user',
    title: 'Åbner app',
    body: 'Brugeren starter appen.',
    order: 1,
    colSpan: 1,
  },
  {
    id: 'c2',
    laneId: 'frontstage',
    phaseId: 'phase-1',
    type: 'ui',
    title: 'Viser splash',
    body: 'Indlæser forside.',
    order: 1,
    colSpan: 1,
  },
]

const defaultConnections: Connection[] = [
  {
    id: 'conn-1',
    fromId: 'c1',
    toId: 'c2',
    type: 'ui',
    fromSide: 'bottom',
    toSide: 'top',
  },
]

const tailwindColors = [
  '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToTailwindClasses(hex: string): Omit<CardTypeDef, 'label'> {
  return {
    dot: '',
    stroke: hex,
    card: 'border-opacity-30 bg-opacity-10',
    muted: 'text-slate-600',
  }
}

function makeId(prefix: string = 'card'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Bevar rækkefølge fra saved data og tilføj nye keys til sidst. */
function mergeLegendOrder(order: string[] | undefined, types: CardTypes): string[] {
  const keys = Object.keys(types)
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of order || []) {
    if (keys.includes(k) && !seen.has(k)) {
      out.push(k)
      seen.add(k)
    }
  }
  for (const k of keys) {
    if (!seen.has(k)) out.push(k)
  }
  return out
}

function getSafeColSpan(requestedSpan: number, startPhaseId: string, phases: Phase[]): number {
  const startIndex = phases.findIndex((phase) => phase.id === startPhaseId)
  if (startIndex === -1) return 1
  const maxSpan = phases.length - startIndex
  return Math.min(Math.max(1, requestedSpan), maxSpan)
}

function makeConnectionPath(
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
  onClose,
}: {
  value: string
  onChange: (hex: string) => void
  onClose: () => void
}) {
  const [hex, setHex] = useState(value)

  return (
    <div className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">Vælg farve</span>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <Icon name="plus" className="h-4 w-4 rotate-45" />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {tailwindColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              setHex(color)
              onChange(color)
            }}
            className={`h-6 w-6 cursor-pointer rounded-full transition-transform hover:scale-110 ${
              value === color ? 'ring-2 ring-slate-800 ring-offset-2' : ''
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Vælg farven ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <div className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: hex }} />
        <input
          type="text"
          value={hex}
          onChange={(event) => {
            setHex(event.target.value)
            onChange(event.target.value)
          }}
          className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-xs uppercase outline-none focus:border-blue-400"
          suppressHydrationWarning
        />
      </div>
    </div>
  )
}


/** Min/max kort-højde (px) — samme værdier bruges til span-placeholders. */
const CARD_MIN_HEIGHT_PX = 200
const CARD_MAX_HEIGHT_PX = 380
const CELL_MIN_HEIGHT_PX = 220

interface BlueprintCardProps {
  card: BlueprintCardData
  cardTypes: CardTypes
  /** Rækkefølge af type-keys til dropdown (matcher legend) */
  typeOptionKeys: string[]
  onUpdate: (cardId: string, patch: Partial<BlueprintCardData>) => void
  onDelete: (cardId: string) => void
  onDuplicate: (cardId: string) => void
  onDragStart: (event: React.DragEvent | null, cardId: string | null) => void
  onDragOverCard: (event: React.DragEvent, cardId: string) => void
  onStartConnection: (event: React.PointerEvent, cardId: string, side: Side) => void
  onCardHover: (cardId: string | null) => void
  isDragging: boolean
  isConnectionSource: boolean
  onResizeStart: (event: React.PointerEvent, cardId: string) => void
}

function BlueprintCard({
  card,
  cardTypes,
  typeOptionKeys,
  onUpdate,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOverCard,
  onStartConnection,
  onCardHover,
  isDragging,
  isConnectionSource,
  onResizeStart,
}: BlueprintCardProps) {
  const type =
    cardTypes[card.type] ||
    cardTypes[DEFAULT_CARD_TYPE] || {
      label: 'Default',
      ...hexToTailwindClasses('#64748b'),
    }
  const span = card.colSpan || 1
  const usesCustomColor = type.card.includes('bg-opacity')
  const showTypeLabel = shouldShowCardTypeLabel(type.label)

  return (
    <div
      data-card-id={card.id}
      draggable
      onPointerEnter={() => onCardHover(card.id)}
      onPointerLeave={() => onCardHover(null)}
      onDragStart={(event) => onDragStart(event, card.id)}
      onDragEnd={() => onDragStart(null, null)}
      onDragOver={(event) => onDragOverCard(event, card.id)}
      className={`group relative rounded-2xl border p-3 shadow-sm transition-shadow hover:shadow-md ${type.card} ${
        isDragging ? 'opacity-40 ring-2 ring-slate-400' : ''
      } ${isConnectionSource ? 'ring-2 ring-blue-400 ring-offset-2' : ''} flex min-h-0 flex-col overflow-visible`}
      style={{
        height: '100%',
        minHeight: CARD_MIN_HEIGHT_PX,
        maxHeight: CARD_MAX_HEIGHT_PX,
        backgroundColor: usesCustomColor ? `${type.stroke}15` : undefined,
        borderColor: usesCustomColor ? `${type.stroke}40` : undefined,
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity group-hover:opacity-100">
        {(
          [
            { side: 'top', cls: '-top-[5px] left-1/2 -translate-x-1/2 cursor-crosshair' },
            { side: 'bottom', cls: '-bottom-[5px] left-1/2 -translate-x-1/2 cursor-crosshair' },
            { side: 'left', cls: '-left-[5px] top-1/2 -translate-y-1/2 cursor-crosshair' },
            { side: 'right', cls: '-right-[5px] top-1/2 -translate-y-1/2 cursor-crosshair' },
          ] as { side: Side; cls: string }[]
        ).map((point) => (
          <div
            key={point.side}
            onPointerDown={(event) => onStartConnection(event, card.id, point.side)}
            className={`pointer-events-auto absolute z-40 h-4 w-4 rounded-full border-2 border-white transition-transform hover:scale-150 ${point.cls}`}
            style={{ backgroundColor: type.stroke || '#3b82f6' }}
            title={`Træk linje fra ${point.side}`}
          />
        ))}
      </div>

      <div
        className="pointer-events-auto absolute bottom-2 right-1 z-10 flex h-10 w-2.5 cursor-col-resize items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
        onPointerDown={(event) => onResizeStart(event, card.id)}
        title="Træk for at forlænge kortet"
      >
        <div className="h-8 w-0.5 rounded-full bg-slate-300" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-row items-start gap-2 overflow-hidden rounded-xl">
        <div
          className="pointer-events-auto mt-0.5 shrink-0 cursor-grab text-slate-400 active:cursor-grabbing"
          title="Træk kort"
        >
          <Icon name="grip" className="h-4 w-4" />
        </div>
        <div className="pointer-events-auto flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center self-start">
              <span
                className={`block h-2.5 w-2.5 shrink-0 rounded-full ${type.dot}`}
                style={{
                  backgroundColor: type.stroke,
                  minWidth: 10,
                  minHeight: 10,
                  maxWidth: 10,
                  maxHeight: 10,
                }}
              />
            </span>
            {showTypeLabel ? (
              <select
                value={card.type}
                onChange={(event) => onUpdate(card.id, { type: event.target.value })}
                className="pointer-events-auto max-w-[130px] rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-slate-300"
              >
                {typeOptionKeys.map((key) => {
                  const value = cardTypes[key]
                  if (!value) return null
                  return (
                    <option key={key} value={key}>
                      {value.label || 'Ny kategori'}
                    </option>
                  )
                })}
              </select>
            ) : null}
            {span > 1 && (
              <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                {span} faser
              </span>
            )}
          </div>

          <input
            value={card.title}
            onChange={(event) => onUpdate(card.id, { title: event.target.value })}
            className="pointer-events-auto w-full rounded-lg bg-transparent text-sm font-extrabold outline-none focus:bg-white/70 focus:px-2 focus:py-1"
            placeholder="Korttitel"
            suppressHydrationWarning
          />
          <textarea
            value={card.body}
            onChange={(event) => onUpdate(card.id, { body: event.target.value })}
            className={`pointer-events-auto mt-1 min-h-[72px] w-full flex-1 resize-none overflow-y-auto rounded-lg bg-transparent text-xs leading-relaxed outline-none focus:bg-white/70 focus:px-2 focus:py-1 ${type.muted}`}
            style={{ color: usesCustomColor ? '#334155' : undefined }}
            placeholder="Beskriv handling, systemrespons eller proces..."
            suppressHydrationWarning
          />
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-2 right-2 z-20 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onDuplicate(card.id)}
          className="rounded-lg bg-white/80 p-1.5 text-slate-600 shadow-sm hover:bg-white hover:text-slate-950"
          title="Dupliker kort"
        >
          <Icon name="copy" className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded-lg bg-white/80 p-1.5 text-red-500 shadow-sm hover:bg-white hover:text-red-700"
          title="Slet kort"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServiceBlueprintPage() {
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardZoom, setBoardZoom] = useState(1)

  // Back-button: project-aware (samme pattern som brugerrejse)
  const [backNav, setBackNav] = useState<{ href: string; label: string }>({
    href: '/dashboard',
    label: 'Tilbage til Dashboard',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const projectId = new URLSearchParams(window.location.search).get('projectId')
    if (projectId) {
      setBackNav({
        href: `/dashboard/projects/${projectId}`,
        label: 'Tilbage til projekt',
      })
    }
  }, [])

  const [phases, setPhases] = useState<Phase[]>(defaultPhases)
  const [lanes] = useState<Lane[]>(defaultLanes)
  const [cardTypes, setCardTypes] = useState<CardTypes>(defaultCardTypes)
  const [legendOrder, setLegendOrder] = useState<string[]>(() => Object.keys(defaultCardTypes))
  const [cards, setCards] = useState<BlueprintCardData[]>(defaultCards)
  const [connections, setConnections] = useState<Connection[]>(defaultConnections)

  // ── Persistence (samme pattern som brugerrejse) ──
  const data = useMemo<BlueprintData>(
    () => ({ phases, cardTypes, cards, connections, legendOrder }),
    [phases, cardTypes, cards, connections, legendOrder],
  )

  const setData = useCallback((next: BlueprintData) => {
    if (Array.isArray(next?.phases)) setPhases(next.phases)
    if (next?.cardTypes && typeof next.cardTypes === 'object') {
      setCardTypes(next.cardTypes)
      setLegendOrder(mergeLegendOrder(next.legendOrder, next.cardTypes))
    }
    if (Array.isArray(next?.cards)) setCards(next.cards)
    if (Array.isArray(next?.connections)) setConnections(next.connections)
  }, [])

  useProjectToolData<BlueprintData>('service-blueprint', data, setData, 1000)

  // ── UI state ──
  const [connectionPaths, setConnectionPaths] = useState<ConnectionPath[]>([])
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [isDraggingLegend, setIsDraggingLegend] = useState(false)
  const [resizingCard, setResizingCard] = useState<
    { cardId: string; initialX: number; initialSpan: number } | null
  >(null)
  const [hiddenConnectionTypes, setHiddenConnectionTypes] = useState<string[]>([])
  const [editingLegendId, setEditingLegendId] = useState<string | null>(null)
  const [pickingColorFor, setPickingColorFor] = useState<string | null>(null)

  const orderedLegendKeys = useMemo(
    () => legendOrder.filter((k) => Object.prototype.hasOwnProperty.call(cardTypes, k)),
    [legendOrder, cardTypes],
  )

  const cardsByCell = useMemo(() => {
    const map = new Map<string, BlueprintCardData[]>()
    for (const lane of lanes) {
      for (const phase of phases) {
        map.set(`${lane.id}:${phase.id}`, [])
      }
    }
    for (const card of cards) {
      const key = `${card.laneId}:${card.phaseId}`
      const list = map.get(key)
      if (list) list.push(card)
    }
    map.forEach((value, key) => {
      map.set(
        key,
        [...value].sort(
          (a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title),
        ),
      )
    })
    return map
  }, [cards, phases, lanes])

  const rebuildConnectionPaths = useCallback(() => {
    const board = boardRef.current
    if (!board) return

    const nextPaths = buildConnectionPaths(board, connections, cardTypes).filter(
      (conn) => !hiddenConnectionTypes.includes(conn.type),
    )

    setConnectionPaths(nextPaths as ConnectionPath[])
  }, [connections, cardTypes, hiddenConnectionTypes])

  useEffect(() => {
    const frame = window.requestAnimationFrame(rebuildConnectionPaths)
    return () => window.cancelAnimationFrame(frame)
  }, [rebuildConnectionPaths, cards, phases, boardZoom])

  const getCardAnchor = useCallback((cardId: string, side: Side = 'right'): Point | null => {
    const board = boardRef.current
    if (!board) return null
    return getCardAnchorOnBoard(board, cardId, side)
  }, [])

  const handleDragStart = useCallback(
    (event: React.DragEvent | null, cardId: string | null) => {
      if (!event || !cardId) {
        setDraggingCardId(null)
        return
      }
      setDraggingCardId(cardId)
      event.dataTransfer.setData('text/plain', cardId)
      event.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const handleLegendDragStart = useCallback((event: React.DragEvent, typeKey: string) => {
    setIsDraggingLegend(true)
    event.dataTransfer.setData('blueprint/legend', typeKey)
    event.dataTransfer.effectAllowed = 'copyMove'
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent, laneId: string, phaseId: string) => {
      event.preventDefault()
      const legendType = event.dataTransfer?.getData('blueprint/legend')

      if (legendType && isDraggingLegend) {
        const newCard: BlueprintCardData = {
          id: makeId(),
          laneId,
          phaseId,
          type: legendType,
          title: 'Nyt kort',
          body: '',
          order: 99,
          colSpan: 1,
        }
        setCards((current) => [...current, newCard])
        setIsDraggingLegend(false)
      } else {
        const cardId = event.dataTransfer?.getData('text/plain') || draggingCardId
        if (cardId) {
          setCards((current) =>
            current.map((card) => (card.id === cardId ? { ...card, laneId, phaseId } : card)),
          )
        }
      }

      setDraggingCardId(null)
      setDragOverCell(null)
    },
    [draggingCardId, isDraggingLegend],
  )

  const handleStartConnection = useCallback(
    (event: React.PointerEvent, fromId: string, side: Side) => {
      event.preventDefault()
      event.stopPropagation()

      const start = getCardAnchor(fromId, side) || { x: 0, y: 0 }
      setDraftConnection({
        mode: 'new',
        fromId,
        fromSide: side,
        startX: start.x,
        startY: start.y,
        x: start.x,
        y: start.y,
      })
    },
    [getCardAnchor],
  )

  const handleStartEditConnection = useCallback(
    (event: React.PointerEvent, connectionId: string, editingEnd: 'from' | 'to') => {
      event.preventDefault()
      event.stopPropagation()

      const connection = connections.find((conn) => conn.id === connectionId)
      if (!connection) return

      const fromAnchor = getCardAnchor(connection.fromId, connection.fromSide || 'right')
      const toAnchor = getCardAnchor(connection.toId, connection.toSide || 'left')
      if (!fromAnchor || !toAnchor) return

      if (editingEnd === 'from') {
        setDraftConnection({
          mode: 'edit',
          connectionId,
          editingEnd,
          toId: connection.toId,
          toSide: connection.toSide,
          endX: toAnchor.x,
          endY: toAnchor.y,
          x: fromAnchor.x,
          y: fromAnchor.y,
        })
      } else {
        setDraftConnection({
          mode: 'edit',
          connectionId,
          editingEnd,
          fromId: connection.fromId,
          fromSide: connection.fromSide,
          startX: fromAnchor.x,
          startY: fromAnchor.y,
          x: toAnchor.x,
          y: toAnchor.y,
        })
      }
    },
    [connections, getCardAnchor],
  )

  useEffect(() => {
    if (!draftConnection) return undefined

    const board = boardRef.current
    if (!board) return undefined

    const handlePointerMove = (event: PointerEvent) => {
      const rect = board.getBoundingClientRect()
      const { scaleX, scaleY } = getBoardLayoutScale(board)
      setDraftConnection((current) =>
        current
          ? {
              ...current,
              x: (event.clientX - rect.left) / scaleX,
              y: (event.clientY - rect.top) / scaleY,
            }
          : null,
      )
    }

    const handlePointerUp = (event: PointerEvent) => {
      const svgLayer = board.querySelector<SVGElement>('.svg-layer')
      if (svgLayer) svgLayer.style.pointerEvents = 'none'

      const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY)
      const target = elementAtPoint?.closest?.('[data-card-id]') as HTMLElement | null
      const targetCardId = target?.getAttribute('data-card-id')

      if (svgLayer) svgLayer.style.removeProperty('pointer-events')

      if (targetCardId) {
        const targetElement = document.querySelector<HTMLElement>(
          `[data-card-id="${targetCardId}"]`,
        )
        let toSide: Side = 'left'

        if (targetElement) {
          const rect = targetElement.getBoundingClientRect()
          const dl = Math.abs(event.clientX - rect.left)
          const dr = Math.abs(event.clientX - rect.right)
          const dt = Math.abs(event.clientY - rect.top)
          const db = Math.abs(event.clientY - rect.bottom)
          const min = Math.min(dl, dr, dt, db)

          if (min === dr) toSide = 'right'
          else if (min === dt) toSide = 'top'
          else if (min === db) toSide = 'bottom'
        }

        if (draftConnection.mode === 'new' && targetCardId !== draftConnection.fromId) {
          const fromCard = cards.find((card) => card.id === draftConnection.fromId)

          setConnections((current) => {
            const exists = current.some(
              (conn) => conn.fromId === draftConnection.fromId && conn.toId === targetCardId,
            )
            if (exists) return current

            return [
              ...current,
              {
                id: makeId('conn'),
                fromId: draftConnection.fromId,
                toId: targetCardId,
                type: fromCard?.type || DEFAULT_CARD_TYPE,
                fromSide: draftConnection.fromSide,
                toSide,
              },
            ]
          })
        } else if (draftConnection.mode === 'edit') {
          setConnections((current) =>
            current.map((conn) => {
              if (conn.id !== draftConnection.connectionId) return conn

              if (draftConnection.editingEnd === 'from') {
                if (targetCardId === conn.toId) return conn
                return { ...conn, fromId: targetCardId, fromSide: toSide }
              }

              if (targetCardId === conn.fromId) return conn
              return { ...conn, toId: targetCardId, toSide }
            }),
          )
        }
      }

      setDraftConnection(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      const svgLayer = board.querySelector<SVGElement>('.svg-layer')
      svgLayer?.style.removeProperty('pointer-events')
    }
  }, [draftConnection, cards, boardZoom])

  const clearSvgLayerPointerBlock = useCallback(() => {
    boardRef.current?.querySelector<SVGElement>('.svg-layer')?.style.removeProperty('pointer-events')
  }, [])

  useEffect(() => {
    clearSvgLayerPointerBlock()
  }, [clearSvgLayerPointerBlock])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedConnectionId) {
        setSelectedConnectionId(null)
        return
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedConnectionId) {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

        setConnections((current) => current.filter((conn) => conn.id !== selectedConnectionId))
        setSelectedConnectionId(null)
        setDraftConnection(null)
        clearSvgLayerPointerBlock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedConnectionId, clearSvgLayerPointerBlock])

  const deleteCard = useCallback((cardId: string) => {
    setCards((current) => current.filter((card) => card.id !== cardId))
    setConnections((current) =>
      current.filter((conn) => conn.fromId !== cardId && conn.toId !== cardId),
    )
  }, [])

  const duplicateCard = useCallback(
    (cardId: string) => {
      const source = cards.find((card) => card.id === cardId)
      if (!source) return
      setCards((current) => [
        ...current,
        { ...source, id: makeId(), title: `${source.title} kopi` },
      ])
    },
    [cards],
  )

  const updateCard = useCallback((cardId: string, patch: Partial<BlueprintCardData>) => {
    setCards((current) => current.map((card) => (card.id === cardId ? { ...card, ...patch } : card)))

    if (patch.type) {
      setConnections((current) =>
        current.map((conn) => (conn.fromId === cardId ? { ...conn, type: patch.type! } : conn)),
      )
    }
  }, [])

  const addPhase = useCallback(() => {
    setPhases((current) => [
      ...current,
      { id: makeId('phase'), title: `${current.length + 1}. Ny fase` },
    ])
  }, [])

  const updateBoardZoom = useCallback((nextZoom: number) => {
    setBoardZoom(Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, nextZoom)))
  }, [])

  const deletePhase = useCallback((phaseId: string) => {
    setPhases((current) => {
      if (current.length <= 1) return current

      const phaseIndex = current.findIndex((phase) => phase.id === phaseId)
      if (phaseIndex === -1) return current

      const nextPhases = current.filter((phase) => phase.id !== phaseId)
      const fallbackPhaseId = nextPhases[Math.min(phaseIndex, nextPhases.length - 1)].id

      setCards((cardsCurrent) =>
        cardsCurrent.map((card) => {
          const nextPhaseId = card.phaseId === phaseId ? fallbackPhaseId : card.phaseId
          return {
            ...card,
            phaseId: nextPhaseId,
            colSpan: getSafeColSpan(card.colSpan || 1, nextPhaseId, nextPhases),
          }
        }),
      )

      return nextPhases
    })
  }, [])

  const handleResizeStart = useCallback(
    (event: React.PointerEvent, cardId: string) => {
      event.preventDefault()
      event.stopPropagation()

      const card = cards.find((item) => item.id === cardId)
      if (!card) return

      setResizingCard({ cardId, initialX: event.clientX, initialSpan: card.colSpan || 1 })
    },
    [cards],
  )

  useEffect(() => {
    if (!resizingCard) return undefined

    const handlePointerMove = (event: PointerEvent) => {
      const diffX = (event.clientX - resizingCard.initialX) / boardZoom
      const additionalColumns = Math.round(diffX / COLUMN_WIDTH)
      const newSpan = Math.max(1, resizingCard.initialSpan + additionalColumns)

      const card = cards.find((item) => item.id === resizingCard.cardId)
      if (card) {
        const safeSpan = getSafeColSpan(newSpan, card.phaseId, phases)
        updateCard(resizingCard.cardId, { colSpan: safeSpan })
      }
    }

    const handlePointerUp = () => setResizingCard(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [resizingCard, cards, phases, updateCard, boardZoom])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <style>{`
        .flow-line { animation: flowDash 1.1s linear infinite; }
        .flow-line-slow { animation: flowDash 1.6s linear infinite; }
        .flow-line-fast { animation: flowDash 0.8s linear infinite; }
        @keyframes flowDash { to { stroke-dashoffset: -16; } }
        @media (prefers-reduced-motion: reduce) { .flow-line, .flow-line-slow, .flow-line-fast { animation: none; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className="z-30 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backNav.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">{backNav.label}</span>
          </Link>
          <div className="hidden h-6 w-px bg-slate-200 md:block" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-black tracking-tight text-slate-900">
              Service Blueprint
            </h1>
            <p className="hidden truncate text-[11px] font-medium text-slate-500 md:block">
              Træk kort og pile mellem kolonner
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addPhase}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Tilføj fase
        </button>
      </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="z-30 flex w-64 shrink-0 flex-col gap-8 overflow-y-auto border-r border-slate-200 bg-white p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Legends</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newKey = makeId('type')
                    setCardTypes((current) => ({
                      ...current,
                      [newKey]: { label: 'Ny kategori', ...hexToTailwindClasses('#3b82f6') },
                    }))
                    setLegendOrder((lo) => [...lo, newKey])
                  }}
                  className="text-slate-400 hover:text-blue-500"
                  title="Tilføj kategori"
                >
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {orderedLegendKeys.map((key) => {
                  const def = cardTypes[key]
                  if (!def) return null
                  return (
                  <div key={key} className="flex flex-col gap-1">
                    <div
                      draggable
                      onDragStart={(event) => handleLegendDragStart(event, key)}
                      onDragEnd={() => setIsDraggingLegend(false)}
                      onDragOver={(event) => {
                        if (Array.from(event.dataTransfer.types).includes('blueprint/legend')) {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        const draggedKey = event.dataTransfer.getData('blueprint/legend')
                        if (!draggedKey || draggedKey === key || !cardTypes[draggedKey]) {
                          setIsDraggingLegend(false)
                          return
                        }
                        setLegendOrder((prev) => {
                          const filtered = prev.filter((k) => k !== draggedKey)
                          const ti = filtered.indexOf(key)
                          if (ti === -1) return [...filtered, draggedKey]
                          return [...filtered.slice(0, ti), draggedKey, ...filtered.slice(ti)]
                        })
                        setIsDraggingLegend(false)
                      }}
                      className="group flex cursor-grab items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white p-2 transition-all hover:border-slate-300 hover:shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <Icon name="grip" className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center self-start">
                          <button
                            type="button"
                            onClick={() => setPickingColorFor(pickingColorFor === key ? null : key)}
                            className="h-3 w-3 shrink-0 rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            style={{
                              backgroundColor: def.stroke || '#cbd5e1',
                              minWidth: 12,
                              minHeight: 12,
                              maxWidth: 12,
                              maxHeight: 12,
                            }}
                            title="Skift farve"
                          />
                        </span>
                        {editingLegendId === key ? (
                          <input
                            autoFocus
                            className="min-w-0 flex-1 rounded bg-slate-100 px-1 py-0.5 text-xs font-bold outline-none"
                            value={def.label || 'Ny kategori'}
                            onBlur={() => setEditingLegendId(null)}
                            onChange={(event) =>
                              setCardTypes((current) => ({
                                ...current,
                                [key]: { ...current[key], label: event.target.value },
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') setEditingLegendId(null)
                            }}
                            suppressHydrationWarning
                          />
                        ) : (
                          <span
                            className="min-w-0 flex-1 text-xs font-bold leading-snug text-slate-700 line-clamp-3"
                            onDoubleClick={() => setEditingLegendId(key)}
                          >
                            {def.label || 'Ny kategori'}
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex shrink-0 items-center gap-1 transition-opacity ${
                          hiddenConnectionTypes.includes(key)
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setHiddenConnectionTypes((current) =>
                              current.includes(key)
                                ? current.filter((item) => item !== key)
                                : [...current, key],
                            )
                          }}
                          className={`rounded p-1 ${
                            hiddenConnectionTypes.includes(key)
                              ? 'text-slate-400 hover:text-slate-600'
                              : 'text-slate-400 hover:bg-slate-50 hover:text-blue-500'
                          }`}
                          title={
                            hiddenConnectionTypes.includes(key)
                              ? 'Vis pile af denne type'
                              : 'Skjul pile af denne type'
                          }
                        >
                          <Icon
                            name={hiddenConnectionTypes.includes(key) ? 'eyeOff' : 'eye'}
                            className="h-3.5 w-3.5"
                          />
                        </button>

                        {key !== DEFAULT_CARD_TYPE && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              const updated = { ...cardTypes }
                              delete updated[key]
                              setCardTypes(updated)
                              setLegendOrder((lo) => lo.filter((k) => k !== key))
                              setCards((current) =>
                                current.map((card) =>
                                  card.type === key ? { ...card, type: DEFAULT_CARD_TYPE } : card,
                                ),
                              )
                              setConnections((current) =>
                                current.map((conn) =>
                                  conn.type === key ? { ...conn, type: DEFAULT_CARD_TYPE } : conn,
                                ),
                              )
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-red-500"
                            title="Slet kategori"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {pickingColorFor === key && (
                      <div className="relative">
                        <ColorPicker
                          value={def.stroke}
                          onChange={(hex) =>
                            setCardTypes((current) => ({
                              ...current,
                              [key]: { ...current[key], ...hexToTailwindClasses(hex) },
                            }))
                          }
                          onClose={() => setPickingColorFor(null)}
                        />
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          </aside>

          <main className="hide-scrollbar relative flex-1 overflow-auto bg-[#f8fafc]">
            <div className="sticky left-4 top-4 z-50 ml-4 mt-4 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => updateBoardZoom(boardZoom - BOARD_ZOOM_STEP)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-lg font-black text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={boardZoom <= MIN_BOARD_ZOOM}
                title="Zoom ud"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => updateBoardZoom(1)}
                className="min-w-14 rounded-xl px-2 py-1 text-xs font-extrabold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                title="Nulstil zoom"
              >
                {Math.round(boardZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => updateBoardZoom(boardZoom + BOARD_ZOOM_STEP)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-lg font-black text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={boardZoom >= MAX_BOARD_ZOOM}
                title="Zoom ind"
              >
                +
              </button>
            </div>

            {selectedConnectionId && (
              <div className="pointer-events-auto sticky left-4 top-[4.5rem] z-[60] ml-4 mt-2 flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs shadow-lg">
                <span className="font-semibold text-slate-700">Forbindelse valgt</span>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-2.5 py-1 font-bold text-white hover:bg-red-700"
                  onClick={() => {
                    setConnections((current) =>
                      current.filter((conn) => conn.id !== selectedConnectionId),
                    )
                    setSelectedConnectionId(null)
                    setDraftConnection(null)
                    clearSvgLayerPointerBlock()
                  }}
                >
                  Slet linje
                </button>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setSelectedConnectionId(null)}
                >
                  Annuller
                </button>
                <span className="hidden text-slate-400 sm:inline">Backspace/Delete sletter også</span>
              </div>
            )}

            <div
              ref={boardRef}
              className="relative min-w-max p-8 pb-32"
              style={{
                transform: `scale(${boardZoom})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="relative z-20 grid items-stretch"
                style={{
                  gridTemplateColumns: `minmax(290px, auto) repeat(${phases.length}, ${COLUMN_WIDTH}px)`,
                  gridAutoRows: 'minmax(min-content, auto)',
                }}
              >
                <div />
                {phases.map((phase) => (
                  <div key={phase.id} className="group p-4">
                    <div className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition group-hover:border-slate-200 group-hover:bg-white/70">
                      <input
                        value={phase.title}
                        onChange={(event) =>
                          setPhases((current) =>
                            current.map((item) =>
                              item.id === phase.id ? { ...item, title: event.target.value } : item,
                            ),
                          )
                        }
                        className="min-w-0 flex-1 rounded-md bg-transparent text-sm font-bold outline-none focus:bg-white/80 focus:px-2 focus:py-1"
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => deletePhase(phase.id)}
                        disabled={phases.length <= 1}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300 group-hover:opacity-100"
                        title={phases.length <= 1 ? 'Der skal være mindst en fase' : 'Slet fase'}
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {lanes.map((lane) => (
                  <React.Fragment key={lane.id}>
                    {lane.dividerBefore && (
                      <ServiceBlueprintLineDivider label="Line of Visibility" variant="solid" phaseCount={phases.length} />
                    )}
                    {lane.dividerInternalBefore && (
                      <ServiceBlueprintLineDivider
                        label="Line of internal interaction"
                        variant="dashed"
                        phaseCount={phases.length}
                      />
                    )}

                    <div className="group relative flex min-h-[220px] flex-col border-t-2 border-slate-200/60 p-4">
                      <div className="sticky top-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          {lane.title}
                        </h4>
                        <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                          {lane.hint}
                        </p>
                      </div>
                    </div>

                    {phases.map((phase) => {
                      const cellKey = `${lane.id}:${phase.id}`
                      const cellCards = cardsByCell.get(cellKey) || []
                      const isDragOver = dragOverCell === cellKey

                      return (
                        <div
                          key={cellKey}
                          className={`relative flex min-h-[220px] flex-col border-l border-t-2 border-slate-200/60 p-4 transition-colors ${
                            isDragOver ? 'bg-blue-50/60' : ''
                          }`}
                          onDragOver={(event) => {
                            event.preventDefault()
                            event.dataTransfer.dropEffect = isDraggingLegend ? 'copy' : 'move'
                            setDragOverCell(cellKey)
                          }}
                          onDragLeave={() => setDragOverCell(null)}
                          onDrop={(event) => handleDrop(event, lane.id, phase.id)}
                        >
                          <div className="relative z-20 flex min-h-0 flex-1 flex-col gap-3">
                            {cellCards.map((card) => {
                              const span = getSafeColSpan(card.colSpan || 1, phase.id, phases)
                              return (
                                <div
                                  key={card.id}
                                  className="flex min-h-0 flex-1 flex-col"
                                  style={{
                                    width: `${span * COLUMN_WIDTH - 32}px`,
                                    position: span > 1 ? 'absolute' : 'relative',
                                    zIndex: span > 1 ? 30 : 'auto',
                                  }}
                                >
                                  <BlueprintCard
                                    card={card}
                                    cardTypes={cardTypes}
                                    typeOptionKeys={orderedLegendKeys}
                                    onUpdate={updateCard}
                                    onDelete={deleteCard}
                                    onDuplicate={duplicateCard}
                                    onDragStart={handleDragStart}
                                    onDragOverCard={(event) => event.preventDefault()}
                                    onStartConnection={handleStartConnection}
                                    onCardHover={setHoveredCardId}
                                    isDragging={draggingCardId === card.id}
                                    isConnectionSource={
                                      draftConnection?.mode === 'new' &&
                                      draftConnection.fromId === card.id
                                    }
                                    onResizeStart={handleResizeStart}
                                  />
                                </div>
                              )
                            })}

                            {cellCards.map((card) => {
                              const span = getSafeColSpan(card.colSpan || 1, phase.id, phases)
                              if (span > 1) {
                                return (
                                  <div
                                    key={`placeholder-${card.id}`}
                                    style={{ height: CARD_MIN_HEIGHT_PX }}
                                    className="pointer-events-none w-full opacity-0"
                                  />
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>

              <svg
                className="svg-layer pointer-events-none absolute inset-0 z-[25] h-full w-full overflow-visible"
              >
                <defs>
                  <marker
                    id="arrow-draft"
                    viewBox="0 0 12 12"
                    refX="10"
                    refY="6"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 12 6 L 0 12 z" fill="#94a3b8" />
                  </marker>
                </defs>

                {connectionPaths.map((conn) => {
                  const isConnectedToHoveredCard =
                    !!hoveredCardId &&
                    (conn.fromId === hoveredCardId || conn.toId === hoveredCardId)
                  const isActive =
                    hoveredConnectionId === conn.id ||
                    selectedConnectionId === conn.id ||
                    isConnectedToHoveredCard
                  const isDimmedByCardHover = hoveredCardId && !isConnectedToHoveredCard
                  const opacityClass = isDimmedByCardHover
                    ? 'opacity-15'
                    : isActive
                      ? 'opacity-100'
                      : 'opacity-60'

                  return (
                    <g key={`path-${conn.id}`} className={opacityClass}>
                      <defs>
                        <marker
                          id={`arrow-${conn.id}`}
                          viewBox="0 0 12 12"
                          refX="10"
                          refY="6"
                          markerWidth={isActive ? '7' : '6'}
                          markerHeight={isActive ? '7' : '6'}
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 12 6 L 0 12 z" fill={conn.stroke} />
                        </marker>
                      </defs>

                      <path
                        d={conn.d}
                        fill="none"
                        stroke={conn.stroke}
                        strokeWidth={isActive ? '3.5' : '2.75'}
                        strokeDasharray={
                          conn.type === 'ai' ? '6 7' : conn.type === 'analytics' ? '4 7' : '8 8'
                        }
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        markerEnd={`url(#arrow-${conn.id})`}
                        className={`pointer-events-none flow-line ${isActive ? 'drop-shadow-sm' : ''}`}
                      />

                      <path
                        d={conn.d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="28"
                        className={`cursor-pointer ${
                          isDraggingLegend ? 'pointer-events-none' : 'pointer-events-auto'
                        }`}
                        onPointerEnter={() => setHoveredConnectionId(conn.id)}
                        onPointerLeave={() => setHoveredConnectionId(null)}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedConnectionId(conn.id)
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation()
                          setConnections((current) =>
                            current.filter((item) => item.id !== conn.id),
                          )
                          setSelectedConnectionId(null)
                          setDraftConnection(null)
                          clearSvgLayerPointerBlock()
                        }}
                      />

                      {isActive && !isDraggingLegend && !resizingCard && (
                        <>
                          <circle
                            cx={conn.from.x}
                            cy={conn.from.y}
                            r="6"
                            fill="#fff"
                            stroke={conn.stroke}
                            strokeWidth="2"
                            className="pointer-events-auto cursor-grab transition-transform hover:scale-125 active:cursor-grabbing"
                            onPointerDown={(event) => handleStartEditConnection(event, conn.id, 'from')}
                          />
                          <circle
                            cx={conn.to.x}
                            cy={conn.to.y}
                            r="6"
                            fill="#fff"
                            stroke={conn.stroke}
                            strokeWidth="2"
                            className="pointer-events-auto cursor-grab transition-transform hover:scale-125 active:cursor-grabbing"
                            onPointerDown={(event) => handleStartEditConnection(event, conn.id, 'to')}
                          />
                        </>
                      )}
                    </g>
                  )
                })}

                {draftConnection && (
                  <path
                    d={makeConnectionPath(
                      draftConnection.mode === 'edit' && draftConnection.editingEnd === 'from'
                        ? { x: draftConnection.x, y: draftConnection.y }
                        : { x: draftConnection.startX ?? 0, y: draftConnection.startY ?? 0 },
                      draftConnection.mode === 'edit' && draftConnection.editingEnd === 'from'
                        ? { x: draftConnection.endX ?? 0, y: draftConnection.endY ?? 0 }
                        : { x: draftConnection.x, y: draftConnection.y },
                      draftConnection.mode === 'edit' && draftConnection.editingEnd === 'from'
                        ? 'right'
                        : draftConnection.fromSide || 'right',
                      draftConnection.mode === 'edit' && draftConnection.editingEnd === 'to'
                        ? 'left'
                        : draftConnection.mode === 'edit'
                          ? draftConnection.toSide ?? 'left'
                          : 'left',
                    )}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-draft)"
                    className="pointer-events-none"
                  />
                )}
              </svg>
            </div>
          </main>
        </div>
    </div>
  )
}
