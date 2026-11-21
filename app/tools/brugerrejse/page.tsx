'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { getProjectToolData } from '@/lib/projects'
import {
  availableJourneyPresets,
  CHANNEL_EMOJI_OPTIONS,
  DEFAULT_JOURNEY_DATA,
  getPhaseColor,
  getRowTint,
  JOURNEY_COLOR_PALETTE,
  JOURNEY_PRESET_CATALOG,
  LABEL_COL_WIDTH_DEFAULT_PX,
  LABEL_COL_WIDTH_MAX_PX,
  LABEL_COL_WIDTH_MIN_PX,
  normalizeJourneyFromRaw,
  PHASE_COLORS,
  SENTIMENT_OPTIONS,
  sentimentColor,
  stepsForPhase as stepsForPhaseInData,
  type Channel,
  type JourneyData,
  type JourneyPhase,
  type JourneyPresetId,
  type JourneyRow as JourneyRowDef,
  type JourneyStep,
  type PersonaData,
  type Sentiment,
} from '@/lib/brugerrejse'

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const LABEL_WIDTH_STORAGE_KEY = 'forgelab-brugerrejse-label-width'

const emptyStep = (phaseId: string): JourneyStep => ({
  id: createId(),
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

// ─── Sub-components (defined at module level to avoid re-creation on render) ──

function ColorSwatchPicker({
  value,
  onChange,
  allowNone = false,
  solid = false,
  title = 'Vælg farve',
}: {
  value?: string
  onChange: (color: string | undefined) => void
  allowNone?: boolean
  /** Solid swatches (phases) vs softer preview (rows) */
  solid?: boolean
  title?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const current =
    value != null && value !== ''
      ? JOURNEY_COLOR_PALETTE[((Number(value) % JOURNEY_COLOR_PALETTE.length) + JOURNEY_COLOR_PALETTE.length) % JOURNEY_COLOR_PALETTE.length]
      : null

  const updatePos = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const panelW = 220
    const panelH = 220
    // Prefer opening to the right of the swatch (into the grid), not over the label column
    let left = rect.right + 8
    if (left + panelW > window.innerWidth - 8) {
      left = Math.max(8, rect.left - panelW - 8)
    }
    let top = rect.top
    if (top + panelH > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - panelH - 8)
    }
    setPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    updatePos()
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updatePos()
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updatePos])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={title}
        aria-label={title}
        aria-expanded={open}
        style={current ? { backgroundColor: solid ? current.hex : current.hex } : undefined}
        className={`h-4 w-4 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 ${
          solid
            ? 'border border-white/60 shadow-sm focus:ring-white/50'
            : 'border border-gray-200/80 shadow-sm focus:ring-amber-200'
        } ${
          current
            ? solid
              ? ''
              : 'opacity-80'
            : solid
              ? 'bg-white/20 border-dashed border-white/70'
              : 'bg-transparent border-dashed border-gray-300'
        }`}
      />
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={title}
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
              className="w-[220px] max-h-[min(280px,calc(100vh-16px))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            >
              <p className="px-0.5 pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {title}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {allowNone ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(undefined)
                      setOpen(false)
                    }}
                    title="Ingen farve"
                    aria-label="Ingen farve"
                    className={`h-8 w-8 rounded-full border border-dashed border-gray-300 bg-white transition-transform hover:scale-105 ${
                      current == null ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                    }`}
                  />
                ) : null}
                {JOURNEY_COLOR_PALETTE.map((c, i) => {
                  const key = String(i)
                  const selected = value === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onChange(key)
                        setOpen(false)
                      }}
                      title={`Farve ${i + 1}`}
                      aria-label={`Farve ${i + 1}`}
                      style={{ backgroundColor: c.hex }}
                      className={`h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-105 ${
                        selected ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                      }`}
                    />
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function LabelColResizeHandle({ onResizeStart }: { onResizeStart: (e: React.PointerEvent) => void }) {
  return (
    <button
      type="button"
      aria-label="Træk for at ændre bredde på label-kolonnen"
      title="Træk for at gøre sidebaren bredere eller smallere"
      onPointerDown={onResizeStart}
      className="absolute right-0 top-0 bottom-0 z-20 w-2 -mr-1 cursor-col-resize touch-none group/resize border-0 bg-transparent p-0"
    >
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover/resize:bg-amber-400 group-active/resize:bg-amber-500" />
    </button>
  )
}

function JourneyLabelCell({
  children,
  cls,
  bg = 'bg-white',
  bgStyle,
  labelStyle,
  onResizeStart,
  labelValue,
  onLabelChange,
  onRemove,
  rowId,
  dragOver,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
  extra,
}: {
  children?: React.ReactNode
  cls?: string
  bg?: string
  bgStyle?: React.CSSProperties
  labelStyle?: React.CSSProperties
  onResizeStart?: (e: React.PointerEvent) => void
  labelValue?: string
  onLabelChange?: (value: string) => void
  onRemove?: () => void
  rowId?: string
  dragOver?: boolean
  onRowDragStart?: (rowId: string) => void
  onRowDragOver?: (rowId: string, e: React.DragEvent) => void
  onRowDrop?: (rowId: string) => void
  onRowDragEnd?: () => void
  extra?: React.ReactNode
}) {
  const canDrag = Boolean(rowId && onRowDragStart)
  return (
    <div
      style={bgStyle}
      className={`relative sticky left-0 z-10 ${bgStyle ? '' : bg || 'bg-white'} group/label flex items-center gap-1.5 pl-1.5 pr-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 border-r border-gray-100 ${
        dragOver ? 'ring-2 ring-inset ring-amber-400 bg-amber-50/80' : ''
      } ${cls ?? ''}`}
      onDragOver={
        canDrag
          ? (e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              onRowDragOver?.(rowId!, e)
            }
          : undefined
      }
      onDrop={
        canDrag
          ? (e) => {
              e.preventDefault()
              onRowDrop?.(rowId!)
            }
          : undefined
      }
    >
      {canDrag ? (
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', rowId!)
            onRowDragStart?.(rowId!)
          }}
          onDragEnd={() => onRowDragEnd?.()}
          title="Træk for at ændre rækkefølge"
          aria-label="Træk for at ændre rækkefølge"
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 p-0.5 rounded opacity-0 group-hover/label:opacity-100 focus:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      {onLabelChange && labelValue !== undefined ? (
        <input
          value={labelValue}
          onChange={(e) => onLabelChange(e.target.value)}
          style={labelStyle}
          className="min-w-0 flex-1 bg-transparent text-right text-[10px] font-semibold uppercase tracking-[0.14em] border-b border-transparent hover:border-gray-200 focus:border-amber-400 focus:outline-none py-0.5"
          aria-label="Række-navn"
          suppressHydrationWarning
        />
      ) : (
        <div className="min-w-0 flex-1 text-right" style={labelStyle}>{children}</div>
      )}
      {extra ? <div className="shrink-0 opacity-80 group-hover/label:opacity-100 transition-opacity">{extra}</div> : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title="Fjern række"
          aria-label="Fjern række"
          className="shrink-0 text-gray-300 hover:text-rose-500 p-0.5 rounded opacity-0 group-hover/label:opacity-100 focus:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : null}
      {onResizeStart ? <LabelColResizeHandle onResizeStart={onResizeStart} /> : null}
    </div>
  )
}

function ChannelEmojiPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (emoji: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const panelW = 248
    const panelH = 220
    let left = rect.left
    if (left + panelW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelW - 8)
    }
    let top = rect.bottom + 6
    if (top + panelH > window.innerHeight - 8) {
      top = Math.max(8, rect.top - panelH - 6)
    }
    setPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    updatePos()
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updatePos()
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updatePos])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-lg text-lg leading-none flex items-center justify-center border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-200 ${
          open
            ? 'border-amber-400 ring-2 ring-amber-100 bg-white'
            : 'border-gray-200/80 bg-white/50 hover:border-gray-300 hover:bg-white/80'
        }`}
        title="Vælg emoji"
        aria-label="Vælg kanal-emoji"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden className="select-none">{value || '🔘'}</span>
      </button>
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Vælg emoji til kanal"
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
              className="w-[248px] max-h-[min(260px,calc(100vh-16px))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            >
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Vælg emoji
              </p>
              <div className="grid grid-cols-8 gap-1">
                {CHANNEL_EMOJI_OPTIONS.map((emoji) => {
                  const selected = emoji === value
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onChange(emoji)
                        setOpen(false)
                      }}
                      className={`h-8 w-8 rounded-md text-lg leading-none flex items-center justify-center transition-colors ${
                        selected
                          ? 'bg-amber-100 ring-2 ring-amber-400'
                          : 'hover:bg-gray-100'
                      }`}
                      title={emoji}
                      aria-label={`Vælg ${emoji}`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function stepStateCls(isSelected: boolean, isHovered: boolean) {
  if (isSelected) return 'bg-amber-50/40 ring-1 ring-inset ring-amber-200/60'
  if (isHovered) return 'bg-gray-50/60'
  return ''
}

function JourneyRow({
  label, labelCls, bg, bgStyle, labelStyle, gridCols, cellCls, phases, stepsForPhase, children,
  selectedStepId, hoveredStepId, onSelectStep, onHoverStep, onResizeStart,
  onLabelChange, onRemove,
  rowId, dragOver, onRowDragStart, onRowDragOver, onRowDrop, onRowDragEnd,
  extra,
}: {
  label: string
  labelCls?: string
  bg?: string
  bgStyle?: React.CSSProperties
  labelStyle?: React.CSSProperties
  gridCols: string
  cellCls: string
  phases: JourneyPhase[]
  stepsForPhase: (phaseId: string) => JourneyStep[]
  children: (col: { phase: JourneyPhase; step: JourneyStep; si: number }) => React.ReactNode
  selectedStepId?: string | null
  hoveredStepId?: string | null
  onSelectStep?: (id: string) => void
  onHoverStep?: (id: string | null) => void
  onResizeStart?: (e: React.PointerEvent) => void
  onLabelChange?: (value: string) => void
  onRemove?: () => void
  rowId?: string
  dragOver?: boolean
  onRowDragStart?: (rowId: string) => void
  onRowDragOver?: (rowId: string, e: React.DragEvent) => void
  onRowDrop?: (rowId: string) => void
  onRowDragEnd?: () => void
  extra?: React.ReactNode
}) {
  return (
    <div
      className={`grid border-b border-gray-100 ${bgStyle ? '' : bg ?? ''}`}
      style={{ gridTemplateColumns: gridCols, ...bgStyle }}
    >
      <JourneyLabelCell
        cls={labelCls}
        bg={bg || 'bg-white'}
        bgStyle={bgStyle}
        labelStyle={labelStyle}
        onResizeStart={onResizeStart}
        labelValue={label}
        onLabelChange={onLabelChange}
        onRemove={onRemove}
        rowId={rowId}
        dragOver={dragOver}
        onRowDragStart={onRowDragStart}
        onRowDragOver={onRowDragOver}
        onRowDrop={onRowDrop}
        onRowDragEnd={onRowDragEnd}
        extra={extra}
      />
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

function AddRowMenu({
  missingPresets,
  onAddPreset,
  onAddCustom,
}: {
  missingPresets: typeof JOURNEY_PRESET_CATALOG
  onAddPreset: (preset: JourneyPresetId) => void
  onAddCustom: (kind: 'text' | 'list') => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg border border-dashed border-gray-300 bg-white text-gray-600 font-medium transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]"
      >
        <Plus className="w-3.5 h-3.5" /> Tilføj række
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 bottom-full z-40 mb-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {missingPresets.length > 0 ? (
            <>
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Standard
              </p>
              {missingPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAddPreset(p.id)
                    setOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  {p.label}
                </button>
              ))}
              <div className="my-1 border-t border-gray-100" />
            </>
          ) : null}
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Ny
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAddCustom('text')
              setOpen(false)
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            Tom tekst
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAddCustom('list')
              setOpen(false)
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            Tom liste
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrugerrejsePage() {
  const [data, setData] = useState<JourneyData>(DEFAULT_JOURNEY_DATA)
  const setNormalized = useCallback((raw: unknown) => {
    setData(normalizeJourneyFromRaw(raw))
  }, [])
  useProjectToolData<JourneyData>('brugerrejse', data, setNormalized as (d: JourneyData) => void)

  const [importingPersona, setImportingPersona] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const [labelColWidth, setLabelColWidth] = useState(LABEL_COL_WIDTH_DEFAULT_PX)
  const [backNav, setBackNav] = useState<{ href: string; label: string }>({
    href: '/dashboard',
    label: 'Tilbage til Dashboard',
  })

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LABEL_WIDTH_STORAGE_KEY)
      if (!raw) return
      const n = Number(raw)
      if (Number.isFinite(n) && n >= LABEL_COL_WIDTH_MIN_PX && n <= LABEL_COL_WIDTH_MAX_PX) {
        setLabelColWidth(n)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const onLabelColResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startW = labelColWidth

      const onMove = (ev: PointerEvent) => {
        const next = Math.min(
          LABEL_COL_WIDTH_MAX_PX,
          Math.max(LABEL_COL_WIDTH_MIN_PX, startW + (ev.clientX - startX)),
        )
        setLabelColWidth(next)
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setLabelColWidth((w) => {
          try {
            window.localStorage.setItem(LABEL_WIDTH_STORAGE_KEY, String(w))
          } catch {
            /* ignore */
          }
          return w
        })
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [labelColWidth],
  )

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

  const stepsForPhase = (phaseId: string) => stepsForPhaseInData(data, phaseId)

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

  const updatePhase = (phaseId: string, patch: Partial<Pick<JourneyPhase, 'label' | 'color'>>) =>
    setData((p) => ({
      ...p,
      phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, ...patch } : ph)),
    }))

  const updateRowColor = (rowId: string, color: string | undefined) =>
    setData((p) => ({
      ...p,
      rows: p.rows.map((r) => {
        if (r.id !== rowId) return r
        if (color == null) {
          const { color: _removed, ...rest } = r
          return rest
        }
        return { ...r, color }
      }),
    }))

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
      return { ...p, steps: [...p.steps, emptyStep(phaseId)] }
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

  const updateRowLabel = (rowId: string, label: string) =>
    setData((p) => ({
      ...p,
      rows: p.rows.map((r) => (r.id === rowId ? { ...r, label } : r)),
    }))

  const removeRow = (rowId: string) =>
    setData((p) => ({ ...p, rows: p.rows.filter((r) => r.id !== rowId) }))

  const [draggingRowId, setDraggingRowId] = useState<string | null>(null)
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null)

  const moveRow = (fromId: string, toId: string) => {
    if (fromId === toId) return
    setData((p) => {
      const from = p.rows.findIndex((r) => r.id === fromId)
      const to = p.rows.findIndex((r) => r.id === toId)
      if (from < 0 || to < 0 || from === to) return p
      const next = [...p.rows]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return { ...p, rows: next }
    })
  }

  const onRowDragStart = (rowId: string) => {
    setDraggingRowId(rowId)
    setDragOverRowId(rowId)
  }

  const onRowDragOver = (rowId: string, e: React.DragEvent) => {
    e.preventDefault()
    if (dragOverRowId !== rowId) setDragOverRowId(rowId)
  }

  const onRowDrop = (targetRowId: string) => {
    if (draggingRowId) moveRow(draggingRowId, targetRowId)
    setDraggingRowId(null)
    setDragOverRowId(null)
  }

  const onRowDragEnd = () => {
    setDraggingRowId(null)
    setDragOverRowId(null)
  }

  const addPresetRow = (preset: JourneyPresetId) =>
    setData((p) => {
      if (p.rows.some((r) => r.preset === preset)) return p
      const catalog = JOURNEY_PRESET_CATALOG.find((c) => c.id === preset)
      if (!catalog) return p
      const row: JourneyRowDef = {
        id: `row-${preset}-${createId()}`,
        preset,
        label: catalog.label,
        kind: 'preset',
        ...(catalog.defaultColor != null ? { color: catalog.defaultColor } : {}),
      }
      return { ...p, rows: [...p.rows, row] }
    })

  const addCustomRow = (kind: 'text' | 'list') =>
    setData((p) => ({
      ...p,
      rows: [
        ...p.rows,
        {
          id: createId(),
          label: kind === 'list' ? 'Ny liste' : 'Ny række',
          kind,
        },
      ],
    }))

  const updateCustomField = (stepId: string, rowId: string, value: string | string[]) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        return {
          ...s,
          customFields: { ...(s.customFields ?? {}), [rowId]: value },
        }
      }),
    }))

  const updateCustomListItem = (stepId: string, rowId: string, idx: number, value: string) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const prev = s.customFields?.[rowId]
        const arr = Array.isArray(prev) ? [...prev] : []
        arr[idx] = value
        return { ...s, customFields: { ...(s.customFields ?? {}), [rowId]: arr } }
      }),
    }))

  const addCustomListItem = (stepId: string, rowId: string) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const prev = s.customFields?.[rowId]
        const arr = Array.isArray(prev) ? [...prev, ''] : ['']
        return { ...s, customFields: { ...(s.customFields ?? {}), [rowId]: arr } }
      }),
    }))

  const removeCustomListItem = (stepId: string, rowId: string, idx: number) =>
    setData((p) => ({
      ...p,
      steps: p.steps.map((s) => {
        if (s.id !== stepId) return s
        const prev = s.customFields?.[rowId]
        const arr = Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []
        return { ...s, customFields: { ...(s.customFields ?? {}), [rowId]: arr } }
      }),
    }))

  const missingPresets = useMemo(() => availableJourneyPresets(data.rows), [data.rows])

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

            // CSS grid: resizable label-kolonne + minmax-cols pr. trin (vandret scroll ved mange trin).
            const stepColUnit = 'minmax(200px, 1fr)'
            const stepCols = data.phases.flatMap(ph => {
              const n = stepsForPhase(ph.id).length
              return n === 0 ? [stepColUnit] : Array(n).fill(stepColUnit)
            })
            const gridCols = `${labelColWidth}px ${stepCols.join(' ')}`

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
              onResizeStart: onLabelColResizeStart,
            }

            return (
          <div className="overflow-x-auto scroll-smooth bg-white">

              {/* ── Phase header row ── */}
              <div className="grid border-b border-gray-100 sticky top-0 z-20 bg-white" style={{ gridTemplateColumns: gridCols }}>
                <div className="relative sticky left-0 z-10 bg-white border-r border-gray-100">
                  <LabelColResizeHandle onResizeStart={onLabelColResizeStart} />
                </div>
                {data.phases.map((phase) => {
                  const c = getPhaseColor(phase)
                  const n = Math.max(1, stepsForPhase(phase.id).length)
                  return (
                    <div key={phase.id} className="border-l border-black/5 first:border-l-0" style={{ gridColumn: `span ${n}` }}>
                      <div
                        style={{ backgroundColor: c.hex }}
                        className="px-4 py-3.5 flex items-center gap-2 shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]"
                      >
                        <input
                          value={phase.label}
                          onChange={(e) => updatePhase(phase.id, { label: e.target.value })}
                          className="flex-1 min-w-0 bg-transparent text-white text-[13px] font-bold tracking-wide placeholder:text-white/60 focus:outline-none border-b border-white/0 focus:border-white/70 hover:border-white/40 cursor-text transition-colors"
                          placeholder="Fasenavn"
                          title="Klik for at omdøbe fase"
                          suppressHydrationWarning
                        />
                        <ColorSwatchPicker
                          solid
                          value={phase.color}
                          onChange={(color) => {
                            if (color != null) updatePhase(phase.id, { color })
                          }}
                          title="Fasefarve"
                        />
                        <button type="button" onClick={() => addStep(phase.id)} title="Tilføj trin"
                          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-black/15 text-white transition-all hover:bg-black/25 active:scale-95">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {data.phases.length > 1 && (
                          <button type="button" onClick={() => removePhase(phase.id)} title="Fjern fase"
                            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-black/15 text-white/90 transition-all hover:bg-rose-700/90 hover:text-white active:scale-95">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {data.rows.map((row) => {
                const rowKey = row.id
                const tint = getRowTint(row.color)
                const tintBgStyle = tint.solidBackgroundColor
                  ? ({ backgroundColor: tint.solidBackgroundColor } as React.CSSProperties)
                  : undefined
                const tintLabelStyle = tint.color
                  ? ({ color: tint.color } as React.CSSProperties)
                  : undefined
                const labelHandlers = {
                  label: row.label,
                  onLabelChange: (v: string) => updateRowLabel(row.id, v),
                  onRemove: () => removeRow(row.id),
                  onResizeStart: onLabelColResizeStart,
                  rowId: row.id,
                  dragOver: dragOverRowId === row.id && draggingRowId !== row.id,
                  onRowDragStart,
                  onRowDragOver,
                  onRowDrop,
                  onRowDragEnd,
                  bgStyle: tintBgStyle,
                  labelStyle: tintLabelStyle,
                  extra: (
                    <ColorSwatchPicker
                      allowNone
                      value={row.color}
                      onChange={(color) => updateRowColor(row.id, color)}
                      title="Rækkefarve"
                    />
                  ),
                }

                if (row.kind === 'text') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
                      {({ step }) => {
                        const val = typeof step.customFields?.[row.id] === 'string' ? (step.customFields[row.id] as string) : ''
                        const empty = !val.trim()
                        return (
                          <div className="py-2">
                            <textarea
                              value={val}
                              onChange={(e) => updateCustomField(step.id, row.id, e.target.value)}
                              placeholder="Skriv her..."
                              rows={2}
                              className={`w-full text-xs text-gray-700 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white focus:border-amber-200 placeholder:text-gray-300 transition-colors border ${empty ? 'bg-transparent border-transparent hover:border-gray-200' : 'bg-white border-gray-200'}`}
                              suppressHydrationWarning
                            />
                          </div>
                        )
                      }}
                    </JourneyRow>
                  )
                }

                if (row.kind === 'list') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
                      {({ step }) => {
                        const items = Array.isArray(step.customFields?.[row.id])
                          ? (step.customFields![row.id] as string[])
                          : []
                        if (items.length === 0) {
                          return (
                            <div className="py-2">
                              <button
                                type="button"
                                onClick={() => addCustomListItem(step.id, row.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 font-medium px-2 py-1 rounded-md border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Tilføj punkt
                              </button>
                            </div>
                          )
                        }
                        return (
                          <div className="py-2 space-y-1.5">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-gray-400 text-xs shrink-0 leading-none">•</span>
                                <input
                                  value={item}
                                  onChange={(e) => updateCustomListItem(step.id, row.id, idx, e.target.value)}
                                  placeholder="Punkt..."
                                  className="flex-1 min-w-0 text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                                  suppressHydrationWarning
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomListItem(step.id, row.id, idx)}
                                  title="Fjern"
                                  className="text-gray-300 hover:text-rose-500 shrink-0 p-0.5 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addCustomListItem(step.id, row.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-800 font-medium transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" /> Tilføj
                            </button>
                          </div>
                        )
                      }}
                    </JourneyRow>
                  )
                }

                const preset = row.preset!

                if (preset === 'touchpoint') {
                  return (
                    <div key={rowKey} className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols, ...tintBgStyle }}>
                      <JourneyLabelCell
                        bgStyle={tintBgStyle}
                        labelStyle={tintLabelStyle}
                        labelValue={row.label}
                        onLabelChange={(v) => updateRowLabel(row.id, v)}
                        onRemove={() => removeRow(row.id)}
                        onResizeStart={onLabelColResizeStart}
                        rowId={row.id}
                        dragOver={dragOverRowId === row.id && draggingRowId !== row.id}
                        onRowDragStart={onRowDragStart}
                        onRowDragOver={onRowDragOver}
                        onRowDrop={onRowDrop}
                        onRowDragEnd={onRowDragEnd}
                        extra={labelHandlers.extra}
                      />
                      {data.phases.flatMap((phase) => {
                        const steps = stepsForPhase(phase.id)
                        const c = getPhaseColor(phase)
                        if (steps.length === 0) return [(
                          <div key={phase.id} className={cellCls + ' py-3 flex items-center justify-center'}>
                            <button
                              type="button"
                              onClick={() => addStep(phase.id)}
                              style={{
                                color: c.label,
                                backgroundColor: c.light,
                                borderColor: c.border,
                              }}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-dashed font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
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
                                  style={{ backgroundColor: c.hex }}
                                  className="inline-flex w-[18px] h-[18px] rounded-full text-white text-[10px] font-semibold items-center justify-center shrink-0 ring-1 ring-white shadow-sm hover:scale-110 transition-transform"
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
                  )
                }

                if (preset === 'channels') {
                  // Same solid soft blend as other rows (JourneyRow) — applied per grid row, no stacking
                  return (
                    <div key={rowKey}>
                      <div
                        className="grid border-b border-gray-100"
                        style={{ gridTemplateColumns: gridCols, ...tintBgStyle }}
                      >
                        <JourneyLabelCell
                          bgStyle={tintBgStyle}
                          labelStyle={tintLabelStyle}
                          labelValue={row.label}
                          onLabelChange={(v) => updateRowLabel(row.id, v)}
                          onRemove={() => removeRow(row.id)}
                          onResizeStart={onLabelColResizeStart}
                          rowId={row.id}
                          dragOver={dragOverRowId === row.id && draggingRowId !== row.id}
                          onRowDragStart={onRowDragStart}
                          onRowDragOver={onRowDragOver}
                          onRowDrop={onRowDrop}
                          onRowDragEnd={onRowDragEnd}
                          extra={labelHandlers.extra}
                        />
                        <div
                          className="border-l border-gray-100 flex items-center justify-end px-3 py-2"
                          style={{ gridColumn: `span ${stepCols.length}` }}
                        >
                          <button
                            type="button"
                            onClick={addChannel}
                            className="text-[11px] text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-gray-300/80 bg-transparent transition-colors hover:border-gray-400 hover:bg-white/50"
                          >
                            <Plus className="w-3 h-3" /> Tilføj kanal
                          </button>
                        </div>
                      </div>
                      {data.channels.map((channel, channelIdx) => {
                        const isFirst = channelIdx === 0
                        const isLast = channelIdx === data.channels.length - 1
                        return (
                          <div
                            key={channel.id}
                            className="grid border-b border-gray-100"
                            style={{ gridTemplateColumns: gridCols, ...tintBgStyle }}
                          >
                            <div
                              style={tintBgStyle}
                              className="relative sticky left-0 z-10 flex items-center gap-1.5 pl-2 pr-2.5 py-2 border-r border-gray-100 group hover:brightness-[0.99] transition-[filter] overflow-visible"
                            >
                              <ChannelEmojiPicker
                                value={channel.icon}
                                onChange={(icon) => updateChannel(channel.id, { icon })}
                              />
                              <input
                                value={channel.name}
                                onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                                placeholder="Kanal"
                                className="flex-1 min-w-0 text-[12px] font-medium text-gray-700 bg-transparent border-b border-transparent placeholder:text-gray-400 placeholder:font-normal transition-colors hover:border-gray-200 focus:border-amber-400 focus:outline-none py-0.5"
                                aria-label="Kanal-navn"
                                title={channel.name || 'Kanal-navn'}
                                suppressHydrationWarning
                              />
                              <div className="flex items-center gap-px shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => moveChannel(channel.id, -1)}
                                  disabled={isFirst}
                                  className="text-gray-400 hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-black/5 transition-colors"
                                  title="Flyt op"
                                  aria-label="Flyt kanal op"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveChannel(channel.id, 1)}
                                  disabled={isLast}
                                  className="text-gray-400 hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed p-1 rounded hover:bg-black/5 transition-colors"
                                  title="Flyt ned"
                                  aria-label="Flyt kanal ned"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeChannel(channel.id)}
                                  className="text-gray-400 hover:text-rose-500 p-1 rounded hover:bg-black/5 transition-colors"
                                  title="Slet kanal"
                                  aria-label="Slet kanal"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <LabelColResizeHandle onResizeStart={onLabelColResizeStart} />
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
                                        : 'hover:bg-black/[0.02] hover:ring-1 hover:ring-inset hover:ring-gray-200/70'
                                    }`}
                                  >
                                    {active ? (
                                      <span className="text-lg leading-none select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.06)] transition-transform group-hover/cell:scale-110">{channel.icon}</span>
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400/45 opacity-45 transition-all group-hover/cell:opacity-100 group-hover/cell:bg-gray-500 group-hover/cell:scale-125" />
                                    )}
                                  </button>
                                )
                              })
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                if (preset === 'curve') {
                  if (allSteps.length === 0) return null
                  const H = 100
                  const n = allSteps.length
                  const pts = allSteps.map((s, i) => ({
                    x: ((i + 0.5) / n) * 100,
                    y: 10 + ((2 - s.sentiment) / 4) * 80,
                    sentiment: s.sentiment,
                  }))
                  const scaledPts = pts.map(p => ({ ...p, x: p.x * 10 }))
                  return (
                    <div
                      key={rowKey}
                      className={`grid border-b border-gray-100 ${tintBgStyle ? '' : 'bg-gradient-to-b from-gray-50/40 via-white to-gray-50/30'}`}
                      style={{ gridTemplateColumns: gridCols, ...tintBgStyle }}
                    >
                      <JourneyLabelCell
                        bg={tintBgStyle ? undefined : 'bg-white/70'}
                        bgStyle={tintBgStyle}
                        labelStyle={tintLabelStyle}
                        labelValue={row.label}
                        onLabelChange={(v) => updateRowLabel(row.id, v)}
                        onRemove={() => removeRow(row.id)}
                        onResizeStart={onLabelColResizeStart}
                        rowId={row.id}
                        dragOver={dragOverRowId === row.id && draggingRowId !== row.id}
                        onRowDragStart={onRowDragStart}
                        onRowDragOver={onRowDragOver}
                        onRowDrop={onRowDrop}
                        onRowDragEnd={onRowDragEnd}
                        extra={labelHandlers.extra}
                      />
                      <div className="border-l border-gray-100 py-5" style={{ gridColumn: `span ${stepCols.length}` }}>
                        <svg viewBox="0 0 1000 100" preserveAspectRatio="none"
                          style={{ width: '100%', height: 88, display: 'block' }}>
                          <defs>
                            {scaledPts.map((p, i) => {
                              if (i === 0) return null
                              const prev = scaledPts[i - 1]
                              return (
                                <linearGradient key={i} id={`seg-${row.id}-${i}`}
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
                                stroke={`url(#seg-${row.id}-${i})`}
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
                }

                if (preset === 'actions') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
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
                  )
                }

                if (preset === 'thoughts') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
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
                  )
                }

                if (preset === 'emotion') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
                      {({ step }) => (
                        <div className="py-3 flex items-center justify-center gap-2 flex-nowrap">
                          {SENTIMENT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              title={opt.label}
                              aria-label={opt.label}
                              aria-pressed={step.sentiment === opt.value}
                              onClick={() => updateStep(step.id, { sentiment: opt.value })}
                              className={`h-10 w-10 shrink-0 text-2xl leading-none rounded-xl flex items-center justify-center transition-all ${
                                step.sentiment === opt.value
                                  ? 'bg-white shadow-sm scale-105 ring-2 ring-amber-400'
                                  : 'opacity-55 hover:opacity-100 hover:scale-105 hover:bg-white/80'
                              }`}
                            >
                              {opt.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </JourneyRow>
                  )
                }

                if (preset === 'pains') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
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
                  )
                }

                if (preset === 'gains') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
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
                  )
                }

                if (preset === 'insight') {
                  return (
                    <JourneyRow key={rowKey} {...rowProps} {...labelHandlers}>
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
                  )
                }

                return null
              })}

              <div className="px-1 py-3 border-t border-gray-100 bg-white">
                <AddRowMenu
                  missingPresets={missingPresets}
                  onAddPreset={addPresetRow}
                  onAddCustom={addCustomRow}
                />
              </div>

            </div>
            )
          })()}
        </section>

        </div>
      </div>
    </div>
  )
}
