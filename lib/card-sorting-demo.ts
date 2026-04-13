import {
  aggregateLocations,
  quartiles,
  type CardSortResponseRecord,
  type CardSortResponseSessionMeta,
} from '@/lib/card-sorting-analytics'

/** Board-kort (samme id som i DEMO_SORT_SNAPSHOT) til analytics Cards-visning. */
export const DEMO_BOARD_CARDS: { id: string; text: string }[] = [
  { id: 'dc1', text: 'Forside' },
  { id: 'dc2', text: 'Top navigation' },
  { id: 'dc3', text: 'Footer links' },
  { id: 'dc4', text: 'Brødkrummer' },
  { id: 'dc5', text: 'Søgning' },
  { id: 'dc6', text: 'Kurv' },
  { id: 'dc7', text: 'Checkout' },
  { id: 'dc8', text: 'Betalingsmetoder' },
  { id: 'dc9', text: 'Ordrebekræftelse' },
  { id: 'dc10', text: 'Profil' },
  { id: 'dc11', text: 'Notifikationer' },
  { id: 'dc12', text: 'Sprog & region' },
]

const DEMO_SORT_SNAPSHOT: NonNullable<CardSortResponseRecord['sortSnapshot']> = {
  mode: 'open',
  categories: [
    {
      id: 'cat-nav',
      name: 'Navigation',
      cards: [
        { id: 'dc1', text: 'Forside' },
        { id: 'dc2', text: 'Top navigation' },
        { id: 'dc3', text: 'Footer links' },
        { id: 'dc4', text: 'Brødkrummer' },
        { id: 'dc5', text: 'Søgning' },
      ],
    },
    {
      id: 'cat-pay',
      name: 'Betaling',
      cards: [
        { id: 'dc6', text: 'Kurv' },
        { id: 'dc7', text: 'Checkout' },
        { id: 'dc8', text: 'Betalingsmetoder' },
        { id: 'dc9', text: 'Ordrebekræftelse' },
      ],
    },
    {
      id: 'cat-set',
      name: 'Indstillinger',
      cards: [
        { id: 'dc10', text: 'Profil' },
        { id: 'dc11', text: 'Notifikationer' },
        { id: 'dc12', text: 'Sprog & region' },
      ],
    },
  ],
}

const DEMO_SESSION_R1: CardSortResponseSessionMeta = {
  instructionsSeen: 0,
  commentCount: 0,
  device: { type: 'Desktop', vendor: 'Apple', model: 'Macintosh' },
  os: { name: 'OS X', version: '14.2', codename: 'Sonoma' },
  browser: { name: 'Safari', version: '17.2' },
  screen: { width: 1512, height: 982 },
  locationDetail: { city: 'Aarhus', region: 'Central Denmark Region', country: 'Denmark' },
}

const DEMO_SESSION_R2: CardSortResponseSessionMeta = {
  instructionsSeen: 0,
  commentCount: 0,
  device: { type: 'Desktop', vendor: 'Apple', model: 'Macintosh' },
  os: { name: 'OS X', version: '10.15', codename: 'Catalina' },
  browser: { name: 'Firefox', version: '150.0' },
  screen: { width: 1728, height: 1117 },
  locationDetail: { city: 'Charlottenlund', region: 'Capital Region', country: 'Denmark' },
}

export const DEMO_CARD_SORT_PROJECT_ID = '__forgelab_demo_card_sorting__'

type DurationStats = {
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export type CardSortDemoProjectRow = {
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
  responseSummary: {
    totalResponses: number
    completed: number
    abandoned: number
    lastRespondentAt: string | null
    boardUniqueCategories: number
    avgCategoriesPerResponse: number | null
    maxCategoriesPerResponse: number | null
    durationStats: DurationStats | null
    locations: { label: string; count: number; pct: number }[]
  }
  categoryBreakdown: { name: string; count: number }[]
  boardCards: { id: string; text: string }[]
}

function buildResponseSummary(
  responses: CardSortResponseRecord[],
  boardUniqueCategories: number
): CardSortDemoProjectRow['responseSummary'] {
  const completed = responses.filter((r) => !r.abandoned && r.completedAt)
  const abandoned = responses.filter((r) => r.abandoned)
  const durations = completed
    .map((r) => (typeof r.durationSec === 'number' ? r.durationSec : 0))
    .filter((n) => n >= 0)
    .sort((a, b) => a - b)
  const catCounts = completed
    .map((r) => (typeof r.categoryCount === 'number' ? r.categoryCount : 0))
    .filter((n) => n > 0)
  const avgCategories =
    catCounts.length > 0 ? Math.round((catCounts.reduce((a, b) => a + b, 0) / catCounts.length) * 10) / 10 : null
  const maxCategories = catCounts.length > 0 ? Math.max(...catCounts) : null
  const lastAt = completed.map((r) => r.completedAt!).sort().pop() ?? null
  return {
    totalResponses: responses.length,
    completed: completed.length,
    abandoned: abandoned.length,
    lastRespondentAt: lastAt,
    boardUniqueCategories,
    avgCategoriesPerResponse: avgCategories,
    maxCategoriesPerResponse: maxCategories,
    durationStats: quartiles(durations),
    locations: aggregateLocations(responses),
  }
}

/** Demo-svar med sortSnapshot + session (detalje-modal + Card sort-fane). */
export function getDemoCardSortResponses(_reference = new Date()): CardSortResponseRecord[] {
  const t0 = '2026-04-13T10:00:00.000Z'
  const t1a = '2026-04-13T10:00:47.000Z'
  const r2Start = '2026-04-13T18:34:00.000Z'
  const r2End = '2026-04-13T18:34:53.000Z'
  return [
    {
      id: 'demo-respondent-1',
      startedAt: t0,
      completedAt: t1a,
      durationSec: 47,
      abandoned: false,
      categoryCount: 3,
      country: 'Denmark',
      sortSnapshot: DEMO_SORT_SNAPSHOT,
      session: DEMO_SESSION_R1,
    },
    {
      id: 'demo-respondent-2',
      startedAt: r2Start,
      completedAt: r2End,
      durationSec: 53,
      abandoned: false,
      categoryCount: 3,
      country: 'Denmark',
      sortSnapshot: DEMO_SORT_SNAPSHOT,
      session: DEMO_SESSION_R2,
    },
  ]
}

const DEMO_CATEGORY_BREAKDOWN = [
  { name: 'Navigation', count: 5 },
  { name: 'Betaling', count: 4 },
  { name: 'Indstillinger', count: 3 },
]

export function getDemoCardSortProjectRow(reference = new Date()): CardSortDemoProjectRow {
  const dayIso = '2026-04-13T12:00:00.000Z'
  const responses = getDemoCardSortResponses(reference)
  const boardCats = 3
  return {
    projectId: DEMO_CARD_SORT_PROJECT_ID,
    projectName: 'Eksempel: kortsortering',
    updatedAt: dayIso,
    createdAt: dayIso,
    launchedAt: dayIso,
    mode: 'open',
    cardCount: 12,
    categoryCount: 3,
    boardUniqueCategories: boardCats,
    cardsPlacedInCategories: 12,
    unassignedCards: 0,
    responses,
    responseSummary: buildResponseSummary(responses, boardCats),
    categoryBreakdown: DEMO_CATEGORY_BREAKDOWN,
    boardCards: DEMO_BOARD_CARDS,
  }
}

export type DemoCardSortScopeOpts = {
  projectId?: string
  projectName?: string
}

export function getDemoCardSortApiPayload(reference = new Date(), scope?: DemoCardSortScopeOpts) {
  const row = getDemoCardSortProjectRow(reference)
  if (scope?.projectId) {
    row.projectId = scope.projectId
    row.projectName = scope.projectName?.trim() || 'Projekt'
  }
  return {
    projects: [row],
    summary: {
      projectCount: 1,
      totalCards: row.cardCount,
      totalCategories: row.categoryCount,
    },
  }
}

/**
 * Række fra API/panel før merge: samme som demo-rækken, men `responseSummary.totalResponses`
 * kan mangle (Vercel/TS), og `boardCards` kan mangle.
 */
export type CardSortMergeSource = Omit<CardSortDemoProjectRow, 'responses' | 'responseSummary' | 'boardCards'> & {
  responses: CardSortResponseRecord[]
  responseSummary: Omit<CardSortDemoProjectRow['responseSummary'], 'totalResponses'> & {
    totalResponses?: number
  }
  boardCards?: CardSortDemoProjectRow['boardCards']
}

/** Når projektet findes men ingen svar er registreret: vis samme demo-metrics og demo-rækker. */
export function mergeProjectWithResponseDemo(
  project: CardSortMergeSource,
  reference = new Date()
): CardSortDemoProjectRow {
  const responses = getDemoCardSortResponses(reference)
  const boardCats = Math.max(project.boardUniqueCategories || 0, 3)
  return {
    ...project,
    responses,
    responseSummary: buildResponseSummary(responses, boardCats),
    categoryBreakdown: project.categoryBreakdown.some((c) => c.count > 0)
      ? project.categoryBreakdown
      : DEMO_CATEGORY_BREAKDOWN,
    boardCards:
      Array.isArray(project.boardCards) && project.boardCards.length > 0
        ? project.boardCards
        : DEMO_BOARD_CARDS,
  }
}
