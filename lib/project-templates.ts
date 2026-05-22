export type ProjectTemplate = {
  id: string
  name: string
  description: string
  methods: string[]
  available: boolean
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'eksamen',
    name: 'Eksamensprojekt',
    description: 'Struktur til akademiske projekter med research, analyse og leverance.',
    methods: ['Persona', 'SWOT', 'Brugerrejse', 'Kanban'],
    available: false,
  },
  {
    id: 'ux-research',
    name: 'UX research',
    description: 'Fokus på brugerforståelse, interviews og validering.',
    methods: ['Survey', 'Empathy Map', 'Persona', 'Card Sorting'],
    available: false,
  },
  {
    id: 'kunde',
    name: 'Kundeprojekt',
    description: 'Fra brief til leverance med tydelige faser og stakeholder-alignment.',
    methods: ['Business Model Canvas', 'SWOT', 'Gantt', 'Kanban'],
    available: false,
  },
  {
    id: 'service-blueprint',
    name: 'Service Blueprint-forløb',
    description: 'Kortlæg og forbedr en service end-to-end.',
    methods: ['Brugerrejse', 'Service Blueprint', 'Stakeholder-map'],
    available: false,
  },
  {
    id: 'double-diamond',
    name: 'Konceptudvikling med Double Diamond',
    description: 'Discover, Define, Develop og Deliver i ét forløb.',
    methods: ['Empathy Map', 'HMW', 'Brainstorming', 'A/B/N Test'],
    available: false,
  },
]
