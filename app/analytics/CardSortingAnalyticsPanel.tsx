'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  Download,
  Filter,
  HelpCircle,
  Layers,
  LayoutList,
  MapPin,
  MessageSquare,
  Monitor,
  MoreVertical,
  RefreshCw,
  Share2,
  UserRound,
  X,
} from 'lucide-react'
import {
  aggregateCardsAnalysisByCard,
  aggregateCategoriesAnalysisByCategory,
  aggregateSimilarityMatrix,
  aggregateStandardizationGrid,
  formatDurationShort,
  formatSecondsWithDecimalMinutes,
  STANDARDIZATION_GRID_NOT_PLACED_LABEL,
  type CardSortResponseRecord,
  type SimilarityMatrixResult,
} from '@/lib/card-sorting-analytics'
import {
  DEMO_CARD_SORT_PROJECT_ID,
  getDemoCardSortApiPayload,
  mergeProjectWithResponseDemo,
} from '@/lib/card-sorting-demo'

type DurationStats = {
  min: number
  q1: number
  median: number
  q3: number
  max: number
} | null

type ResponseSummary = {
  totalResponses?: number
  completed: number
  abandoned: number
  lastRespondentAt: string | null
  boardUniqueCategories: number
  avgCategoriesPerResponse: number | null
  maxCategoriesPerResponse: number | null
  durationStats: DurationStats
  locations: { label: string; count: number; pct: number }[]
}

type CardSortProjectRow = {
  projectId: string
  projectName: string
  updatedAt: string
  createdAt: string | null
  launchedAt: string | null
  mode: string
  cardCount: number
  categoryCount: number
  boardUniqueCategories: number
  cardsPlacedInCategories: number
  unassignedCards: number
  responses: CardSortResponseRecord[]
  responseSummary: ResponseSummary
  categoryBreakdown: { name: string; count: number }[]
  boardCards?: { id: string; text: string }[]
}

type ApiPayload = {
  projects: CardSortProjectRow[]
  summary: { projectCount: number; totalCards: number; totalCategories: number }
}

const DETAIL_TABS = [
  { id: 'overview' as const, label: 'Overblik' },
  { id: 'respondents' as const, label: 'Respondenter' },
  { id: 'analysis' as const, label: 'Analyse' },
  { id: 'export' as const, label: 'Eksport' },
  { id: 'sharing' as const, label: 'Deling' },
]

const CSP_PARAM = 'csp'
type SharingMode = 'none' | 'secret' | 'password'

function makeShareToken(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Som reference: "April 13, 2026" */
function formatEnLongDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '–'
  }
}

/** Fx Apr 13, 2026, 8:34 PM */
function formatEnDateTime(iso: string | null | undefined): string {
  if (!iso) return '–'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '–'
  }
}

function respondentDisplayMetrics(
  r: CardSortResponseRecord,
  board: { cardCount: number; mode: string }
): { cardsSortedPct: number; categoriesCreated: number; categoriesNamedPct: number } {
  const completed = Boolean(!r.abandoned && r.completedAt)
  const snap = r.sortSnapshot
  if (snap?.categories?.length) {
    const withCards = snap.categories.filter((c) => (c.cards?.length ?? 0) > 0)
    const named = withCards.filter((c) => String(c.name ?? '').trim().length > 0)
    const categoriesCreated = withCards.length
    const categoriesNamedPct =
      categoriesCreated > 0 ? Math.round((named.length / categoriesCreated) * 1000) / 10 : 0
    const placed = withCards.reduce((sum, c) => sum + (c.cards?.length ?? 0), 0)
    const totalBoard = Math.max(board.cardCount, 1)
    const cardsSortedPct = completed ? Math.min(100, Math.round(((placed / totalBoard) * 1000)) / 10) : 0
    return { cardsSortedPct, categoriesCreated, categoriesNamedPct }
  }
  const cardsSortedPct = completed && board.cardCount > 0 ? 100.0 : 0
  const categoriesCreated = typeof r.categoryCount === 'number' ? r.categoryCount : 0
  const mode = (board.mode || 'open').toLowerCase()
  const categoriesNamedPct =
    mode === 'closed' && categoriesCreated > 0 ? 100.0 : mode === 'hybrid' && categoriesCreated > 0 ? 50.0 : 0.0
  return { cardsSortedPct, categoriesCreated, categoriesNamedPct }
}

function formatDeviceLine(s: CardSortResponseRecord['session']): string {
  if (!s?.device) return '–'
  const { type, vendor, model } = s.device
  return [type, vendor, model].filter(Boolean).join(', ') || '–'
}

function formatOsLine(s: CardSortResponseRecord['session']): string {
  if (!s?.os) return '–'
  const { name, version, codename } = s.os
  const parts = [name, version, codename].filter((x) => x && String(x).trim())
  return parts.length ? parts.join(', ') : '–'
}

function formatBrowserLine(s: CardSortResponseRecord['session']): string {
  if (!s?.browser) return '–'
  const { name, version } = s.browser
  return [name, version].filter(Boolean).join(', ') || '–'
}

function formatScreenLine(s: CardSortResponseRecord['session']): string {
  const w = s?.screen?.width
  const h = s?.screen?.height
  if (typeof w === 'number' && typeof h === 'number') return `${w}x${h}px`
  return '–'
}

function formatLocationLine(s: CardSortResponseRecord['session']): string {
  const l = s?.locationDetail
  if (!l) {
    return '–'
  }
  const parts = [l.city, l.region, l.country].filter((x) => x && String(x).trim())
  return parts.length ? parts.join(', ') : '–'
}

type RespondentDetailModalProps = {
  open: boolean
  onClose: () => void
  r: CardSortResponseRecord
  title: string
  board: { cardCount: number; mode: string }
  includeInAnalysis: boolean
  onToggleInclude: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  canDelete: boolean
  projectId: string
  onDeleted: () => void
}

function RespondentDetailModal({
  open,
  onClose,
  r,
  title,
  board,
  includeInAnalysis,
  onToggleInclude,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  canDelete,
  projectId,
  onDeleted,
}: RespondentDetailModalProps) {
  const [tab, setTab] = useState<'details' | 'cardSort' | 'comments'>('details')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab('details')
  }, [open, r.id])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const completed = Boolean(!r.abandoned && r.completedAt)
  const m = respondentDisplayMetrics(r, board)
  const snap = r.sortSnapshot
  const s = r.session

  const deleteRespondent = async () => {
    if (!canDelete || !confirm('Vil du slette denne respondent permanent?')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/analytics/card-sorting/response', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, responseId: r.id }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(typeof j.error === 'string' ? j.error : 'Kunne ikke slette')
        return
      }
      onClose()
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const detailRows: { label: string; value: string }[] = [
    { label: 'ID', value: title },
    { label: 'Startet', value: formatEnDateTime(r.startedAt) },
    { label: 'Status', value: completed ? 'Fuldført' : 'Afbrudt' },
    {
      label: 'Tidsforbrug',
      value: typeof r.durationSec === 'number' ? formatDurationShort(r.durationSec) : '–',
    },
    { label: 'Kort sorteret', value: `${m.cardsSortedPct.toFixed(1)} %` },
    { label: 'Kategorier oprettet', value: String(m.categoriesCreated) },
    { label: 'Kategorier navngivet', value: `${m.categoriesNamedPct.toFixed(1)}%` },
    { label: 'Instruktioner set', value: `${s?.instructionsSeen ?? 0} gange` },
    { label: 'Antal kommentarer', value: String(s?.commentCount ?? 0) },
    { label: 'Enhed', value: formatDeviceLine(s) },
    { label: 'Operativsystem', value: formatOsLine(s) },
    { label: 'Browser', value: formatBrowserLine(s) },
    { label: 'Skærmopløsning', value: formatScreenLine(s) },
    { label: 'Lokation (by, region, land)', value: formatLocationLine(s) },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Luk overlay"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Forrige respondent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 text-center text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Næste respondent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="shrink-0 border-b border-slate-100 px-4 sm:px-5">
          <nav className="flex gap-1">
            {(
              [
                { id: 'details' as const, label: 'Detaljer', Icon: LayoutList },
                { id: 'cardSort' as const, label: 'Kortsortering', Icon: Layers },
                { id: 'comments' as const, label: 'Kommentarer', Icon: MessageSquare },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4 opacity-80" aria-hidden />
                {label}
                {tab === id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-amber-500" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {tab === 'details' && (
            <dl className="space-y-3 text-sm">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-0.5 border-b border-slate-50 pb-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <dt className="flex shrink-0 items-center gap-2 text-slate-500">
                    {row.label === 'Enhed' && <Monitor className="h-4 w-4 text-slate-400" aria-hidden />}
                    {row.label}
                  </dt>
                  <dd className="text-right font-medium text-slate-900 sm:max-w-[60%]">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === 'cardSort' && (
            <div className="space-y-4">
              {!snap?.categories?.length ? (
                <p className="text-sm text-slate-500">
                  Ingen kortsorterings-snapshot for denne session endnu.
                </p>
              ) : (
                snap.categories.map((cat) => (
                  <div
                    key={cat.id ?? cat.name}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <h4 className="mb-2 font-semibold text-slate-900">{cat.name || 'Kategori uden navn'}</h4>
                    {(cat.cards?.length ?? 0) === 0 ? (
                      <p className="text-xs text-slate-500">Ingen kort i denne kategori.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {cat.cards.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-lg border border-white bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                          >
                            {c.text || '(tom)'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'comments' && (
            <p className="text-sm text-slate-500">Der er ingen gemte kommentarer for denne respondent endnu.</p>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={deleteRespondent}
            disabled={!canDelete || deleting}
            className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? 'Sletter…' : 'Slet respondent'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Medtag i analyse</span>
            <button
              type="button"
              role="switch"
              aria-checked={includeInAnalysis}
              onClick={onToggleInclude}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                includeInAnalysis ? 'bg-amber-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  includeInAnalysis ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Luk
          </button>
        </footer>
      </div>
    </div>
  )
}

const ANALYSIS_MENU = [
  {
    id: 'cards' as const,
    title: 'Kort',
    description: 'Hvordan kortene blev kategoriseret af dine respondenter.',
  },
  {
    id: 'categories' as const,
    title: 'Kategorier',
    description: 'Kategorier som dine respondenter oprettede, og hvilke kort de sorterede i hver kategori.',
  },
  {
    id: 'standardization' as const,
    title: 'Standardiseringsgitter',
    description: 'Fordeling af kort på de definerede standardiserede kategorier.',
  },
  {
    id: 'similarity' as const,
    title: 'Similaritetsmatrix',
    description: 'Andelen af respondenter der placerede to kort i samme kategori.',
  },
  {
    id: 'dendrogram' as const,
    title: 'Dendrogram',
    description: 'Viser hvilke kortgrupperinger der har stærkest enighed.',
  },
  {
    id: 'respondent-centric' as const,
    title: 'Respondentcentreret analyse',
    description: 'Find hvilke svar der blev mest understøttet af andre respondenters svar.',
  },
  {
    id: 'comments' as const,
    title: 'Kommentarer',
    description: 'Kommentarer efterladt af respondenter under undersøgelsen.',
  },
]

type AnalysisMenuId = (typeof ANALYSIS_MENU)[number]['id']

const EMPTY_BOARD_CARDS: { id: string; text: string }[] = []

function CardSortingCardsAnalysisView({ selected }: { selected: CardSortProjectRow }) {
  const boardCards = selected.boardCards ?? EMPTY_BOARD_CARDS
  const baseRows = useMemo(
    () => aggregateCardsAnalysisByCard(selected.responses, boardCards),
    [selected.responses, boardCards]
  )
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [catCountSortDesc, setCatCountSortDesc] = useState(true)

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? baseRows.filter((row) => row.cardLabel.toLowerCase().includes(q)) : baseRows
    return [...filtered].sort((a, b) => {
      const d = a.uniqueCategoryCount - b.uniqueCategoryCount
      return catCountSortDesc ? -d : d
    })
  }, [baseRows, search, catCountSortDesc])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const snapshots = selected.responses.filter(
    (r) => !r.abandoned && r.completedAt && r.sortSnapshot?.categories?.length
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Kort</h3>
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(new Set())
              setSearch('')
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Genberegn analyse
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Flere muligheder"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Hjælp"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
            defaultValue="csv"
            aria-label="Eksport"
          >
            <option value="csv">Eksport</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200/80 bg-transparent">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="card-analysis-search">
            Søg i kortnavne
          </label>
          <input
            id="card-analysis-search"
            type="search"
            placeholder="Søg i kortnavne"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {baseRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Ingen kort på boardet endnu. Tilføj kort i kortsorteringsværktøjet for at se analysen.
          </p>
        ) : filteredSorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Ingen kort matcher din søgning.</p>
        ) : (
          <>
            {snapshots === 0 && (
              <p className="border-b border-amber-100 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-950">
                Ingen fuldførte sessioner med sorterings-snapshot endnu. Kategoriantal forbliver 0 indtil
                respondenterne afslutter kortsorteringen.
              </p>
            )}
            <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-left font-semibold">Kortnavn</th>
                <th className="px-4 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => setCatCountSortDesc((d) => !d)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                  >
                    Kategorier
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </button>
                </th>
              </tr>
            </thead>
            {filteredSorted.map((row) => {
              const isOpen = expanded.has(row.cardId)
              return (
                <tbody key={row.cardId} className="border-b border-slate-100 last:border-0">
                  <tr className="bg-white align-top">
                    <td className="px-0 py-3">
                      <div
                        className={`min-w-0 pl-4 ${isOpen ? 'border-l-4 border-teal-500 pl-3' : 'border-l-4 border-transparent pl-3'}`}
                      >
                        <div className="font-semibold text-slate-900">{row.cardLabel}</div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.cardId)}
                          className="mt-1 text-left text-sm font-semibold text-amber-600 hover:text-amber-800"
                        >
                          {isOpen ? '— SKJUL KATEGORIER' : '+ VIS KATEGORIER'}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {row.uniqueCategoryCount}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={2} className="bg-transparent px-4 pb-4 pt-0">
                        {row.byCategory.length === 0 ? (
                          <p className="py-3 text-sm text-slate-500">Dette kort blev ikke placeret i nogen kategori.</p>
                        ) : (
                          <table className="mt-2 w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="py-2 pr-4 font-semibold">Kategorinavn</th>
                                <th className="py-2 pr-4 font-semibold">
                                  <span className="inline-flex items-center gap-1">
                                    Freq.
                                    <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                                  </span>
                                </th>
                                <th className="py-2 font-semibold">Avg. pos.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.byCategory.map((c) => (
                                <tr key={c.categoryName} className="border-b border-slate-100 last:border-0">
                                  <td className="py-2.5 pr-4 font-medium text-slate-800">{c.categoryName}</td>
                                  <td className="py-2.5 pr-4 font-semibold text-amber-600">{c.frequency}</td>
                                  <td className="py-2.5 text-slate-700">
                                    {Number.isInteger(c.avgPosition)
                                      ? `${c.avgPosition}.0`
                                      : c.avgPosition.toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </table>
          </>
        )}
      </div>
    </div>
  )
}

function CardSortingCategoriesAnalysisView({ selected }: { selected: CardSortProjectRow }) {
  const boardCards = selected.boardCards ?? EMPTY_BOARD_CARDS
  const baseRows = useMemo(
    () => aggregateCategoriesAnalysisByCategory(selected.responses, boardCards),
    [selected.responses, boardCards]
  )
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [uniqueSortDesc, setUniqueSortDesc] = useState(true)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? baseRows.filter((row) => row.categoryName.toLowerCase().includes(q)) : baseRows
    return [...filtered].sort((a, b) => {
      const d = a.uniqueCardCount - b.uniqueCardCount
      return uniqueSortDesc ? -d : d
    })
  }, [baseRows, search, uniqueSortDesc])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize, baseRows.length])

  const totalFiltered = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize) || 1)
  const safePage = Math.min(page, totalPages)
  const from = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, totalFiltered)
  const pageSlice = filteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Kategorier</h3>
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(new Set())
              setSearch('')
              setSelectedKeys(new Set())
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Genberegn analyse
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Flere muligheder"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Hjælp"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 print:hidden"
          >
            PDF-eksport
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-slate-200/80 px-1 py-3 text-sm">
        <span className="text-slate-600">Standardization preset</span>
        <select
          disabled
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
          aria-label="Standardization preset"
          defaultValue=""
        >
          <option value="">Vælg en gemt skabelon</option>
        </select>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-400"
        >
          Gem som
        </button>
      </div>

      <div className="overflow-hidden border border-slate-200/80 bg-transparent">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Selected categories:</span> {selectedKeys.size}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"
            >
              Standardiser
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"
            >
              Fjern standardisering
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="category-analysis-search">
            Søg i kategorier
          </label>
          <input
            id="category-analysis-search"
            type="search"
            placeholder="Søg i kategorier"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            disabled
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400"
          >
            Fuld skærm
          </button>
        </div>

        {baseRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Ingen kategorier findes i fuldførte sorterings-snapshots endnu. Når respondenterne afslutter
            sorteringen, vises kategorier og deres kort her.
          </p>
        ) : filteredSorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Ingen kategorier matcher din søgning.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-3 py-3" aria-label="Select" />
                    <th className="px-2 py-3 text-left font-semibold">Kategorinavn</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      <button
                        type="button"
                        onClick={() => setUniqueSortDesc((d) => !d)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                      >
                        Unique cards
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold">Agreement</th>
                    <th className="px-4 py-3 text-right font-semibold">Respondenter</th>
                  </tr>
                </thead>
                {pageSlice.map((row) => {
                  const isOpen = expanded.has(row.categoryKey)
                  const barGreen = row.agreementPct >= 80
                  return (
                    <tbody key={row.categoryKey} className="border-b border-slate-100 last:border-0">
                      <tr className="bg-white align-top">
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(row.categoryKey)}
                            onChange={() => toggleSelect(row.categoryKey)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div
                            className={`min-w-0 ${isOpen ? 'border-l-4 border-teal-500 pl-3' : 'border-l-4 border-transparent pl-3'}`}
                          >
                            <div className="font-semibold text-slate-900">{row.categoryName}</div>
                            <button
                              type="button"
                              onClick={() => toggleExpand(row.categoryKey)}
                              className="mt-1 text-left text-sm font-semibold text-amber-600 hover:text-amber-800"
                            >
                              {isOpen ? '— SKJUL KORT' : '+ VIS KORT'}
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-slate-900">
                          {row.uniqueCardCount}
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[140px]">
                            <div className="text-sm font-medium text-slate-800">
                              {row.agreementPct.toFixed(1)}%
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${barGreen ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, row.agreementPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                          {row.respondentCount}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={5} className="bg-transparent px-4 pb-4 pt-0">
                            {row.cards.length === 0 ? (
                              <p className="py-3 text-sm text-slate-500">Ingen kort i denne kategori.</p>
                            ) : (
                              <table className="mt-2 w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="py-2 pr-4 font-semibold">Kortnavn</th>
                                    <th className="py-2 pr-4 text-right font-semibold">
                                      <span className="inline-flex items-center justify-end gap-1">
                                        Freq.
                                        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                                      </span>
                                    </th>
                                    <th className="py-2 text-right font-semibold">Avg. pos.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.cards.map((c) => (
                                    <tr key={c.cardId} className="border-b border-slate-100 last:border-0">
                                      <td className="py-2.5 pr-4 font-medium text-slate-800">{c.cardLabel}</td>
                                      <td className="py-2.5 pr-4 text-right font-semibold text-amber-600">
                                        {c.frequency}
                                      </td>
                                      <td className="py-2.5 text-right text-slate-700">
                                        {Number.isInteger(c.avgPosition)
                                          ? `${c.avgPosition}.0`
                                          : c.avgPosition.toFixed(1)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )
                })}
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Rækker pr. visning
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {totalFiltered === 0 ? '0' : `${from}–${to}`} of {totalFiltered}
                </span>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
                  aria-label="Forrige side"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
                  aria-label="Næste side"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function heatmapCellStyle(
  count: number,
  maxRef: number
): { backgroundColor: string; color: string } {
  if (maxRef <= 0 || count <= 0) {
    return { backgroundColor: '#ffffff', color: '#0f172a' }
  }
  const t = Math.min(1, count / maxRef)
  const r = Math.round(255 + (59 - 255) * t)
  const g = Math.round(255 + (130 - 255) * t)
  const b = Math.round(255 + (246 - 255) * t)
  return {
    backgroundColor: `rgb(${r},${g},${b})`,
    color: t > 0.55 ? '#ffffff' : '#0f172a',
  }
}

/** Heatmap for 0–100% similarity cells (same blue scale as standardization legend). */
function similarityPercentCellStyle(pct: number): { backgroundColor: string; color: string } {
  if (pct <= 0) {
    return { backgroundColor: '#ffffff', color: '#0f172a' }
  }
  const t = Math.min(1, pct / 100)
  const r = Math.round(255 + (59 - 255) * t)
  const g = Math.round(255 + (130 - 255) * t)
  const b = Math.round(255 + (246 - 255) * t)
  return {
    backgroundColor: `rgb(${r},${g},${b})`,
    color: t > 0.55 ? '#ffffff' : '#0f172a',
  }
}

function CardSortingStandardizationGridView({ selected }: { selected: CardSortProjectRow }) {
  const boardCards = selected.boardCards ?? EMPTY_BOARD_CARDS
  const grid = useMemo(
    () => aggregateStandardizationGrid(selected.responses, boardCards),
    [selected.responses, boardCards]
  )
  const [hideEmptyRows, setHideEmptyRows] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const maxRef = Math.max(1, grid.totalRespondents)

  const visibleRows = useMemo(() => {
    if (!hideEmptyRows) return grid.rows
    return grid.rows.filter((r) => {
      if (r.notStandardizedCount > 0) return true
      for (const cn of grid.categoryNames) {
        if ((r.countByCategory[cn] ?? 0) > 0) return true
      }
      return false
    })
  }, [grid.rows, grid.categoryNames, hideEmptyRows])

  const gridShellClass = fullscreen
    ? 'fixed inset-3 z-[90] flex flex-col overflow-hidden border border-slate-200 bg-[rgba(252,252,251,0.98)] shadow-2xl sm:inset-6'
    : 'overflow-hidden border border-slate-200/80 bg-transparent'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Standardiseringsgitter</h3>
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHideEmptyRows(false)
              setFullscreen(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Genberegn analyse
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Flere muligheder"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Hjælp"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 print:hidden"
          >
            PDF-eksport
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-slate-200/80 px-1 py-3 text-sm">
        <span className="text-slate-600">Standardization preset</span>
        <select
          disabled
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
          aria-label="Standardization preset"
          defaultValue=""
        >
          <option value="">Vælg en gemt skabelon</option>
        </select>
      </div>

      {fullscreen && (
        <button
          type="button"
          className="fixed inset-0 z-[85] bg-slate-900/40 print:hidden"
          aria-label="Afslut fuld skærm"
          onClick={() => setFullscreen(false)}
        />
      )}

      <div className={gridShellClass}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Antal respondenter</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs text-slate-500">0%</span>
              <div
                className="h-3 min-w-[120px] flex-1 max-w-md rounded-full border border-slate-200"
                style={{
                  background: 'linear-gradient(to right, #ffffff 0%, #3b82f6 100%)',
                }}
              />
              <span className="text-xs text-slate-600">
                100% ({grid.totalRespondents} respondent{grid.totalRespondents === 1 ? '' : 'er'})
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 print:hidden"
            >
              {fullscreen ? 'Afslut fuld skærm' : 'Fuld skærm'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Skjul rækker uden data</span>
              <button
                type="button"
                role="switch"
                aria-checked={hideEmptyRows}
                onClick={() => setHideEmptyRows((v) => !v)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  hideEmptyRows ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    hideEmptyRows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className={`min-h-0 flex-1 overflow-auto ${fullscreen ? 'max-h-[calc(100vh-12rem)]' : 'max-h-[min(70vh,720px)]'}`}>
          {grid.rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Ingen kort på boardet. Tilføj kort i kortsorteringsværktøjet for at opbygge gitteret.
            </p>
          ) : visibleRows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Alle rækker er tomme for de aktuelle data. Slå &quot;Skjul rækker uden data&quot; fra for at se alle
              kort.
            </p>
          ) : (
            <>
              {grid.totalRespondents === 0 && (
                <p className="border-b border-amber-100 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-950">
                  Ingen fuldførte sorterings-snapshots endnu — alle celler er 0 indtil respondenterne
                  afslutter sorteringen.
                </p>
              )}
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-500">
                  <th className="sticky left-0 z-20 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                    Kort
                  </th>
                  {grid.categoryNames.map((cn) => (
                    <th
                      key={cn}
                      className="min-w-[7rem] border-b border-slate-200 px-2 py-3 text-center font-semibold text-slate-600"
                    >
                      <span className="line-clamp-2">{cn}</span>
                    </th>
                  ))}
                  <th className="min-w-[7.5rem] border-b border-slate-200 px-2 py-3 text-center font-semibold text-slate-600">
                    <span className="line-clamp-2">{STANDARDIZATION_GRID_NOT_PLACED_LABEL}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const nsStyle = heatmapCellStyle(row.notStandardizedCount, maxRef)
                  return (
                    <tr key={row.cardId} className="border-b border-slate-100">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2.5 font-medium text-slate-900 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                        {row.cardLabel}
                      </td>
                      {grid.categoryNames.map((cn) => {
                        const c = row.countByCategory[cn] ?? 0
                        const st = heatmapCellStyle(c, maxRef)
                        return (
                          <td
                            key={cn}
                            className="px-1 py-0 text-center tabular-nums"
                            style={st}
                          >
                            <div className="py-2.5 font-medium">{c}</div>
                          </td>
                        )
                      })}
                      <td
                        className="px-1 py-0 text-center tabular-nums"
                        style={nsStyle}
                      >
                        <div className="py-2.5 font-medium">{row.notStandardizedCount}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CardSortingSimilarityMatrixView({ selected }: { selected: CardSortProjectRow }) {
  const boardCards = selected.boardCards ?? EMPTY_BOARD_CARDS
  const matrix = useMemo(
    () => aggregateSimilarityMatrix(selected.responses, boardCards),
    [selected.responses, boardCards]
  )
  const [legendOpen, setLegendOpen] = useState(true)

  const n = matrix.cardLabels.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Similaritetsmatrix</h3>
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLegendOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Genberegn analyse
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Flere muligheder"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Hjælp"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 print:hidden"
          >
            PDF-eksport
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200/80 bg-transparent">
        <button
          type="button"
          onClick={() => setLegendOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50/80"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">TABELFORKLARING</span>
          {legendOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          )}
        </button>
        {legendOpen && (
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="mb-2 text-xs font-semibold text-slate-600">Antal respondenter</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs text-slate-500">0%</span>
              <div
                className="h-3 min-w-[140px] flex-1 max-w-lg rounded-full border border-slate-200"
                style={{
                  background: 'linear-gradient(to right, #ffffff 0%, #3b82f6 100%)',
                }}
              />
              <span className="text-xs text-slate-600">
                100% ({matrix.totalRespondents} respondent{matrix.totalRespondents === 1 ? '' : 'er'})
              </span>
            </div>
          </div>
        )}

        <div className="max-h-[min(75vh,800px)] overflow-auto p-4">
          {n < 2 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Tilføj mindst to kort til boardet for at se parvis similaritet.
            </p>
          ) : matrix.totalRespondents === 0 ? (
            <>
              <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                Ingen fuldførte sorterings-snapshots endnu — alle similariteter er 0% indtil respondenterne
                afslutter sorteringen.
              </p>
              <SimilarityMatrixTable matrix={matrix} />
            </>
          ) : (
            <SimilarityMatrixTable matrix={matrix} />
          )}
        </div>
      </div>
    </div>
  )
}

function SimilarityMatrixTable({ matrix }: { matrix: SimilarityMatrixResult }) {
  const n = matrix.cardLabels.length
  if (n < 2) return null

  return (
    <table className="w-max border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky left-0 z-10 min-w-[6rem] border border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs font-semibold text-slate-500" />
          {matrix.cardLabels.slice(0, n - 1).map((label, j) => (
            <th
              key={matrix.cardIds[j] ?? j}
              className="min-h-[3rem] min-w-[3.25rem] max-w-[8rem] border border-slate-200 bg-slate-50 px-1 py-2 text-center text-xs font-semibold leading-tight text-slate-600"
            >
              <span className="line-clamp-3 break-words">{label}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.cardLabels.slice(1).map((rowLabel, rowIdx) => {
          const i = rowIdx + 1
          const rowPcts = matrix.lowerTriPct[i] ?? []
          return (
            <tr key={matrix.cardIds[i] ?? i}>
              <th
                scope="row"
                className="sticky left-0 z-10 border border-slate-200 bg-white px-2 py-2 text-left text-xs font-semibold text-slate-800 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]"
              >
                <span className="line-clamp-3 break-words">{rowLabel}</span>
              </th>
              {Array.from({ length: n - 1 }, (_, colIdx) => {
                if (colIdx < i) {
                  const pct = rowPcts[colIdx] ?? 0
                  const st = similarityPercentCellStyle(pct)
                  return (
                    <td
                      key={`${i}-${colIdx}`}
                      className="h-14 min-w-[3.25rem] border border-slate-200 p-0 text-center align-middle tabular-nums"
                      style={st}
                    >
                      <span className="inline-flex min-h-[2.75rem] w-full items-center justify-center px-1 text-sm font-semibold">
                        {pct}
                      </span>
                    </td>
                  )
                }
                return (
                  <td
                    key={`pad-${i}-${colIdx}`}
                    className="border border-slate-100 bg-slate-50/40"
                    aria-hidden
                  />
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type DendrogramMethod = 'bbm' | 'aam'
type DendrogramLeaf = { id: string; label: string; y: number }
type DendrogramSegment = { x1: number; y1: number; x2: number; y2: number }

function cardPairSimilarity(
  matrix: SimilarityMatrixResult,
  i: number,
  j: number
): number {
  if (i === j) return 100
  const hi = Math.max(i, j)
  const lo = Math.min(i, j)
  return matrix.lowerTriPct[hi]?.[lo] ?? 0
}

function buildDendrogram(
  matrix: SimilarityMatrixResult,
  method: DendrogramMethod
): { leaves: DendrogramLeaf[]; segments: DendrogramSegment[] } {
  const n = matrix.cardLabels.length
  if (n === 0) return { leaves: [], segments: [] }

  type Cluster = { ids: number[]; y: number; x: number }
  const leaves: DendrogramLeaf[] = matrix.cardLabels.map((label, i) => ({
    id: matrix.cardIds[i] ?? String(i),
    label,
    y: i * 26 + 16,
  }))
  let clusters: Cluster[] = leaves.map((l, i) => ({
    ids: [i],
    y: l.y,
    x: 100,
  }))
  const segments: DendrogramSegment[] = []

  const clusterSimilarity = (a: Cluster, b: Cluster): number => {
    const vals: number[] = []
    for (const i of a.ids) {
      for (const j of b.ids) {
        vals.push(cardPairSimilarity(matrix, i, j))
      }
    }
    if (vals.length === 0) return 0
    if (method === 'bbm') return Math.max(...vals)
    return vals.reduce((x, y) => x + y, 0) / vals.length
  }

  while (clusters.length > 1) {
    let bestI = 0
    let bestJ = 1
    let bestS = -1
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const s = clusterSimilarity(clusters[i]!, clusters[j]!)
        if (s > bestS) {
          bestS = s
          bestI = i
          bestJ = j
        }
      }
    }
    const a = clusters[bestI]!
    const b = clusters[bestJ]!
    const mergeX = Math.max(0, Math.min(100, bestS))
    segments.push({ x1: a.x, y1: a.y, x2: mergeX, y2: a.y })
    segments.push({ x1: b.x, y1: b.y, x2: mergeX, y2: b.y })
    segments.push({ x1: mergeX, y1: a.y, x2: mergeX, y2: b.y })

    const merged: Cluster = {
      ids: [...a.ids, ...b.ids].sort((x, y) => x - y),
      y: (a.y + b.y) / 2,
      x: mergeX,
    }
    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ)
    clusters.push(merged)
    clusters.sort((c1, c2) => c1.y - c2.y)
  }

  return { leaves, segments }
}

function truncateLabel(s: string, max = 12): string {
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(1, max - 1))}…`
}

function CardSortingDendrogramView({ selected }: { selected: CardSortProjectRow }) {
  const boardCards = selected.boardCards ?? EMPTY_BOARD_CARDS
  const matrix = useMemo(
    () => aggregateSimilarityMatrix(selected.responses, boardCards),
    [selected.responses, boardCards]
  )
  const [method, setMethod] = useState<DendrogramMethod>('bbm')
  const [hoverInfo, setHoverInfo] = useState(false)
  const chart = useMemo(() => buildDendrogram(matrix, method), [matrix, method])

  const H = Math.max(280, chart.leaves.length * 26 + 40)
  const W = 980
  const leftPad = 72
  const rightPad = 24
  const topPad = 10
  const bottomPad = 26
  const xToPx = (x: number) => leftPad + ((100 - x) / 100) * (W - leftPad - rightPad)

  const title =
    method === 'bbm' ? 'Dendrogram: Bedste fletmetode (BMM)' : 'Dendrogram: Faktisk enighedsmetode (AAM)'
  const helpText =
    method === 'bbm'
      ? 'Hjælper dig med at udlede mest mulig information fra mindre datagrundlag.'
      : 'Fungerer bedst med 30 eller flere respondenter.'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setHoverInfo(true)}
              onMouseLeave={() => setHoverInfo(false)}
              onFocus={() => setHoverInfo(true)}
              onBlur={() => setHoverInfo(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Dendrogram method info"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {hoverInfo && (
              <div className="absolute left-6 top-0 z-10 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xl">
                <p className="font-semibold text-slate-800">
                  {method === 'bbm' ? 'Bedste fletmetode' : 'Faktisk enighedsmetode'}
                </p>
                <p className="mt-1">
                  This dendrogram answers the question: "How many people agreed with parts of this group?"
                </p>
                <p className="mt-1">{helpText}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as DendrogramMethod)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            aria-label="Dendrogram method"
          >
            <option value="bbm">Bedste fletmetode (BMM)</option>
            <option value="aam">Faktisk enighedsmetode (AAM)</option>
          </select>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm"
          >
            Gem diagram
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200/80 bg-transparent p-3">
        {chart.leaves.length < 2 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Tilføj mindst to kort og fuldførte svar for at tegne et dendrogram.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <svg width={W} height={H} role="img" aria-label="Dendrogram chart">
              {Array.from({ length: 11 }, (_, idx) => idx * 10).map((tick) => {
                const x = xToPx(tick)
                return (
                  <g key={tick}>
                    <line
                      x1={x}
                      y1={topPad}
                      x2={x}
                      y2={H - bottomPad}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text x={x} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748B">
                      {100 - tick}
                    </text>
                  </g>
                )
              })}

              <line
                x1={leftPad}
                y1={topPad}
                x2={leftPad}
                y2={H - bottomPad}
                stroke="#0f172a"
                strokeWidth="1"
              />
              <line
                x1={leftPad}
                y1={H - bottomPad}
                x2={W - rightPad}
                y2={H - bottomPad}
                stroke="#0f172a"
                strokeWidth="1"
              />

              <text x={leftPad - 6} y={topPad + 10} textAnchor="end" fontSize="11" fill="#64748B">
                Kort
              </text>

              {chart.leaves.map((leaf) => (
                <text
                  key={leaf.id}
                  x={leftPad - 8}
                  y={leaf.y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#0f172a"
                >
                  {truncateLabel(leaf.label)}
                </text>
              ))}

              {chart.segments.map((s, idx) => (
                <line
                  key={`${idx}-${s.x1}-${s.y1}`}
                  x1={xToPx(s.x1)}
                  y1={s.y1}
                  x2={xToPx(s.x2)}
                  y2={s.y2}
                  stroke="#A3D340"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function CardSortingAnalysisSection({ selected }: { selected: CardSortProjectRow }) {
  const [subView, setSubView] = useState<AnalysisMenuId | null>(null)

  if (subView === 'cards') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <CardSortingCardsAnalysisView selected={selected} />
      </div>
    )
  }

  if (subView === 'categories') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <CardSortingCategoriesAnalysisView selected={selected} />
      </div>
    )
  }

  if (subView === 'standardization') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <CardSortingStandardizationGridView selected={selected} />
      </div>
    )
  }

  if (subView === 'similarity') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <CardSortingSimilarityMatrixView selected={selected} />
      </div>
    )
  }

  if (subView === 'dendrogram') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <CardSortingDendrogramView selected={selected} />
      </div>
    )
  }

  if (subView) {
    const item = ANALYSIS_MENU.find((x) => x.id === subView)
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView(null)}
          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          ← Analysemenu
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">{item?.title ?? subView}</h3>
          <p className="mt-2 text-sm text-slate-600">{item?.description}</p>
          <p className="mt-6 text-sm text-slate-500">
            This view is not implemented yet. It will use your stored card-sort responses when enough data is
            available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-semibold text-slate-900">Analyse</h3>
        <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
      </div>
      <ul className="divide-y divide-slate-200 border-y border-slate-200/80">
        {ANALYSIS_MENU.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSubView(item.id)}
              className="flex w-full items-center gap-4 px-2 py-4 text-left transition hover:bg-slate-50/70"
            >
              <span className="h-8 w-0.5 shrink-0 bg-amber-400" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <span className="font-semibold text-slate-900">{item.title}</span>
                <span className="text-sm leading-snug text-slate-500">{item.description}</span>
              </span>
              <span className="flex shrink-0 items-center">
                <ChevronRight className="h-5 w-5 text-amber-500" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const TIME_AXIS_MAX_SEC = 120 // 2 minutter som på reference

function pctOfAxis(sec: number): number {
  return Math.min(100, Math.max(0, (sec / TIME_AXIS_MAX_SEC) * 100))
}

function SummaryDonut({ completed, total }: { completed: number; total: number }) {
  const r = 56
  const C = 2 * Math.PI * r
  const denom = Math.max(total, 1)
  const pct = Math.min(1, completed / denom)
  const dash = pct * C
  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke="#22C55E"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center leading-tight">
        <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {completed} out of {denom} completed
        </span>
      </div>
    </div>
  )
}

function TimeDistributionBar({ stats }: { stats: NonNullable<DurationStats> }) {
  const p = (sec: number) => pctOfAxis(sec)
  const left = (sec: number) => `${p(sec)}%`
  const w = (a: number, b: number) => `${Math.max(0, p(b) - p(a))}%`
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2]
  const medianMinLabel = (stats.median / 60).toFixed(2)

  return (
    <div className="space-y-3">
      <div className="relative pb-1 pt-7">
        <span
          className="absolute top-0 text-xs font-semibold text-slate-800"
          style={{ left: left(stats.median), transform: 'translateX(-50%)' }}
        >
          {medianMinLabel}
        </span>
        <div className="relative mx-auto h-14 w-full max-w-md">
          <div className="absolute bottom-2 left-0 right-0 top-6">
            <div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-slate-300"
              style={{ left: left(stats.min), width: w(stats.min, stats.max) }}
            />
            <div
              className="absolute top-1/2 h-4 -translate-y-1/2 rounded border border-slate-400 bg-slate-200/90"
              style={{ left: left(stats.q1), width: w(stats.q1, stats.q3) }}
            />
            <div
              className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-amber-500"
              style={{ left: left(stats.median) }}
            />
            <div
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-500"
              style={{ left: left(stats.min) }}
            />
            <div
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-500"
              style={{ left: left(stats.max) }}
            />
          </div>
        </div>
        <div className="relative mx-auto mt-1 h-4 w-full max-w-md px-0.5">
          {ticks.map((m) => {
            const leftPct = (m / 2) * 100
            const style: CSSProperties =
              m === 0
                ? { left: '0%', transform: 'translateX(0)' }
                : m === 2
                  ? { left: '100%', transform: 'translateX(-100%)' }
                  : { left: `${leftPct}%`, transform: 'translateX(-50%)' }
            return (
              <span key={m} className="absolute top-0 text-[10px] text-slate-500" style={style}>
                {m === 0 ? '0' : `${m}m`}
              </span>
            )
          })}
        </div>
      </div>
      <ul className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <li className="flex justify-between gap-2">
          <span>Lowest observed time</span>
          <span className="font-medium text-slate-900">{formatSecondsWithDecimalMinutes(stats.min)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Lower quartile</span>
          <span className="font-medium text-slate-900">{formatSecondsWithDecimalMinutes(stats.q1)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Median</span>
          <span className="font-medium text-slate-900">{formatSecondsWithDecimalMinutes(stats.median)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Upper quartile</span>
          <span className="font-medium text-slate-900">{formatSecondsWithDecimalMinutes(stats.q3)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Highest observed time</span>
          <span className="font-medium text-slate-900">{formatSecondsWithDecimalMinutes(stats.max)}</span>
        </li>
      </ul>
    </div>
  )
}

function CardSortingRespondentsView({
  selected,
  allowPersistedMutations,
  onResponsesMutated,
}: {
  selected: CardSortProjectRow
  allowPersistedMutations: boolean
  onResponsesMutated: () => void
}) {
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectionBarOpen, setSelectionBarOpen] = useState(false)
  const [filterOp, setFilterOp] = useState<'gte' | 'lte' | 'eq'>('gte')
  const [filterValue, setFilterValue] = useState('')
  const [filterUnit, setFilterUnit] = useState<'min' | 's'>('min')
  const [appliedFilter, setAppliedFilter] = useState<{ op: 'gte' | 'lte' | 'eq'; thresholdSec: number } | null>(null)
  const [sortBy, setSortBy] = useState<'startedAt' | 'duration'>('startedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(12)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [includeMap, setIncludeMap] = useState<Record<string, boolean>>({})
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null)

  const boardMeta = useMemo(
    () => ({ cardCount: selected.cardCount, mode: selected.mode }),
    [selected.cardCount, selected.mode]
  )

  const sorted = useMemo(() => {
    const arr = [...selected.responses]
    arr.sort((a, b) => {
      const va = sortBy === 'startedAt' ? new Date(a.startedAt).getTime() : (a.durationSec ?? 0)
      const vb = sortBy === 'startedAt' ? new Date(b.startedAt).getTime() : (b.durationSec ?? 0)
      const c = va - vb
      return sortDir === 'asc' ? c : -c
    })
    return arr
  }, [selected.responses, sortBy, sortDir])

  const filtered = useMemo(() => {
    if (!appliedFilter) return sorted
    return sorted.filter((r) => {
      const sec = typeof r.durationSec === 'number' ? r.durationSec : 0
      const t = appliedFilter.thresholdSec
      if (appliedFilter.op === 'gte') return sec >= t
      if (appliedFilter.op === 'lte') return sec <= t
      return Math.abs(sec - t) <= 0.5
    })
  }, [sorted, appliedFilter])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize) || 1)
  const safePage = Math.min(page, totalPages)
  const from = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, totalFiltered)
  const pageSlice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setIncludeMap((prev) => {
      const next = { ...prev }
      for (const r of selected.responses) {
        if (next[r.id] === undefined) next[r.id] = true
      }
      return next
    })
  }, [selected.responses])

  useEffect(() => {
    if (!detailOpenId) return
    if (!filtered.some((r) => r.id === detailOpenId)) setDetailOpenId(null)
  }, [filtered, detailOpenId])

  const includedInAnalysis = useMemo(
    () => filtered.filter((r) => includeMap[r.id] !== false).length,
    [filtered, includeMap]
  )

  const detailIdx = detailOpenId ? filtered.findIndex((r) => r.id === detailOpenId) : -1
  const detailR = detailIdx >= 0 ? filtered[detailIdx] : null
  const canDeleteRespondent =
    allowPersistedMutations && detailR && !detailR.id.startsWith('demo-')

  const parseFilterNum = () => parseFloat(filterValue.replace(',', '.').trim())
  const applyDisabled = filterValue.trim() === '' || Number.isNaN(parseFilterNum()) || parseFilterNum() < 0

  const applyFilter = () => {
    const n = parseFilterNum()
    if (Number.isNaN(n) || n < 0) return
    const sec = filterUnit === 'min' ? n * 60 : n
    setAppliedFilter({ op: filterOp, thresholdSec: sec })
    setPage(1)
  }

  const clearFilter = () => {
    setFilterValue('')
    setAppliedFilter(null)
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pageAllSelected =
    pageSlice.length > 0 && pageSlice.every((r) => selectedIds.has(r.id))

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (pageAllSelected) {
        for (const r of pageSlice) next.delete(r.id)
      } else {
        for (const r of pageSlice) next.add(r.id)
      }
      return next
    })
  }

  if (selected.responses.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">Ingen respondenter endnu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Respondenter</h3>
        <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
      </div>

      <section className="border-y border-slate-200/80 py-1">
        <div className="flex w-full items-center justify-between gap-3 px-1 py-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-600">
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            Filtrer respondenter hvor…
          </span>
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-expanded={filterOpen}
            aria-label={filterOpen ? 'Collapse filters' : 'Expand filters'}
          >
            {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {filterOpen && (
          <div className="space-y-4 border-t border-slate-200/80 px-1 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                aria-label="Filter field"
                defaultValue="timeTaken"
              >
                <option value="timeTaken">time taken is</option>
              </select>
              <select
                value={filterOp}
                onChange={(e) => setFilterOp(e.target.value as 'gte' | 'lte' | 'eq')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                aria-label="Filter operator"
              >
                <option value="gte">more than or equal to</option>
                <option value="lte">less than or equal to</option>
                <option value="eq">equal to</option>
              </select>
              <input
                type="text"
                inputMode="decimal"
                placeholder="time"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value as 'min' | 's')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="min">min</option>
                <option value="s">s</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearFilter}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ryd
              </button>
              <button
                type="button"
                disabled={applyDisabled}
                onClick={applyFilter}
                className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  applyDisabled
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                Anvend filter
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="border-y border-slate-200/80 py-1">
        <div className="flex w-full items-center justify-between gap-3 px-1 py-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
            <input
              type="checkbox"
              checked={pageAllSelected}
              onChange={() => toggleSelectPage()}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            Respondentvalg ({selectedIds.size})
          </span>
          <button
            type="button"
            onClick={() => setSelectionBarOpen((o) => !o)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-expanded={selectionBarOpen}
            aria-label={selectionBarOpen ? 'Collapse selection' : 'Expand selection'}
          >
            {selectionBarOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {selectionBarOpen && (
          <div className="border-t border-slate-200/80 px-1 py-3 text-xs text-slate-600">
            Use the checkboxes on cards or in the header row to select respondents for future bulk actions.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-y border-slate-200/80 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">Viser:</span>{' '}
            {totalFiltered === 0
              ? '0 respondents of 0'
              : `${from} to ${to} respondents of ${totalFiltered}`}
          </p>
          <p className="mt-0.5">
            <span className="font-medium text-slate-800">{includedInAnalysis}</span> respondents included in
            analysis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clearFilter()
              setDetailOpenId(null)
              setPage(1)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Genberegn analyse
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Flere muligheder"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Hjælp"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
            defaultValue="csv"
            aria-label="Eksport"
          >
            <option value="csv">Eksport</option>
          </select>
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-slate-600 sm:inline">Sortér efter</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'startedAt' | 'duration')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              aria-label="Sortér efter"
            >
              <option value="startedAt">Startet</option>
              <option value="duration">Tidsforbrug</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Toggle sort direction"
            >
              {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {sorted.length > 0 && totalFiltered === 0 && (
          <p className="col-span-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-950">
            Ingen respondenter matcher filteret. Ryd eller justér filteret og anvend igen.
          </p>
        )}
        {pageSlice.map((r, idx) => {
          const globalIndex = (safePage - 1) * pageSize + idx + 1
          const m = respondentDisplayMetrics(r, boardMeta)
          const completed = Boolean(!r.abandoned && r.completedAt)
          return (
            <div
              key={r.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="truncate font-semibold text-slate-900">Respondent {globalIndex}</span>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-rose-300 text-xs font-bold text-rose-900"
                  aria-hidden
                >
                  <UserRound className="h-5 w-5 text-rose-800/90" />
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Startet</dt>
                  <dd className="text-right font-medium text-slate-900">{formatEnDateTime(r.startedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium text-slate-900">{completed ? 'Fuldført' : 'Afbrudt'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Tidsforbrug</dt>
                  <dd className="font-medium text-slate-900">
                    {typeof r.durationSec === 'number' ? formatDurationShort(r.durationSec) : '–'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Kort sorteret</dt>
                  <dd className="font-medium text-slate-900">{m.cardsSortedPct.toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Kategorier oprettet</dt>
                  <dd className="font-medium text-slate-900">{m.categoriesCreated}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Kategorier navngivet</dt>
                  <dd className="font-medium text-slate-900">{m.categoriesNamedPct.toFixed(1)}%</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-600">Medtag i analyse</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeMap[r.id] !== false}
                  onClick={() =>
                    setIncludeMap((prev) => ({
                      ...prev,
                      [r.id]: prev[r.id] === false ? true : false,
                    }))
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    includeMap[r.id] !== false ? 'bg-orange-500' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      includeMap[r.id] !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailOpenId(r.id)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Detaljer
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <section className="flex flex-col items-stretch justify-between gap-3 border-y border-slate-200/80 px-1 py-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Respondenter pr. side
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            {[6, 12, 24, 48].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-700">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
            aria-label="Forrige side"
          >
            ←
          </button>
          <span className="text-xs font-bold uppercase tracking-wide">
            Side {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
            aria-label="Næste side"
          >
            →
          </button>
        </div>
      </section>

      {detailR && (
        <RespondentDetailModal
          open
          onClose={() => setDetailOpenId(null)}
          r={detailR}
          title={`Respondent ${detailIdx + 1}`}
          board={boardMeta}
          includeInAnalysis={includeMap[detailR.id] !== false}
          onToggleInclude={() =>
            setIncludeMap((prev) => ({
              ...prev,
              [detailR.id]: prev[detailR.id] === false ? true : false,
            }))
          }
          onPrev={() => {
            if (detailIdx <= 0) return
            setDetailOpenId(filtered[detailIdx - 1]!.id)
          }}
          onNext={() => {
            if (detailIdx < 0 || detailIdx >= filtered.length - 1) return
            setDetailOpenId(filtered[detailIdx + 1]!.id)
          }}
          hasPrev={detailIdx > 0}
          hasNext={detailIdx >= 0 && detailIdx < filtered.length - 1}
          canDelete={Boolean(canDeleteRespondent)}
          projectId={selected.projectId}
          onDeleted={onResponsesMutated}
        />
      )}
    </div>
  )
}

export default function CardSortingAnalyticsPanel({
  isLoggedIn,
  projectId: scopedProjectId = null,
  returnPath = null,
}: {
  isLoggedIn: boolean
  projectId?: string | null
  returnPath?: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ApiPayload | null>(null)
  const [dataRefreshKey, setDataRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number]['id']>('overview')
  const userDismissedDemoDetailRef = useRef(false)

  const selectedId = searchParams.get(CSP_PARAM)

  const setSelectedId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (id) next.set(CSP_PARAM, id)
      else next.delete(CSP_PARAM)
      const q = next.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const q = scopedProjectId ? `?projectId=${encodeURIComponent(scopedProjectId)}` : ''
        const res = await fetch(`/api/analytics/card-sorting${q}`, { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) setError('Ikke logget ind.')
            return
          }
          throw new Error('fetch failed')
        }
        const json = (await res.json()) as ApiPayload
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError('Kunne ikke indlæse kortsortering.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, scopedProjectId, dataRefreshKey])

  const effectiveData = useMemo(() => {
    if (!data) return null
    if (data.projects.length === 0) {
      return getDemoCardSortApiPayload(
        undefined,
        scopedProjectId ? { projectId: scopedProjectId, projectName: 'Projekt' } : undefined
      )
    }
    return data
  }, [data, scopedProjectId])

  const showListDemo = Boolean(data && data.projects.length === 0)

  useEffect(() => {
    if (!showListDemo) userDismissedDemoDetailRef.current = false
  }, [showListDemo])

  /** Kun demo-liste (ingen rigtige projekter): åbn overblik med det samme, så faner + Summary/Time/Locations vises. */
  useLayoutEffect(() => {
    if (!showListDemo || scopedProjectId) return
    if (selectedId) return
    if (userDismissedDemoDetailRef.current) return
    const row = effectiveData?.projects[0]
    if (!row?.projectId) return
    setSelectedId(row.projectId)
  }, [showListDemo, scopedProjectId, selectedId, effectiveData, setSelectedId])

  useEffect(() => {
    if (!scopedProjectId) return
    if (searchParams.get(CSP_PARAM) === scopedProjectId) return
    setSelectedId(scopedProjectId)
  }, [scopedProjectId, searchParams, setSelectedId])

  const detailKey = scopedProjectId || selectedId || null
  const rawSelected = useMemo(
    () =>
      detailKey && effectiveData
        ? effectiveData.projects.find((p) => p.projectId === detailKey) ?? null
        : null,
    [effectiveData, detailKey]
  )

  const usingResponseDemo = Boolean(
    rawSelected &&
      rawSelected.projectId !== DEMO_CARD_SORT_PROJECT_ID &&
      rawSelected.responses.length === 0
  )

  const selected = useMemo(() => {
    if (!rawSelected) return null
    if (usingResponseDemo) return mergeProjectWithResponseDemo(rawSelected)
    return rawSelected
  }, [rawSelected, usingResponseDemo])
  const [sharingMode, setSharingMode] = useState<SharingMode>('none')
  const [sharingPassword, setSharingPassword] = useState('')
  const [sharingToken, setSharingToken] = useState(() => makeShareToken())
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)

  useEffect(() => {
    if (!selected?.projectId) return
    setSharingMode('none')
    setSharingPassword('')
    setCopiedShareUrl(false)
    setSharingToken(makeShareToken())
  }, [selected?.projectId])

  useEffect(() => {
    if (selectedId === DEMO_CARD_SORT_PROJECT_ID && data && data.projects.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, data, setSelectedId])

  useEffect(() => {
    if (scopedProjectId) return
    if (selectedId && effectiveData && !effectiveData.projects.some((p) => p.projectId === selectedId)) {
      setSelectedId(null)
    }
  }, [scopedProjectId, selectedId, effectiveData, setSelectedId])

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">Log ind for at se kortsortering gemt i dine projekter.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          Log ind
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!effectiveData) {
    return null
  }

  if (selected) {
    const allowPersistedMutations = Boolean(
      data &&
        rawSelected &&
        data.projects.some((p) => p.projectId === rawSelected.projectId) &&
        !usingResponseDemo
    )
    const backHref = returnPath || '/dashboard'
    const rs = selected.responseSummary
    const donutTotal =
      typeof rs.totalResponses === 'number' && rs.totalResponses > 0
        ? rs.totalResponses
        : Math.max(rs.completed + rs.abandoned, rs.completed > 0 ? rs.completed : 1)

    const exportCsv = () => {
      const rows = [
        ['id', 'startedAt', 'completedAt', 'durationSec', 'abandoned', 'categoryCount', 'country'].join(','),
        ...selected.responses.map((r) =>
          [
            r.id,
            r.startedAt,
            r.completedAt ?? '',
            r.durationSec ?? '',
            r.abandoned ? '1' : '0',
            r.categoryCount ?? '',
            r.country ?? '',
          ].join(',')
        ),
      ]
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `kortsortering-${selected.projectId.slice(0, 8)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    }

    return (
      <div className="space-y-6 print:max-w-none">
        {(showListDemo || usingResponseDemo) && (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 print:hidden"
            role="status"
          >
            <span className="font-semibold">Eksempeldata.</span>{' '}
            {showListDemo
              ? 'Du har ingen kortsortering gemt i projekter endnu — her er et forhåndsvisning. Når du udgiver testen og registrerer svar, vises dine egne tal.'
              : 'Ingen registrerede svar i dette projekt endnu — nedenfor er et eksempel på, hvordan det kommer til at se ud.'}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {scopedProjectId ? (
            <Link
              href={backHref}
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
            >
              ← Tilbage til projekt
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (showListDemo) userDismissedDemoDetailRef.current = true
                  setSelectedId(null)
                  setDetailTab('overview')
                }}
                className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
              >
                ← Alle projekter
              </button>
              <span className="text-slate-300">|</span>
            </>
          )}
          <h2 className="text-lg font-semibold text-slate-900">{selected.projectName}</h2>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-[rgba(248,247,243,0.9)] p-4 sm:p-6">
          <div className="border-b border-slate-200 print:hidden">
            <div className="flex flex-wrap gap-1">
              {DETAIL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTab(t.id)}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                    detailTab === t.id
                      ? 'bg-slate-100/80 font-semibold text-slate-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  {detailTab === t.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {detailTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 print:block">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-slate-900">Overblik</h3>
                <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 print:hidden"
              >
                <Download className="h-4 w-4" />
                PDF-eksport
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-transparent p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ClipboardList className="h-5 w-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Opsummering</h4>
                  <HelpCircle className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
                </div>
                <SummaryDonut completed={rs.completed} total={donutTotal} />
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                    <span>Oprettet</span>
                    <span className="font-medium text-slate-900">{formatEnLongDate(selected.createdAt)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Lanceret</span>
                    <span className="font-medium text-slate-900">{formatEnLongDate(selected.launchedAt)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Seneste respondent</span>
                    <span className="font-medium text-slate-900">{formatEnLongDate(rs.lastRespondentAt)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Fuldførte</span>
                    <span className="font-medium text-slate-900">{rs.completed} respondenter</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Afbrudte</span>
                    <span className="font-medium text-slate-900">{rs.abandoned} respondenter</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Unikke kategorier i alt</span>
                    <span className="font-medium text-slate-900">{rs.boardUniqueCategories}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Gns. antal kategorier</span>
                    <span className="font-medium text-slate-900">
                      {rs.avgCategoriesPerResponse ?? '–'}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Højeste antal kategorier</span>
                    <span className="font-medium text-slate-900">
                      {rs.maxCategoriesPerResponse ?? '–'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-transparent p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="h-5 w-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Tidsforbrug</h4>
                  <HelpCircle className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
                </div>
                {rs.durationStats && rs.completed > 0 ? (
                  <TimeDistributionBar stats={rs.durationStats} />
                ) : (
                  <p className="text-sm text-slate-500">
                    Ingen tidsdata endnu. Registrér svar fra kortsorteringsværktøjet (respondent-flow) for at se
                    fordelingen.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-transparent p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="h-5 w-5 text-slate-600" />
                  <h4 className="font-semibold text-slate-900">Toplokationer</h4>
                  <HelpCircle className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
                </div>
                {rs.locations.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Ingen lokationsdata endnu. Land kan tilføjes pr. respondent senere.
                  </p>
                ) : (
                  <div>
                    <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Lokation</span>
                      <span className="text-right">Respondenter</span>
                    </div>
                    <ul className="mt-3 space-y-4">
                      {rs.locations.slice(0, 5).map((loc) => (
                        <li key={loc.label}>
                          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                            <span className="font-medium text-slate-900">{loc.label}</span>
                            <span className="text-right font-medium text-slate-700">
                              {loc.pct.toFixed(1)}%{' '}
                              <span className="text-slate-500">({loc.count})</span>
                            </span>
                            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-teal-500/85"
                                style={{ width: `${Math.min(100, loc.pct)}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-4 text-[11px] font-bold uppercase tracking-widest text-teal-700 hover:text-teal-900"
                    >
                      VIS FLERE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {detailTab === 'respondents' && (
          <CardSortingRespondentsView
            selected={selected}
            allowPersistedMutations={allowPersistedMutations}
            onResponsesMutated={() => setDataRefreshKey((k) => k + 1)}
          />
          )}

          {detailTab === 'analysis' && <CardSortingAnalysisSection selected={selected} />}

          {detailTab === 'export' && (
          <div className="rounded-xl border border-slate-200/80 bg-transparent p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Eksport</h3>
            <p className="mb-4 text-sm text-slate-600">
              Download alle registrerede svar som CSV til regneark eller videre analyse.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Hent CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Eksportér PDF
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              PDF-eksport åbner print-dialogen, hvor du kan vælge “Gem som PDF”.
            </p>
          </div>
          )}

          {detailTab === 'sharing' && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-200/80 bg-transparent p-6">
              <div className="mb-4 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Deling</h3>
              </div>
              {sharingMode === 'none' && (
                <p className="rounded-md border-l-4 border-amber-400 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Studiets resultater deles ikke. I højre side kan du vælge delingsindstillinger.
                </p>
              )}
              {sharingMode === 'secret' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">Resultater deles via en hemmelig URL.</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hemmelig URL</p>
                    <code className="block break-all text-xs text-slate-700">
                      {(typeof window === 'undefined' ? '' : window.location.origin) +
                        `/analytics?csp=${encodeURIComponent(selected.projectId)}&share=${encodeURIComponent(
                          sharingToken
                        )}`}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const url =
                          (typeof window === 'undefined' ? '' : window.location.origin) +
                          `/analytics?csp=${encodeURIComponent(selected.projectId)}&share=${encodeURIComponent(
                            sharingToken
                          )}`
                        try {
                          await navigator.clipboard.writeText(url)
                          setCopiedShareUrl(true)
                          window.setTimeout(() => setCopiedShareUrl(false), 1800)
                        } catch {
                          setCopiedShareUrl(false)
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {copiedShareUrl ? 'Kopieret' : 'Kopiér URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSharingToken(makeShareToken())
                        setCopiedShareUrl(false)
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Generér ny hemmelig nøgle
                    </button>
                  </div>
                </div>
              )}
              {sharingMode === 'password' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">Resultater er beskyttet med adgangskode.</p>
                  <label className="block text-sm font-medium text-slate-700">
                    Delingsadgangskode
                    <input
                      type="password"
                      value={sharingPassword}
                      onChange={(e) => setSharingPassword(e.target.value)}
                      placeholder="Indtast adgangskode"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Del denne adgangskode med de personer, der skal have adgang til resultaterne.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-transparent p-6">
              <h4 className="mb-4 font-semibold text-slate-900">Indstillinger</h4>
              <p className="mb-2 text-sm font-medium text-slate-700">Adgang til resultater</p>
              <div className="space-y-3 text-sm text-slate-700">
                {(
                  [
                    { id: 'none', label: 'Del ikke resultater' },
                    { id: 'secret', label: 'Del resultater med hemmelig URL' },
                    { id: 'password', label: 'Del resultater beskyttet med adgangskode' },
                  ] as const
                ).map((opt) => (
                  <label key={opt.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="sharing-mode"
                      checked={sharingMode === opt.id}
                      onChange={() => setSharingMode(opt.id)}
                      className="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    )
  }

  if (scopedProjectId) {
    return (
      <p className="text-sm text-slate-600">
        Ingen kortsortering at vise for dette projekt. Tilføj værktøjet på boardet og gem data.
      </p>
    )
  }

  const maxCards = Math.max(...effectiveData.projects.map((p) => p.cardCount), 1)

  return (
    <div className="space-y-6">
      {showListDemo && (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <span className="font-semibold">Eksempeldata.</span> Listen viser et demo-projekt, indtil du har kortsortering
          i et rigtigt projekt.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Projekter med data</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{effectiveData.summary.projectCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kort i alt</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{effectiveData.summary.totalCards}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kategorier i alt</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{effectiveData.summary.totalCategories}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Kort med indhold pr. projekt
        </p>
        <div className="flex h-40 items-end justify-between gap-2">
          {effectiveData.projects.map((p) => (
            <div key={p.projectId} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full min-h-[8px] rounded-t-md bg-cyan-500"
                style={{ height: `${Math.max((p.cardCount / maxCards) * 100, p.cardCount > 0 ? 12 : 6)}%` }}
              />
              <span className="max-w-full truncate text-center text-[10px] text-slate-600" title={p.projectName}>
                {p.projectName}
              </span>
              <span className="text-xs font-semibold text-cyan-800">{p.cardCount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-semibold">Projekt</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold text-right">Kort</th>
              <th className="px-4 py-3 font-semibold text-right">Svar</th>
              <th className="px-4 py-3 font-semibold text-right">Analytics</th>
            </tr>
          </thead>
          <tbody>
            {effectiveData.projects.map((p) => (
              <tr key={p.projectId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{p.projectName}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{p.mode}</td>
                <td className="px-4 py-3 text-right">{p.cardCount}</td>
                <td className="px-4 py-3 text-right">{p.responseSummary.completed}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.projectId)}
                    className="font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    Åbn overblik →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
