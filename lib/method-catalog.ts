import { VAERKTOEJER, type Vaerktoej } from '@/lib/vaerktoejer-data'
import {
  getMethodDiamondClassification,
  methodMatchesDiamondPhaseFilter,
  type MethodDiamondClassification,
  type MethodDiamondPhase,
  type MethodLibraryCategoryId,
} from '@/lib/method-diamond-classification'
import {
  getMethodDesignThinkingClassification,
  methodMatchesDesignThinkingPhaseFilter,
  type MethodDesignThinkingClassification,
  type MethodDesignThinkingPhase,
} from '@/lib/method-design-thinking-classification'

export type { MethodDiamondPhase, MethodLibraryCategoryId, MethodDesignThinkingPhase }

/** Slugs that are standalone utilities, not design methods. */
export const NON_METHOD_SLUGS = new Set(['qr-generator'])

export const METHOD_LIBRARY_CATEGORIES: Array<{ id: MethodLibraryCategoryId; label: string }> = [
  { id: 'research', label: 'Research' },
  { id: 'analyse', label: 'Analyse' },
  { id: 'strategi', label: 'Strategi' },
  { id: 'ideation', label: 'Ideation' },
  { id: 'testing', label: 'Testing' },
  { id: 'planning', label: 'Planning' },
  { id: 'service-design', label: 'Service Design' },
  { id: 'informationsarkitektur', label: 'Informationsarkitektur' },
]

/** Double Diamond + across (metodebibliotek). */
export const METHOD_DIAMOND_PHASES: Array<{ id: MethodDiamondPhase; label: string }> = [
  { id: 'discover', label: 'Discover' },
  { id: 'define', label: 'Define' },
  { id: 'develop', label: 'Develop' },
  { id: 'deliver', label: 'Deliver' },
  { id: 'across', label: 'Across process' },
]

/** Design Thinking + across (metodebibliotek). */
export const METHOD_DESIGN_THINKING_PHASES: Array<{ id: MethodDesignThinkingPhase; label: string }> = [
  { id: 'empathize', label: 'Empathize' },
  { id: 'define', label: 'Define' },
  { id: 'ideate', label: 'Ideate' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'test', label: 'Test' },
  { id: 'across', label: 'Across process' },
]

/** @deprecated Brug METHOD_DIAMOND_PHASES — fire diamantfaser uden across. */
export const DOUBLE_DIAMOND_PHASES = METHOD_DIAMOND_PHASES.filter((p) => p.id !== 'across')

export type MethodCatalogEntry = Vaerktoej & {
  libraryCategory: MethodLibraryCategoryId
  /** Design Thinking-kategori når den afviger fra libraryCategory. */
  designThinkingCategory: MethodLibraryCategoryId
  primaryPhase: MethodDiamondPhase
  secondaryPhases: MethodDiamondPhase[]
  primaryDesignThinkingPhase: MethodDesignThinkingPhase
  secondaryDesignThinkingPhases: MethodDesignThinkingPhase[]
  tags: string[]
  /** Alias for primaryPhase — bagudkompatibilitet. */
  doubleDiamondPhase: MethodDiamondPhase
}

function mergeTags(diamond?: string[], designThinking?: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of [...(diamond ?? []), ...(designThinking ?? [])]) {
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

function buildCatalogEntry(
  tool: Vaerktoej,
  diamond: MethodDiamondClassification,
  designThinking: MethodDesignThinkingClassification
): MethodCatalogEntry {
  const secondaryPhases = diamond.secondaryPhases ?? []
  const secondaryDesignThinkingPhases = designThinking.secondaryPhases ?? []
  return {
    ...tool,
    libraryCategory: diamond.category,
    designThinkingCategory: designThinking.category ?? diamond.category,
    primaryPhase: diamond.primaryPhase,
    secondaryPhases,
    primaryDesignThinkingPhase: designThinking.primaryPhase,
    secondaryDesignThinkingPhases,
    tags: mergeTags(diamond.tags, designThinking.tags),
    doubleDiamondPhase: diamond.primaryPhase,
  }
}

export function getMethodCatalogEntries(): MethodCatalogEntry[] {
  return VAERKTOEJER.filter((t) => !NON_METHOD_SLUGS.has(t.slug)).map((tool) => {
    const diamond = getMethodDiamondClassification(tool.slug)
    const designThinking = getMethodDesignThinkingClassification(tool.slug)
    if (diamond && designThinking) {
      return buildCatalogEntry(tool, diamond, designThinking)
    }
    const fallbackDiamond: MethodDiamondClassification = diamond ?? {
      primaryPhase: 'develop',
      category: 'ideation',
    }
    const fallbackDt: MethodDesignThinkingClassification = designThinking ?? {
      primaryPhase: 'ideate',
      category: fallbackDiamond.category,
    }
    return buildCatalogEntry(tool, fallbackDiamond, fallbackDt)
  })
}

export function getMethodCatalogEntry(slug: string): MethodCatalogEntry | undefined {
  return getMethodCatalogEntries().find((m) => m.slug === slug)
}

export function getMethodPhaseLabel(phase: MethodDiamondPhase): string {
  return METHOD_DIAMOND_PHASES.find((p) => p.id === phase)?.label ?? phase
}

export function getMethodDesignThinkingPhaseLabel(phase: MethodDesignThinkingPhase): string {
  return METHOD_DESIGN_THINKING_PHASES.find((p) => p.id === phase)?.label ?? phase
}

export function getSecondaryPhaseLabels(phases: MethodDiamondPhase[]): string[] {
  return phases.map(getMethodPhaseLabel)
}

export function getSecondaryDesignThinkingPhaseLabels(phases: MethodDesignThinkingPhase[]): string[] {
  return phases.map(getMethodDesignThinkingPhaseLabel)
}

export function getCategoryLabel(categoryId: MethodLibraryCategoryId): string {
  return METHOD_LIBRARY_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}

/** Metode-side med forklarende tekst. */
export function getMethodPageHref(slug: string): string {
  return `/metodebibliotek/${slug}`
}

/** Værktøj i ForgeLab (åbnes fra metodesiden). */
export function getMethodToolHref(slug: string): string {
  return `/tools/${slug}`
}

export function getAllMethodSlugs(): string[] {
  return getMethodCatalogEntries().map((m) => m.slug)
}

/** CTA på metodeoversigt og -kort. */
export function getMethodListCtaLabel(): string {
  return 'Læs om metoden'
}

/** Ofte brugte metoder til "Start her"-sektionen (kun eksisterende slugs). */
export const START_HERE_SLUGS = [
  'service-blueprint',
  'persona-canvas',
  'value-proposition-canvas',
  'swot-generator',
  'survey-template',
  'business-model-canvas',
] as const

export function getStartHereMethods(): MethodCatalogEntry[] {
  return START_HERE_SLUGS.map((slug) => getMethodCatalogEntry(slug)).filter(
    (m): m is MethodCatalogEntry => !!m
  )
}

/** CTA-label baseret på om værktøjet er standalone eller projekt-metode. */
export function getMethodCtaLabel(slug: string): string {
  if (NON_METHOD_SLUGS.has(slug)) return 'Åbn værktøj'
  return 'Brug metode'
}

/** Valgfri kort hint — kun hvor vi har eksplicit mapping (ingen fake tools). */
const METHOD_USAGE_HINTS: Partial<Record<string, string>> = {
  'survey-template': 'Indsamling af struktureret feedback',
  'persona-canvas': 'Konkret målgruppeprofil til designbeslutninger',
  'empathy-map': 'Empati og brugerforståelse i workshops',
  'service-blueprint': 'End-to-end service på tværs af teams',
  'value-proposition-canvas': 'Match mellem kundebehov og værditilbud',
  'swot-generator': 'Strategisk overblik før beslutninger',
  'business-model-canvas': 'Forretningsmodel på én side',
  kanban: 'Visuelt overblik over opgaver og flow',
  'gantt-chart': 'Tidsplan og milepæle',
  brainstorming: 'Hurtig idégenerering i team',
  'card-sorting': 'Informationsarkitektur og navigation',
  'ab-test': 'Sammenlign varianter med reelle stemmer',
}

export function getMethodUsageHint(slug: string): string | undefined {
  return METHOD_USAGE_HINTS[slug]
}

/** Double Diamond-fasefilter (primær + sekundær). */
export function methodMatchesDiamondPhase(entry: MethodCatalogEntry, phase: MethodDiamondPhase): boolean {
  const classification = getMethodDiamondClassification(entry.slug)
  if (!classification) return entry.primaryPhase === phase
  return methodMatchesDiamondPhaseFilter(classification, phase)
}

/** Design Thinking-fasefilter (primær + sekundær). */
export function methodMatchesDesignThinkingPhase(
  entry: MethodCatalogEntry,
  phase: MethodDesignThinkingPhase
): boolean {
  const classification = getMethodDesignThinkingClassification(entry.slug)
  if (!classification) return entry.primaryDesignThinkingPhase === phase
  return methodMatchesDesignThinkingPhaseFilter(classification, phase)
}

export function methodMatchesSearch(entry: MethodCatalogEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const diamondPhaseLabels = [entry.primaryPhase, ...entry.secondaryPhases].map((p) =>
    getMethodPhaseLabel(p).toLowerCase()
  )
  const dtPhaseLabels = [entry.primaryDesignThinkingPhase, ...entry.secondaryDesignThinkingPhases].map(
    (p) => getMethodDesignThinkingPhaseLabel(p).toLowerCase()
  )
  const categoryLabel = getCategoryLabel(entry.libraryCategory).toLowerCase()
  const dtCategoryLabel = getCategoryLabel(entry.designThinkingCategory).toLowerCase()

  return (
    entry.title.toLowerCase().includes(q) ||
    entry.shortDescription.toLowerCase().includes(q) ||
    diamondPhaseLabels.some((l) => l.includes(q)) ||
    dtPhaseLabels.some((l) => l.includes(q)) ||
    categoryLabel.includes(q) ||
    dtCategoryLabel.includes(q) ||
    entry.libraryCategory.toLowerCase().includes(q) ||
    entry.tags.some((t) => t.toLowerCase().includes(q)) ||
    entry.primaryPhase.toLowerCase().includes(q) ||
    entry.primaryDesignThinkingPhase.toLowerCase().includes(q)
  )
}
