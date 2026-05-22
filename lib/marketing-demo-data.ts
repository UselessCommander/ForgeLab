export type DemoTabId = 'board' | 'methods' | 'research' | 'ai' | 'output'

export const DEMO_TABS: { id: DemoTabId; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'methods', label: 'Metoder' },
  { id: 'research', label: 'Research' },
  { id: 'ai', label: 'AI' },
  { id: 'output', label: 'Output' },
]

export type DemoBoardColumn = {
  id: string
  title: string
  cards: { title: string; tag: string }[]
}

export const DEMO_BOARD_COLUMNS: DemoBoardColumn[] = [
  {
    id: 'research',
    title: 'Research',
    cards: [
      { title: 'Interview med målgruppe', tag: 'Research' },
      { title: 'Desk research', tag: 'Research' },
      { title: 'Problemobservationer', tag: 'Research' },
    ],
  },
  {
    id: 'insights',
    title: 'Indsigter',
    cards: [
      { title: 'Brugeren mangler overblik', tag: 'Insight' },
      { title: 'For mange værktøjer', tag: 'Insight' },
      { title: 'Output er svært at dokumentere', tag: 'Insight' },
    ],
  },
  {
    id: 'ideas',
    title: 'Idéer',
    cards: [
      { title: 'Interaktiv metodeflade', tag: 'Idea' },
      { title: 'Rapportklar outputvisning', tag: 'Idea' },
      { title: 'AI som sparringspartner', tag: 'Idea' },
    ],
  },
  {
    id: 'concept',
    title: 'Koncept',
    cards: [
      { title: 'ForgeLab workspace', tag: 'Concept' },
      { title: 'Metodebibliotek', tag: 'Concept' },
      { title: 'Projektbaseret board', tag: 'Concept' },
    ],
  },
  {
    id: 'test',
    title: 'Test',
    cards: [
      { title: 'Fake door test', tag: 'Test' },
      { title: 'Survey', tag: 'Test' },
      { title: 'A/B test', tag: 'Test' },
    ],
  },
]

export type DemoMethodPreview = {
  id: string
  title: string
  description: string
  category: string
  phase: string
  visual: 'peso' | 'golden-circle' | 'jtbd' | 'funnel' | 'diamond' | 'blueprint' | 'vpc' | 'swot'
}

export const DEMO_METHODS: DemoMethodPreview[] = [
  {
    id: 'double-diamond',
    title: 'Double Diamond',
    description: 'Discover, Define, Develop og Deliver i ét struktureret forløb.',
    category: 'Proces',
    phase: 'Across',
    visual: 'diamond',
  },
  {
    id: 'peso',
    title: 'PESO',
    description: 'Paid, Earned, Shared og Owned media i én model.',
    category: 'Marketing',
    phase: 'Develop',
    visual: 'peso',
  },
  {
    id: 'jtbd',
    title: 'JTBD Job Map',
    description: 'Kortlæg job i trin og find friktion.',
    category: 'Research',
    phase: 'Discover',
    visual: 'jtbd',
  },
  {
    id: 'golden-circle',
    title: 'Golden Circle',
    description: 'WHY, HOW og WHAT bag koncept eller brand.',
    category: 'Strategi',
    phase: 'Define',
    visual: 'golden-circle',
  },
  {
    id: 'pirate-funnel',
    title: 'Pirate Funnel',
    description: 'AAARRR — fra awareness til revenue.',
    category: 'Marketing',
    phase: 'Deliver',
    visual: 'funnel',
  },
  {
    id: 'service-blueprint',
    title: 'Service Blueprint',
    description: 'Bruger, frontstage og backstage i ét blueprint.',
    category: 'UX',
    phase: 'Develop',
    visual: 'blueprint',
  },
  {
    id: 'vpc',
    title: 'Value Proposition Canvas',
    description: 'Kobl behov og værditilbud.',
    category: 'Koncept',
    phase: 'Develop',
    visual: 'vpc',
  },
  {
    id: 'swot',
    title: 'SWOT',
    description: 'Styrker, svagheder, muligheder og trusler.',
    category: 'Strategi',
    phase: 'Define',
    visual: 'swot',
  },
]

export const DEMO_RESEARCH = {
  quote:
    'Jeg ved godt hvilken model jeg skal bruge, men ikke hvordan jeg får et brugbart output ud af den.',
  insight: 'Metodearbejde bliver ofte fragmenteret mellem docs, slides og screenshots.',
  opportunity: 'ForgeLab kan samle metodearbejde og output i samme workflow.',
  notes: [
    '3 interviews gennemført',
    'Desk research: 12 konkurrenter kortlagt',
    'Observation: brugere skifter mellem 4+ værktøjer per projekt',
  ],
}

export const DEMO_AI = {
  userQuestion: 'Hvilken metode passer bedst til at forstå brugerens motivation?',
  assistantReply:
    'Start med JTBD Job Map hvis du vil forstå hvad brugeren prøver at opnå. Brug derefter Value Proposition Canvas til at koble behovet til din løsning.',
  suggestions: [
    'Foreslå metode',
    'Skriv problemformulering',
    'Opsummér indsigter',
    'Lav output til rapport',
  ],
}

export const DEMO_OUTPUT = {
  intro:
    'Output er adskilt fra arbejdsvisningen, så det kan bruges direkte som dokumentation.',
  sections: [
    {
      title: 'Problemfelt',
      body: 'Studerende og teams mangler ét sted at arbejde med metoder — fra research til rapportklar output.',
    },
    {
      title: 'Valgt metode',
      body: 'JTBD Job Map → Value Proposition Canvas → Service Blueprint',
    },
    {
      title: 'Centrale indsigter',
      body: 'Metoder bruges ofte som pynt. Output fragmenteres på tværs af værktøjer. Behov for struktur uden at miste kreativitet.',
    },
    {
      title: 'Konceptretning',
      body: 'Et projektbaseret workspace med interaktive metodeflader og separat outputvisning.',
    },
    {
      title: 'Næste test',
      body: 'Fake door test med 3 konceptvarianter. Survey til validering af kernefunktioner.',
    },
  ],
}

export const DEMO_EXPLAINER = [
  {
    tab: 'Board',
    title: 'Board',
    body: 'Organisér research, indsigter, idéer og test i ét projekt.',
  },
  {
    tab: 'Metoder',
    title: 'Metoder',
    body: 'Arbejd med konkrete frameworks i stedet for løse noter.',
  },
  {
    tab: 'AI',
    title: 'AI',
    body: 'Brug AI til sparring, struktur og metodevalg.',
  },
  {
    tab: 'Output',
    title: 'Output',
    body: 'Få rapportklar dokumentation uden at rydde op manuelt.',
  },
] as const
