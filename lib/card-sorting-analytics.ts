/**
 * Del af kortsorterings-JSON i project_tool_data + afledte analytics.
 */

export type CardSortMeta = {
  createdAt?: string
  launchedAt?: string
}

/** Kategorier som respondenten afleverede (kort med tekst). */
export type CardSortResponseCategorySnapshot = {
  id?: string
  name: string
  cards: { id: string; text: string }[]
}

export type CardSortResponseSessionMeta = {
  instructionsSeen?: number
  commentCount?: number
  device?: { type?: string; vendor?: string; model?: string }
  os?: { name?: string; version?: string; codename?: string }
  browser?: { name?: string; version?: string }
  screen?: { width?: number; height?: number }
  /** By, region, land — detaljeret lokation */
  locationDetail?: { city?: string; region?: string; country?: string }
}

export type CardSortResponseRecord = {
  id: string
  startedAt: string
  completedAt?: string
  durationSec?: number
  abandoned?: boolean
  categoryCount?: number
  country?: string
  /** Fuld kortsortering ved afslutning */
  sortSnapshot?: {
    mode?: string
    categories: CardSortResponseCategorySnapshot[]
  }
  session?: CardSortResponseSessionMeta
}

export type CardSortingToolData = {
  mode?: string
  cards?: Array<{ id?: string; text?: string }>
  categories?: Array<{ id?: string; name?: string; cards?: string[] }>
  meta?: CardSortMeta
  responses?: CardSortResponseRecord[]
}

function parseCategorySnapshot(raw: unknown): CardSortResponseCategorySnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  const name = typeof c.name === 'string' ? c.name : ''
  const id = typeof c.id === 'string' ? c.id : undefined
  const cardsRaw = c.cards
  const cards: { id: string; text: string }[] = []
  if (Array.isArray(cardsRaw)) {
    for (const x of cardsRaw) {
      if (!x || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      const cid = typeof o.id === 'string' ? o.id : ''
      const text = typeof o.text === 'string' ? o.text : ''
      if (cid) cards.push({ id: cid, text })
    }
  }
  return { id, name, cards }
}

function parseSortSnapshot(raw: unknown): CardSortResponseRecord['sortSnapshot'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  const mode = typeof s.mode === 'string' ? s.mode : undefined
  const catsRaw = s.categories
  const categories: CardSortResponseCategorySnapshot[] = []
  if (Array.isArray(catsRaw)) {
    for (const x of catsRaw) {
      const p = parseCategorySnapshot(x)
      if (p) categories.push(p)
    }
  }
  return { mode, categories }
}

function parseSessionMeta(raw: unknown): CardSortResponseSessionMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  const pickNum = (k: string) =>
    typeof s[k] === 'number' && Number.isFinite(s[k]) ? (s[k] as number) : undefined
  const dev = s.device && typeof s.device === 'object' ? (s.device as Record<string, unknown>) : null
  const os = s.os && typeof s.os === 'object' ? (s.os as Record<string, unknown>) : null
  const br = s.browser && typeof s.browser === 'object' ? (s.browser as Record<string, unknown>) : null
  const scr = s.screen && typeof s.screen === 'object' ? (s.screen as Record<string, unknown>) : null
  const loc = s.locationDetail && typeof s.locationDetail === 'object' ? (s.locationDetail as Record<string, unknown>) : null
  return {
    instructionsSeen: pickNum('instructionsSeen'),
    commentCount: pickNum('commentCount'),
    device: dev
      ? {
          type: typeof dev.type === 'string' ? dev.type : undefined,
          vendor: typeof dev.vendor === 'string' ? dev.vendor : undefined,
          model: typeof dev.model === 'string' ? dev.model : undefined,
        }
      : undefined,
    os: os
      ? {
          name: typeof os.name === 'string' ? os.name : undefined,
          version: typeof os.version === 'string' ? os.version : undefined,
          codename: typeof os.codename === 'string' ? os.codename : undefined,
        }
      : undefined,
    browser: br
      ? {
          name: typeof br.name === 'string' ? br.name : undefined,
          version: typeof br.version === 'string' ? br.version : undefined,
        }
      : undefined,
    screen: scr
      ? {
          width: typeof scr.width === 'number' ? scr.width : undefined,
          height: typeof scr.height === 'number' ? scr.height : undefined,
        }
      : undefined,
    locationDetail: loc
      ? {
          city: typeof loc.city === 'string' ? loc.city : undefined,
          region: typeof loc.region === 'string' ? loc.region : undefined,
          country: typeof loc.country === 'string' ? loc.country : undefined,
        }
      : undefined,
  }
}

export function parseCardSortingResponses(raw: unknown): CardSortResponseRecord[] {
  if (!Array.isArray(raw)) return []
  const out: CardSortResponseRecord[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : null
    if (!id) continue
    out.push({
      id,
      startedAt: typeof o.startedAt === 'string' ? o.startedAt : new Date().toISOString(),
      completedAt: typeof o.completedAt === 'string' ? o.completedAt : undefined,
      durationSec: typeof o.durationSec === 'number' && Number.isFinite(o.durationSec) ? o.durationSec : undefined,
      abandoned: Boolean(o.abandoned),
      categoryCount: typeof o.categoryCount === 'number' && Number.isFinite(o.categoryCount) ? o.categoryCount : undefined,
      country: typeof o.country === 'string' ? o.country : undefined,
      sortSnapshot: parseSortSnapshot(o.sortSnapshot),
      session: parseSessionMeta(o.session),
    })
  }
  return out
}

export function quartiles(sortedAsc: number[]): {
  min: number
  q1: number
  median: number
  q3: number
  max: number
} | null {
  if (sortedAsc.length === 0) return null
  const n = sortedAsc.length
  const pick = (p: number) => {
    const idx = (n - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sortedAsc[lo]
    return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo)
  }
  return {
    min: sortedAsc[0],
    q1: pick(0.25),
    median: pick(0.5),
    q3: pick(0.75),
    max: sortedAsc[n - 1],
  }
}

export function aggregateLocations(responses: CardSortResponseRecord[]): { label: string; count: number; pct: number }[] {
  const completed = responses.filter((r) => !r.abandoned && r.completedAt)
  if (completed.length === 0) return []
  const map = new Map<string, number>()
  for (const r of completed) {
    const label =
      (r.session?.locationDetail?.country && r.session.locationDetail.country.trim()) ||
      (r.country && r.country.trim()) ||
      'Unknown'
    map.set(label, (map.get(label) || 0) + 1)
  }
  const total = completed.length
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function formatDurationShort(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

/** Fx 47s (0.78m) — minutter med to decimaler som i reference-dashboards */
export function formatSecondsWithDecimalMinutes(sec: number): string {
  const s = Math.round(sec)
  const min = s / 60
  const minStr = min.toFixed(2)
  return `${s}s (${minStr}m)`
}

/** Per category: how often a card was placed there (across completed responses) and mean stack position (1-based). */
export type CardSortAnalysisCategoryRow = {
  categoryName: string
  frequency: number
  avgPosition: number
}

export type CardSortAnalysisCardRow = {
  cardId: string
  cardLabel: string
  /** Distinct category names this card appeared in across respondents. */
  uniqueCategoryCount: number
  byCategory: CardSortAnalysisCategoryRow[]
}

/**
 * Aggregate card → categories from stored `sortSnapshot`s (completed sessions only).
 * `boardCards` defines display order and includes cards with no placements yet.
 */
export function aggregateCardsAnalysisByCard(
  responses: CardSortResponseRecord[],
  boardCards: { id: string; text: string }[] = []
): CardSortAnalysisCardRow[] {
  const usable = responses.filter((r) => !r.abandoned && r.completedAt && r.sortSnapshot?.categories?.length)

  const byCard = new Map<string, { label: string; byCat: Map<string, number[]> }>()

  for (const r of usable) {
    const cats = r.sortSnapshot!.categories
    for (const cat of cats) {
      const catName = (cat.name || '').trim() || 'Untitled'
      const list = cat.cards || []
      list.forEach((entry, idx) => {
        const id = typeof entry.id === 'string' ? entry.id : ''
        if (!id) return
        const label = (entry.text || '').trim() || id
        const pos = idx + 1
        let rec = byCard.get(id)
        if (!rec) {
          rec = { label, byCat: new Map() }
          byCard.set(id, rec)
        }
        if (label) rec.label = label
        const arr = rec.byCat.get(catName) ?? []
        arr.push(pos)
        rec.byCat.set(catName, arr)
      })
    }
  }

  const toRow = (cardId: string): CardSortAnalysisCardRow => {
    const rec = byCard.get(cardId)
    const boardLabel = boardCards.find((c) => c.id === cardId)?.text?.trim()
    const label = boardLabel || rec?.label || cardId
    const byCat = rec?.byCat ?? new Map<string, number[]>()
    const byCategory: CardSortAnalysisCategoryRow[] = Array.from(byCat.entries()).map(
      ([categoryName, positions]) => ({
        categoryName,
        frequency: positions.length,
        avgPosition: positions.reduce((x, y) => x + y, 0) / positions.length,
      })
    )
    byCategory.sort(
      (a: CardSortAnalysisCategoryRow, b: CardSortAnalysisCategoryRow) =>
        b.frequency - a.frequency ||
        a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: 'base' })
    )
    return {
      cardId,
      cardLabel: label,
      uniqueCategoryCount: byCategory.length,
      byCategory,
    }
  }

  const orderedIds: string[] = []
  const seen = new Set<string>()
  for (const c of boardCards) {
    if (c.id && !seen.has(c.id)) {
      orderedIds.push(c.id)
      seen.add(c.id)
    }
  }
  const extras = Array.from(byCard.keys())
    .filter((id) => !seen.has(id))
    .sort((a, b) => {
      const la = byCard.get(a)?.label || a
      const lb = byCard.get(b)?.label || b
      return la.localeCompare(lb, undefined, { sensitivity: 'base' })
    })
  orderedIds.push(...extras)

  if (orderedIds.length === 0) {
    return []
  }

  return orderedIds.map(toRow)
}

function jaccardSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let inter = 0
  for (const x of Array.from(a)) {
    if (b.has(x)) inter += 1
  }
  const uni = a.size + b.size - inter
  return uni === 0 ? 0 : inter / uni
}

/** Cards listed under one category name (across respondents). */
export type CategoryAnalysisCardRow = {
  cardId: string
  cardLabel: string
  frequency: number
  avgPosition: number
}

/** One respondent-created category (merged by name) with consensus metrics. */
export type CategoryAnalysisRow = {
  /** Stable key (= normalized display name). */
  categoryKey: string
  categoryName: string
  uniqueCardCount: number
  /** Mean pairwise Jaccard between respondents’ card sets in this category (0–100, one decimal). */
  agreementPct: number
  respondentCount: number
  cards: CategoryAnalysisCardRow[]
}

/**
 * Aggregate category → cards from `sortSnapshot`s. Same category name in one session is merged in order.
 * Agreement = average Jaccard similarity between each pair of respondents’ sets of cards in that category.
 */
export function aggregateCategoriesAnalysisByCategory(
  responses: CardSortResponseRecord[],
  boardCards: { id: string; text: string }[] = []
): CategoryAnalysisRow[] {
  const usable = responses.filter((r) => !r.abandoned && r.completedAt && r.sortSnapshot?.categories?.length)

  const labelById = new Map<string, string>()
  for (const c of boardCards) {
    if (c.id) labelById.set(c.id, (c.text || '').trim() || c.id)
  }

  /** categoryName -> responseId -> (cardId -> 1-based position, first occurrence in merged pile) */
  const perCat = new Map<string, Map<string, Map<string, number>>>()

  for (const r of usable) {
    const groups = new Map<string, { cards: { id: string; text: string }[] }>()
    for (const cat of r.sortSnapshot!.categories) {
      const n = (cat.name || '').trim() || 'Untitled'
      const g = groups.get(n) ?? { cards: [] }
      for (const entry of cat.cards || []) {
        const id = typeof entry.id === 'string' ? entry.id : ''
        if (!id) continue
        g.cards.push({ id, text: (entry.text || '').trim() || id })
      }
      groups.set(n, g)
    }

    for (const [catName, g] of Array.from(groups.entries())) {
      if (g.cards.length === 0) continue
      const posByCard = new Map<string, number>()
      g.cards.forEach((c: { id: string; text: string }, idx: number) => {
        if (!posByCard.has(c.id)) posByCard.set(c.id, idx + 1)
        if (!labelById.has(c.id)) labelById.set(c.id, c.text)
      })
      let byResp = perCat.get(catName)
      if (!byResp) {
        byResp = new Map()
        perCat.set(catName, byResp)
      }
      byResp.set(r.id, posByCard)
    }
  }

  const rows: CategoryAnalysisRow[] = []

  for (const [categoryName, byResp] of Array.from(perCat.entries())) {
    const respondentCount = byResp.size
    const union = new Set<string>()
    for (const m of Array.from(byResp.values())) {
      for (const id of Array.from(m.keys())) {
        union.add(id)
      }
    }
    const uniqueCardCount = union.size

    let agreementPct = 100
    if (respondentCount >= 2) {
      const respIds = Array.from(byResp.keys())
      let pairSum = 0
      let pairCount = 0
      for (let i = 0; i < respIds.length; i += 1) {
        for (let j = i + 1; j < respIds.length; j += 1) {
          const mi = byResp.get(respIds[i])
          const mj = byResp.get(respIds[j])
          if (!mi || !mj) continue
          const setI = new Set<string>(Array.from(mi.keys()))
          const setJ = new Set<string>(Array.from(mj.keys()))
          pairSum += jaccardSets(setI, setJ)
          pairCount += 1
        }
      }
      agreementPct = pairCount > 0 ? Math.round((pairSum / pairCount) * 1000) / 10 : 100
    }

    const cards: CategoryAnalysisCardRow[] = []
    for (const cardId of Array.from(union)) {
      const positions: number[] = []
      for (const m of Array.from(byResp.values())) {
        const p = m.get(cardId)
        if (typeof p === 'number') positions.push(p)
      }
      cards.push({
        cardId,
        cardLabel: labelById.get(cardId) || cardId,
        frequency: positions.length,
        avgPosition: positions.length > 0 ? positions.reduce((x, y) => x + y, 0) / positions.length : 0,
      })
    }
    cards.sort(
      (a, b) =>
        b.frequency - a.frequency ||
        a.cardLabel.localeCompare(b.cardLabel, undefined, { sensitivity: 'base' })
    )

    rows.push({
      categoryKey: categoryName,
      categoryName,
      uniqueCardCount,
      agreementPct,
      respondentCount,
      cards,
    })
  }

  rows.sort(
    (a, b) =>
      b.uniqueCardCount - a.uniqueCardCount ||
      a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: 'base' })
  )

  return rows
}

export type StandardizationGridRow = {
  cardId: string
  cardLabel: string
  /** Respondents who placed this card in each category (by normalized name). */
  countByCategory: Record<string, number>
  /** Respondents whose snapshot does not contain this card in any category. */
  notStandardizedCount: number
}

export type StandardizationGridResult = {
  totalRespondents: number
  categoryNames: string[]
  rows: StandardizationGridRow[]
}

/** Column header for “card missing from all piles” counts. */
export const STANDARDIZATION_GRID_NOT_PLACED_LABEL = 'Not standardized'

/**
 * Matrix: cards × categories — cell = number of respondents who put that card in that category.
 * Last column conceptually is “not in any category” for that respondent.
 */
export function aggregateStandardizationGrid(
  responses: CardSortResponseRecord[],
  boardCards: { id: string; text: string }[] = []
): StandardizationGridResult {
  const usable = responses.filter((r) => !r.abandoned && r.completedAt && r.sortSnapshot?.categories?.length)
  const totalRespondents = usable.length

  const labelById = new Map<string, string>()
  for (const c of boardCards) {
    if (c.id) labelById.set(c.id, (c.text || '').trim() || c.id)
  }

  const allCategories = new Set<string>()
  const perResponse: Map<string, Set<string>>[] = []

  for (const r of usable) {
    const cardToCats = new Map<string, Set<string>>()
    for (const cat of r.sortSnapshot!.categories) {
      const catName = (cat.name || '').trim() || 'Untitled'
      const list = cat.cards || []
      if (list.length === 0) continue
      allCategories.add(catName)
      for (const entry of list) {
        const id = typeof entry.id === 'string' ? entry.id : ''
        if (!id) continue
        if (!labelById.has(id)) labelById.set(id, (entry.text || '').trim() || id)
        let s = cardToCats.get(id)
        if (!s) {
          s = new Set()
          cardToCats.set(id, s)
        }
        s.add(catName)
      }
    }
    perResponse.push(cardToCats)
  }

  const categoryNames = Array.from(allCategories).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )

  const orderedCardIds: string[] = []
  const seenIds = new Set<string>()
  for (const c of boardCards) {
    if (c.id && !seenIds.has(c.id)) {
      orderedCardIds.push(c.id)
      seenIds.add(c.id)
    }
  }

  const extraIds = new Set<string>()
  for (const m of perResponse) {
    for (const id of Array.from(m.keys())) {
      if (!seenIds.has(id)) extraIds.add(id)
    }
  }
  const sortedExtra = Array.from(extraIds).sort((a, b) =>
    (labelById.get(a) || a).localeCompare(labelById.get(b) || b, undefined, { sensitivity: 'base' })
  )
  orderedCardIds.push(...sortedExtra)

  const countInCategory = (cardId: string, catName: string): number => {
    let n = 0
    for (const m of perResponse) {
      const cats = m.get(cardId)
      if (cats && cats.has(catName)) n += 1
    }
    return n
  }

  const countNotInAny = (cardId: string): number => {
    let n = 0
    for (const m of perResponse) {
      const cats = m.get(cardId)
      if (!cats || cats.size === 0) n += 1
    }
    return n
  }

  const rows: StandardizationGridRow[] = orderedCardIds.map((cardId) => {
    const countByCategory: Record<string, number> = {}
    for (const cn of categoryNames) {
      countByCategory[cn] = countInCategory(cardId, cn)
    }
    return {
      cardId,
      cardLabel: labelById.get(cardId) || cardId,
      countByCategory,
      notStandardizedCount: countNotInAny(cardId),
    }
  })

  return {
    totalRespondents,
    categoryNames,
    rows,
  }
}

function cardsShareCategoryInResponse(r: CardSortResponseRecord, idA: string, idB: string): boolean {
  const snap = r.sortSnapshot
  if (!snap?.categories?.length) return false
  for (const cat of snap.categories) {
    const ids = new Set<string>()
    for (const entry of cat.cards || []) {
      const id = typeof entry.id === 'string' ? entry.id : ''
      if (id) ids.add(id)
    }
    if (ids.has(idA) && ids.has(idB)) return true
  }
  return false
}

export type SimilarityMatrixResult = {
  totalRespondents: number
  cardIds: string[]
  cardLabels: string[]
  /**
   * Row index i (0-based card index): `lowerTriPct[i][j]` = % of respondents who placed cards i and j
   * in the same category, for j = 0 .. i-1 only.
   */
  lowerTriPct: number[][]
}

/**
 * Lower-triangle similarity: % of completed respondents who put both cards in at least one common category.
 */
export function aggregateSimilarityMatrix(
  responses: CardSortResponseRecord[],
  boardCards: { id: string; text: string }[] = []
): SimilarityMatrixResult {
  const usable = responses.filter((r) => !r.abandoned && r.completedAt && r.sortSnapshot?.categories?.length)
  const totalRespondents = usable.length

  const labelById = new Map<string, string>()
  for (const c of boardCards) {
    if (c.id) labelById.set(c.id, (c.text || '').trim() || c.id)
  }

  for (const r of usable) {
    for (const cat of r.sortSnapshot!.categories) {
      for (const entry of cat.cards || []) {
        const id = typeof entry.id === 'string' ? entry.id : ''
        if (!id) continue
        if (!labelById.has(id)) labelById.set(id, (entry.text || '').trim() || id)
      }
    }
  }

  const orderedCardIds: string[] = []
  const seenIds = new Set<string>()
  for (const c of boardCards) {
    if (c.id && !seenIds.has(c.id)) {
      orderedCardIds.push(c.id)
      seenIds.add(c.id)
    }
  }

  const extraIds = new Set<string>()
  for (const r of usable) {
    for (const cat of r.sortSnapshot!.categories) {
      for (const entry of cat.cards || []) {
        const id = typeof entry.id === 'string' ? entry.id : ''
        if (id && !seenIds.has(id)) extraIds.add(id)
      }
    }
  }
  const sortedExtra = Array.from(extraIds).sort((a, b) =>
    (labelById.get(a) || a).localeCompare(labelById.get(b) || b, undefined, { sensitivity: 'base' })
  )
  orderedCardIds.push(...sortedExtra)

  const n = orderedCardIds.length
  const lowerTriPct: number[][] = []

  for (let i = 0; i < n; i += 1) {
    const row: number[] = []
    for (let j = 0; j < i; j += 1) {
      const idA = orderedCardIds[i]!
      const idB = orderedCardIds[j]!
      let together = 0
      for (const r of usable) {
        if (cardsShareCategoryInResponse(r, idA, idB)) together += 1
      }
      row.push(totalRespondents === 0 ? 0 : Math.round((100 * together) / totalRespondents))
    }
    lowerTriPct.push(row)
  }

  const cardLabels = orderedCardIds.map((id) => labelById.get(id) || id)

  return {
    totalRespondents,
    cardIds: orderedCardIds,
    cardLabels,
    lowerTriPct,
  }
}
