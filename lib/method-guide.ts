import { getVaerktoejBySlug } from '@/lib/vaerktoejer-data'
import { getMethodToolHref } from '@/lib/method-catalog'

export type MethodGuideSituationId =
  | 'understand-user'
  | 'define-problem'
  | 'develop-ideas'
  | 'plan-work'
  | 'test-validate'

export type MethodGuideSituation = {
  id: MethodGuideSituationId
  label: string
  description: string
  recommendationTitle: string
  recommendationText: string
  /** Tool slugs — only existing ForgeLab tools. */
  toolSlugs: string[]
}

export const METHOD_GUIDE_SITUATIONS: MethodGuideSituation[] = [
  {
    id: 'understand-user',
    label: 'Jeg skal forstå brugeren',
    description: 'Research og empati omkring målgruppen.',
    recommendationTitle: 'Anbefalet til at forstå brugeren',
    recommendationText:
      'Start med interviews og brugerrejse, hvis du mangler dyb indsigt. Brug survey, hvis du vil validere mønstre hos flere brugere.',
    toolSlugs: [
      'survey-template',
      'brugerrejse',
      'empathy-map',
      'persona-canvas',
      'affinity-diagram',
    ],
  },
  {
    id: 'define-problem',
    label: 'Jeg skal definere problemet',
    description: 'Strukturér indsigt og værditilbud.',
    recommendationTitle: 'Anbefalet til at definere problemet',
    recommendationText:
      'Brug disse metoder til at omsætte research til klare indsigter, behov og problemfelter.',
    toolSlugs: [
      'hmw',
      'value-proposition-canvas',
      'service-blueprint',
      'swot-generator',
      'persona-canvas',
      'five-whys',
    ],
  },
  {
    id: 'develop-ideas',
    label: 'Jeg skal udvikle idéer',
    description: 'Generér og udforsk løsninger.',
    recommendationTitle: 'Anbefalet til at udvikle idéer',
    recommendationText:
      'Brug disse metoder til at åbne løsningsrummet og prioritere idéer.',
    toolSlugs: ['brainstorming', 'scamper', 'ab-test', 'hmw'],
  },
  {
    id: 'plan-work',
    label: 'Jeg skal planlægge arbejdet',
    description: 'Prioriter og koordinér leverance.',
    recommendationTitle: 'Anbefalet til at planlægge arbejdet',
    recommendationText:
      'Brug disse værktøjer til at skabe overblik over opgaver, ansvar og fremdrift.',
    toolSlugs: ['kanban', 'gantt-chart', 'pirate-funnel'],
  },
  {
    id: 'test-validate',
    label: 'Jeg skal teste eller validere',
    description: 'Indsamle feedback og sammenligne alternativer.',
    recommendationTitle: 'Anbefalet til at teste eller validere',
    recommendationText:
      'Brug disse metoder til at teste antagelser, sammenligne løsninger og indsamle feedback.',
    toolSlugs: ['survey-template', 'ab-test', 'card-sorting'],
  },
]

export type MethodGuideSuggestion = {
  slug: string
  title: string
  shortDescription: string
  href: string
}

export function getGuideSituation(id: MethodGuideSituationId): MethodGuideSituation | undefined {
  return METHOD_GUIDE_SITUATIONS.find((s) => s.id === id)
}

export function getGuideSuggestions(situationId: MethodGuideSituationId): MethodGuideSuggestion[] {
  const situation = getGuideSituation(situationId)
  if (!situation) return []

  const seen = new Set<string>()
  const out: MethodGuideSuggestion[] = []
  for (const slug of situation.toolSlugs) {
    if (seen.has(slug)) continue
    const tool = getVaerktoejBySlug(slug)
    if (!tool) continue
    seen.add(slug)
    out.push({
      slug,
      title: tool.title,
      shortDescription: tool.shortDescription,
      href: getMethodToolHref(slug),
    })
  }
  return out
}

export function getGuideFilterSlugs(situationId: MethodGuideSituationId): string[] {
  return getGuideSuggestions(situationId).map((s) => s.slug)
}
