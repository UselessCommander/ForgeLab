import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Handshake,
  RefreshCw,
  Swords,
  Truck,
  UserPlus,
  Users,
  Grid2X2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import type { MethodCatalogEntry } from '@/lib/method-catalog'
import {
  METHOD_LIBRARY_CATEGORIES,
  getMethodDesignThinkingPhaseLabel,
  getMethodPhaseLabel,
  getSecondaryDesignThinkingPhaseLabels,
  getSecondaryPhaseLabels,
} from '@/lib/method-catalog'
import type { MethodContentSection, MethodPageContent } from '@/lib/method-content'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

export type MethodAccentTheme = {
  iconBg: string
  iconText: string
  heroGlow: string
  heroGrid: string
  badge: string
  badgeMuted: string
  ring: string
  softPanel: string
  stepActive: string
  calloutDefault: string
  calloutHighlight: string
  calloutExample: string
  calloutCaution: string
}

export type MethodVisualCard = {
  id: string
  title: string
  label: string
  icon?: LucideIcon
  imageSrc?: string
  imageAlt?: string
}

export type MethodStep = {
  title: string
  description: string
}

export type MethodTocItem = {
  id: string
  label: string
}

export type MethodPageUiConfig = {
  extraBadges?: string[]
  /** Erstat standard hero-illustration (fx /metoder/[slug]/hero.webp) */
  heroImageSrc?: string
  heroImageAlt?: string
  visualCards?: MethodVisualCard[]
  /** Vis kort efter denne sektions-id */
  visualCardsAfterSectionId?: string
  steps?: MethodStep[]
  /** Eksplicit callout pr. sektions-id (fremhæver uden at erstatte brødtekst) */
  sectionCallouts?: Partial<Record<string, string>>
  quote?: string
}

const DEFAULT_ACCENT: MethodAccentTheme = {
  iconBg: 'bg-violet-50',
  iconText: 'text-violet-600',
  heroGlow: 'from-violet-100/70 via-amber-50/40 to-white',
  heroGrid: 'rgba(124, 58, 237, 0.06)',
  badge: 'bg-amber-50 text-amber-900 border-amber-200/70',
  badgeMuted: 'bg-gray-50 text-gray-700 border-gray-200/80',
  ring: 'ring-violet-200/50',
  softPanel: 'bg-gradient-to-br from-white via-violet-50/20 to-amber-50/30',
  stepActive: 'border-violet-300 bg-violet-50/50',
  calloutDefault: 'border-gray-200/80 bg-gray-50/80 text-gray-700',
  calloutHighlight: 'border-amber-200/70 bg-amber-50/60 text-amber-950',
  calloutExample: 'border-violet-200/60 bg-violet-50/40 text-violet-950',
  calloutCaution: 'border-rose-200/60 bg-rose-50/40 text-rose-950',
}

const ACCENT_BY_SLUG: Partial<Record<string, Partial<MethodAccentTheme>>> = {
  'porters-five-forces': {
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    heroGlow: 'from-indigo-100/80 via-slate-50 to-white',
    heroGrid: 'rgba(79, 70, 229, 0.07)',
    badge: 'bg-indigo-50 text-indigo-900 border-indigo-200/70',
    ring: 'ring-indigo-200/50',
    softPanel: 'bg-gradient-to-br from-white via-indigo-50/30 to-slate-50',
    stepActive: 'border-indigo-300 bg-indigo-50/50',
  },
  'swot-generator': {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    heroGlow: 'from-emerald-100/70 via-white to-amber-50/30',
    heroGrid: 'rgba(16, 185, 129, 0.06)',
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200/70',
    ring: 'ring-emerald-200/50',
    stepActive: 'border-emerald-300 bg-emerald-50/50',
  },
  'ab-test': {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    heroGlow: 'from-violet-100/80 via-fuchsia-50/30 to-white',
    heroGrid: 'rgba(139, 92, 246, 0.07)',
  },
  pestel: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-700',
    heroGlow: 'from-blue-100/70 via-sky-50/50 to-white',
    heroGrid: 'rgba(37, 99, 235, 0.06)',
    badge: 'bg-blue-50 text-blue-900 border-blue-200/70',
  },
}

const UI_CONFIG: Partial<Record<string, MethodPageUiConfig>> = {
  'porters-five-forces': {
    extraBadges: ['Strategi', 'Analysemodel', 'Brancheanalyse'],
    visualCardsAfterSectionId: 'what',
    visualCards: [
      { id: 'rivalry', title: 'Rivalisering', label: 'Eksisterende konkurrenter', icon: Swords },
      { id: 'new-entrants', title: 'Nye indtrængere', label: 'Truslen fra nye aktører', icon: UserPlus },
      { id: 'substitutes', title: 'Substitutter', label: 'Alternative løsninger', icon: RefreshCw },
      { id: 'buyers', title: 'Kunder', label: 'Købernes forhandlingsstyrke', icon: Handshake },
      { id: 'suppliers', title: 'Leverandører', label: 'Leverandørernes forhandlingsstyrke', icon: Truck },
    ],
  },
  'swot-generator': {
    extraBadges: ['Strategi', 'Analysemodel'],
    visualCardsAfterSectionId: 'what',
    visualCards: [
      { id: 's', title: 'Styrker', label: 'Strengths', icon: TrendingUp },
      { id: 'w', title: 'Svagheder', label: 'Weaknesses', icon: TrendingDown },
      { id: 'o', title: 'Muligheder', label: 'Opportunities', icon: Sparkles },
      { id: 't', title: 'Trusler', label: 'Threats', icon: AlertTriangle },
    ],
  },
  'pirate-funnel': {
    extraBadges: ['Vækst', 'Analysemodel'],
    visualCardsAfterSectionId: 'what',
    visualCards: [
      { id: 'a1', title: 'Acquisition', label: 'Opdagelse', icon: Users },
      { id: 'a2', title: 'Activation', label: 'Første oplevelse', icon: Sparkles },
      { id: 'a3', title: 'Retention', label: 'Gentagen brug', icon: RefreshCw },
      { id: 'a4', title: 'Revenue', label: 'Økonomisk værdi', icon: TrendingUp },
      { id: 'a5', title: 'Referral', label: 'Anbefaling', icon: UserPlus },
    ],
  },
  pestel: {
    extraBadges: ['Strategi', 'Omverdensanalyse'],
    visualCardsAfterSectionId: 'what',
    visualCards: [
      { id: 'p', title: 'Political', label: 'Politiske forhold', icon: Building2 },
      { id: 'e', title: 'Economic', label: 'Økonomiske forhold', icon: TrendingUp },
      { id: 's', title: 'Social', label: 'Sociale forhold', icon: Users },
      { id: 't', title: 'Technological', label: 'Teknologiske forhold', icon: Grid2X2 },
      { id: 'en', title: 'Environmental', label: 'Miljømæssige forhold', icon: Sparkles },
      { id: 'l', title: 'Legal', label: 'Juridiske forhold', icon: Shield },
    ],
  },
  'business-model-canvas': {
    extraBadges: ['Strategi', 'Forretningsmodel'],
  },
}

/** Auto-callout: første sætning fra visse sektionstyper */
function autoCallout(section: MethodContentSection): string | undefined {
  if (section.variant === 'highlight' || section.variant === 'example' || section.variant === 'caution') {
    const m = section.body.match(/^(.+?[.!?])(?:\s|$)/)
    if (m?.[1] && m[1].length < 220) return m[1].trim()
  }
  return undefined
}

/** Del proces-tekst i trin uden at forkorte — hvert afsnit bliver et trin */
export function deriveStepsFromProcessSection(sections: MethodContentSection[]): MethodStep[] {
  const process = sections.find((s) => s.id === 'process')
  if (!process?.body) return []

  const blocks = process.body.split(/\n\n+/).filter((b) => b.trim().length > 0)
  if (blocks.length <= 1) {
    const sentences = process.body.match(/[^.!?]+[.!?]+/g)
    if (!sentences || sentences.length < 2) {
      return [{ title: 'Typisk proces', description: process.body }]
    }
    return sentences.slice(0, 5).map((s, i) => ({
      title: `Trin ${i + 1}`,
      description: s.trim(),
    }))
  }

  return blocks.slice(0, 5).map((block, i) => {
    const firstLine = block.split('\n')[0]?.trim() ?? `Trin ${i + 1}`
    const title =
      firstLine.length < 60 && !firstLine.endsWith('.') ? firstLine.replace(/:$/, '') : `Trin ${i + 1}`
    return { title, description: block.trim() }
  })
}

export function getMethodAccentTheme(slug: string): MethodAccentTheme {
  const { bg, text } = getToolIcon(slug)
  const overrides = ACCENT_BY_SLUG[slug] ?? {}
  return {
    ...DEFAULT_ACCENT,
    iconBg: bg,
    iconText: text,
    ...overrides,
  }
}

export function getMethodPageUiConfig(slug: string): MethodPageUiConfig {
  return UI_CONFIG[slug] ?? {}
}

export function buildMethodToc(content: MethodPageContent): MethodTocItem[] {
  const items: MethodTocItem[] = []
  if (content.summary) {
    items.push({ id: 'kort-beskrivelse', label: 'Kort beskrivelse' })
  }
  items.push({ id: 'sadan-bruger-du', label: 'Sådan bruger du metoden' })
  for (const section of content.sections) {
    items.push({ id: section.id, label: section.title })
  }
  items.push({ id: 'relaterede-metoder', label: 'Relaterede metoder' })
  items.push({ id: 'naeste-skridt', label: 'Næste skridt' })
  return items
}

export function getSectionCallout(
  section: MethodContentSection,
  config: MethodPageUiConfig
): string | undefined {
  return config.sectionCallouts?.[section.id] ?? autoCallout(section)
}

export type MethodPageUiBundle = {
  accent: MethodAccentTheme
  config: MethodPageUiConfig
  toc: MethodTocItem[]
  steps: MethodStep[]
  badges: string[]
}

export function buildMethodPageUi(method: MethodCatalogEntry, content: MethodPageContent): MethodPageUiBundle {
  const config = getMethodPageUiConfig(method.slug)
  const accent = getMethodAccentTheme(method.slug)
  const ddPhaseLabel = getMethodPhaseLabel(method.primaryPhase)
  const dtPhaseLabel = getMethodDesignThinkingPhaseLabel(method.primaryDesignThinkingPhase)
  const categoryLabel = METHOD_LIBRARY_CATEGORIES.find((c) => c.id === method.libraryCategory)?.label
  const dtSecondaryNote =
    method.secondaryDesignThinkingPhases.length > 0
      ? `DT: ${getSecondaryDesignThinkingPhaseLabels(method.secondaryDesignThinkingPhases).join(', ')}`
      : undefined
  const ddSecondaryNote =
    method.secondaryPhases.length > 0
      ? `DD: ${getSecondaryPhaseLabels(method.secondaryPhases).join(', ')}`
      : undefined

  const badges = [
    ...(config.extraBadges ?? []),
    ...(dtPhaseLabel ? [dtPhaseLabel] : []),
    ...(ddPhaseLabel ? [ddPhaseLabel] : []),
    ...(categoryLabel ? [categoryLabel] : []),
    ...method.tags.slice(0, 3),
    ...(dtSecondaryNote ? [dtSecondaryNote] : []),
    ...(ddSecondaryNote ? [ddSecondaryNote] : []),
  ].filter((b, i, arr) => arr.indexOf(b) === i)

  const steps = config.steps?.length ? config.steps : deriveStepsFromProcessSection(content.sections)

  return {
    accent,
    config,
    toc: buildMethodToc(content),
    steps,
    badges,
  }
}
