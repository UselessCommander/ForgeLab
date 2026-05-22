export type MarketingMethodFilterId =
  | 'alle'
  | 'research'
  | 'strategi'
  | 'ux'
  | 'marketing'
  | 'forretning'
  | 'test'
  | 'projektstyring'

export type MarketingMethodPhase = 'Discover' | 'Define' | 'Develop' | 'Deliver' | 'Across'

export type MarketingMethod = {
  id: string
  title: string
  description: string
  category: string
  filter: MarketingMethodFilterId
  phase: MarketingMethodPhase
  href: string
  featured?: boolean
}

export const MARKETING_METHOD_FILTERS: { id: MarketingMethodFilterId; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'research', label: 'Research' },
  { id: 'strategi', label: 'Strategi' },
  { id: 'ux', label: 'UX' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'forretning', label: 'Forretning' },
  { id: 'test', label: 'Test' },
  { id: 'projektstyring', label: 'Projektstyring' },
]

export const MARKETING_PROCESS_PHASES: {
  id: string
  label: string
  description: string
}[] = [
  {
    id: 'discover',
    label: 'Discover',
    description: 'Research, empati og omverdensforståelse — find det rigtige problem.',
  },
  {
    id: 'define',
    label: 'Define',
    description: 'Strategi, segmentering og skarp problemformulering.',
  },
  {
    id: 'develop',
    label: 'Develop',
    description: 'Idéer, koncepter, modeller og prototyper.',
  },
  {
    id: 'deliver',
    label: 'Deliver',
    description: 'Test, validering, planlægning og levering.',
  },
]

function toolHref(slug: string): string {
  return `/vaerktoejer/${slug}`
}

/** Hardcoded marketing catalog — href til offentlige værktøjssider hvor de findes. */
export const MARKETING_METHODS: MarketingMethod[] = [
  {
    id: 'golden-circle',
    title: 'Golden Circle',
    description: 'Formulér WHY, HOW og WHAT — fra formål til konkret tilbud.',
    category: 'Strategi',
    filter: 'strategi',
    phase: 'Define',
    href: toolHref('golden-circle'),
    featured: true,
  },
  {
    id: 'aaker-identity-model',
    title: 'David Aaker Identitetsmodel',
    description: 'Byg brandets essens, kerne og udvidede identitet i fire perspektiver.',
    category: 'Strategi / brand',
    filter: 'strategi',
    phase: 'Define',
    href: toolHref('aaker-identity-model'),
  },
  {
    id: 'gallup-kompasrose',
    title: 'Repositioneringskort',
    description: 'Gallup Kompasrose til kultur, værdier og repositionering på tværs af dimensioner.',
    category: 'Strategi / brand',
    filter: 'strategi',
    phase: 'Define',
    href: toolHref('gallup-kompasrose'),
  },
  {
    id: 'swot-generator',
    title: 'SWOT',
    description: 'Kortlæg styrker, svagheder, muligheder og trusler i ét overblik.',
    category: 'Strategi',
    filter: 'strategi',
    phase: 'Define',
    href: toolHref('swot-generator'),
  },
  {
    id: 'persona-canvas',
    title: 'Persona',
    description: 'Beskriv målgruppen konkret med mål, pains, gains og kontekst.',
    category: 'Research',
    filter: 'research',
    phase: 'Discover',
    href: toolHref('persona-canvas'),
  },
  {
    id: 'empathy-map',
    title: 'Empathy Map',
    description: 'Forstå hvad brugeren tænker, føler, siger og gør i en given situation.',
    category: 'Research',
    filter: 'research',
    phase: 'Discover',
    href: toolHref('empathy-map'),
  },
  {
    id: 'jtbd',
    title: 'JTBD Job Map',
    description: 'Kortlæg kundens job i trin og find friktion og innovationsmuligheder.',
    category: 'Research',
    filter: 'research',
    phase: 'Discover',
    href: '#metoder-grid',
    featured: true,
  },
  {
    id: 'brugerrejse',
    title: 'Customer Journey Map',
    description: 'Kortlæg brugerens oplevelse trin for trin — fra kontakt til afslutning.',
    category: 'UX',
    filter: 'ux',
    phase: 'Define',
    href: toolHref('brugerrejse'),
  },
  {
    id: 'service-blueprint',
    title: 'Service Blueprint',
    description: 'Visualisér serviceforløb på tværs af bruger, frontstage og backstage.',
    category: 'UX',
    filter: 'ux',
    phase: 'Develop',
    href: toolHref('service-blueprint'),
  },
  {
    id: 'double-diamond',
    title: 'Double Diamond',
    description: 'Discover, Define, Develop og Deliver — struktur for hele konceptprocessen.',
    category: 'Konceptudvikling',
    filter: 'ux',
    phase: 'Across',
    href: '/workflow',
  },
  {
    id: 'value-proposition-canvas',
    title: 'Value Proposition Canvas',
    description: 'Match kundens jobs, pains og gains med dit værditilbud.',
    category: 'Konceptudvikling',
    filter: 'ux',
    phase: 'Develop',
    href: toolHref('value-proposition-canvas'),
  },
  {
    id: 'business-model-canvas',
    title: 'Business Model Canvas',
    description: 'Skitsér forretningsmodellen med ni byggeklodser i ét canvas.',
    category: 'Konceptudvikling',
    filter: 'forretning',
    phase: 'Develop',
    href: toolHref('business-model-canvas'),
  },
  {
    id: 'crazy-8s',
    title: 'Crazy 8s',
    description: 'Generér hurtigt otte idé-variationer i en design sprint.',
    category: 'Konceptudvikling',
    filter: 'ux',
    phase: 'Develop',
    href: '/workflow',
  },
  {
    id: 'strategisk-afvejning',
    title: 'Prioriteringsmatrix',
    description: 'Strategisk afvejning og prioritering af initiativer og idéer.',
    category: 'Konceptudvikling',
    filter: 'strategi',
    phase: 'Develop',
    href: toolHref('strategisk-afvejning'),
  },
  {
    id: 'peso',
    title: 'PESO',
    description: 'Kortlæg Paid, Earned, Shared og Owned media i én samlet model.',
    category: 'Marketing',
    filter: 'marketing',
    phase: 'Develop',
    href: toolHref('peso'),
    featured: true,
  },
  {
    id: 'pirate-funnel',
    title: 'Pirate Funnel / AAARRR',
    description: 'Få overblik over vækst fra awareness til revenue.',
    category: 'Marketing',
    filter: 'marketing',
    phase: 'Deliver',
    href: toolHref('pirate-funnel'),
  },
  {
    id: 'aida-funnel',
    title: 'AIDA',
    description: 'Attention, Interest, Desire og Action — klassisk kommunikationsfunnel.',
    category: 'Marketing',
    filter: 'marketing',
    phase: 'Develop',
    href: toolHref('aida-funnel'),
  },
  {
    id: 'rfm',
    title: 'RFM',
    description: 'Segmentér kunder ud fra recency, frequency og monetary value.',
    category: 'Marketing',
    filter: 'marketing',
    phase: 'Deliver',
    href: '#metoder-grid',
  },
  {
    id: 'smp-model',
    title: 'SMP / målgruppevalg',
    description: 'Segmentering, målgruppevalg og positionering i ét flow.',
    category: 'Marketing',
    filter: 'marketing',
    phase: 'Define',
    href: toolHref('smp-model'),
  },
  {
    id: 'smuk-model',
    title: 'SMUK',
    description: 'Vurder segmenter på størrelse, muligheder, udgifter og konkurrence.',
    category: 'Marketing',
    filter: 'forretning',
    phase: 'Define',
    href: toolHref('smuk-model'),
  },
  {
    id: 'pestel',
    title: 'PESTEL',
    description: 'Analysér politiske, økonomiske, sociale, teknologiske og juridiske faktorer.',
    category: 'Analyse',
    filter: 'strategi',
    phase: 'Discover',
    href: toolHref('pestel'),
  },
  {
    id: 'dikw-pyramiden',
    title: 'DIKW',
    description: 'Fra data til viden og handling — DIKW-pyramiden til beslutningsgrundlag.',
    category: 'Analyse',
    filter: 'research',
    phase: 'Define',
    href: toolHref('dikw-pyramiden'),
  },
  {
    id: 'conzoom',
    title: 'Conzoom',
    description: 'Forstå forbrugersegmenter og livsstilsarketyper i det danske marked.',
    category: 'Analyse',
    filter: 'research',
    phase: 'Discover',
    href: '#metoder-grid',
  },
  {
    id: 'kanban',
    title: 'Kanban',
    description: 'Visualisér arbejde i kolonner — fra backlog til done.',
    category: 'Projekt',
    filter: 'projektstyring',
    phase: 'Deliver',
    href: toolHref('kanban'),
  },
  {
    id: 'gantt-chart',
    title: 'Gantt',
    description: 'Planlæg faser, milepæle og afhængigheder på en tidslinje.',
    category: 'Projekt',
    filter: 'projektstyring',
    phase: 'Deliver',
    href: toolHref('gantt-chart'),
  },
  {
    id: 'card-sorting',
    title: 'Card Sorting',
    description: 'Test hvordan brugere grupperer og navngiver indhold.',
    category: 'Research',
    filter: 'research',
    phase: 'Discover',
    href: toolHref('card-sorting'),
  },
  {
    id: 'survey-template',
    title: 'Survey Template',
    description: 'Byg spørgeskemaer og saml svar direkte i projektet.',
    category: 'Test',
    filter: 'test',
    phase: 'Discover',
    href: toolHref('survey-template'),
  },
  {
    id: 'ab-test',
    title: 'A/B Test',
    description: 'Sammenlign varianter med magic link og se stemmeresultater.',
    category: 'Test',
    filter: 'test',
    phase: 'Deliver',
    href: toolHref('ab-test'),
  },
]

export const MARKETING_FEATURED_METHODS = MARKETING_METHODS.filter(m => m.featured)

export function filterMarketingMethods(
  methods: MarketingMethod[],
  filter: MarketingMethodFilterId,
  query: string
): MarketingMethod[] {
  const q = query.trim().toLowerCase()
  return methods.filter(m => {
    if (filter !== 'alle' && m.filter !== filter) return false
    if (!q) return true
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    )
  })
}
