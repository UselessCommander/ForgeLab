/**
 * Faglig Double Diamond-klassifikation for metodebiblioteket.
 * primaryPhase = primær placering; secondaryPhases = også relevant i disse faser.
 * "across" = proces-/planlægningsværktøjer på tværs af diamanten (ikke en kvadrant).
 *
 * Væsentlige reklassifikationer (fra tidligere defaults):
 * - Discover: empathy-map, porters-five-forces (fra define)
 * - Define: pirate-funnel (fra develop), affinity-diagram forbliver analyse/syntese
 * - Develop: tows-matrix (fra define)
 * - Deliver: ab-test (uændret primær)
 * - Across: gantt-chart, kanban (fra deliver)
 * - Kategorier: 5 whys & DIKW → analyse; pirate-funnel → analyse; card-sorting → define/research
 */
export type MethodDiamondPhase = 'discover' | 'define' | 'develop' | 'deliver' | 'across'

export type MethodLibraryCategoryId =
  | 'research'
  | 'analyse'
  | 'strategi'
  | 'ideation'
  | 'testing'
  | 'planning'
  | 'service-design'
  | 'informationsarkitektur'

export type MethodDiamondClassification = {
  primaryPhase: MethodDiamondPhase
  secondaryPhases?: MethodDiamondPhase[]
  category: MethodLibraryCategoryId
  tags?: string[]
}

/** Eksplicit klassifikation — kilde til sandhed for metodesiden. */
export const METHOD_DIAMOND_CLASSIFICATIONS: Record<string, MethodDiamondClassification> = {
  'ab-test': {
    primaryPhase: 'deliver',
    secondaryPhases: ['develop'],
    category: 'testing',
  },
  'swot-generator': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'analyse',
    tags: ['Strategi'],
  },
  'business-model-canvas': {
    primaryPhase: 'develop',
    secondaryPhases: ['define'],
    category: 'strategi',
  },
  'gantt-chart': {
    primaryPhase: 'across',
    secondaryPhases: ['deliver'],
    category: 'planning',
  },
  kanban: {
    primaryPhase: 'across',
    secondaryPhases: ['develop', 'deliver'],
    category: 'planning',
  },
  'gallup-kompasrose': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'strategi',
    tags: ['Segmentering'],
  },
  'tows-matrix': {
    primaryPhase: 'develop',
    secondaryPhases: ['define'],
    category: 'strategi',
  },
  'porters-five-forces': {
    primaryPhase: 'discover',
    secondaryPhases: ['define'],
    category: 'analyse',
    tags: ['Strategi'],
  },
  'value-proposition-canvas': {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'strategi',
    tags: ['Analyse'],
  },
  'empathy-map': {
    primaryPhase: 'discover',
    secondaryPhases: ['define'],
    category: 'research',
  },
  'card-sorting': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'research',
    tags: ['Informationsarkitektur'],
  },
  'smuk-model': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'strategi',
    tags: ['Segmentering'],
  },
  'aaker-identity-model': {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'strategi',
    tags: ['Brand'],
  },
  'survey-template': {
    primaryPhase: 'discover',
    secondaryPhases: ['deliver'],
    category: 'research',
    tags: ['Testing'],
  },
  'affinity-diagram': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'analyse',
  },
  scamper: {
    primaryPhase: 'develop',
    category: 'ideation',
  },
  hmw: {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'ideation',
  },
  'five-whys': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'analyse',
  },
  brugerrejse: {
    primaryPhase: 'define',
    secondaryPhases: ['discover', 'develop'],
    category: 'research',
    tags: ['Analyse'],
  },
  'dikw-pyramiden': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'analyse',
  },
  brainstorming: {
    primaryPhase: 'develop',
    category: 'ideation',
  },
  pestel: {
    primaryPhase: 'discover',
    secondaryPhases: ['define'],
    category: 'analyse',
    tags: ['Strategi'],
  },
  peso: {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'strategi',
    tags: ['Kommunikation', 'Kanaler'],
  },
  'golden-circle': {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'strategi',
    tags: ['Purpose', 'Simon Sinek', 'Why'],
  },
  'persona-canvas': {
    primaryPhase: 'define',
    secondaryPhases: ['discover'],
    category: 'research',
    tags: ['Synthesis'],
  },
  'pirate-funnel': {
    primaryPhase: 'define',
    secondaryPhases: ['deliver'],
    category: 'analyse',
    tags: ['Testing'],
  },
  'service-blueprint': {
    primaryPhase: 'define',
    secondaryPhases: ['develop'],
    category: 'analyse',
    tags: ['Service Design'],
  },
}

export function getMethodDiamondClassification(
  slug: string
): MethodDiamondClassification | undefined {
  return METHOD_DIAMOND_CLASSIFICATIONS[slug]
}

/** Matcher fasefilter: primær eller sekundær fase. */
export function methodMatchesDiamondPhaseFilter(
  classification: MethodDiamondClassification,
  phase: MethodDiamondPhase
): boolean {
  if (classification.primaryPhase === phase) return true
  return classification.secondaryPhases?.includes(phase) ?? false
}

/** Primær fase til projekt-board (kun de fire diamantfaser). */
export function getProjectBoardDiamondPhase(slug: string): import('@/lib/frameworks').DoubleDiamondPhase {
  const c = METHOD_DIAMOND_CLASSIFICATIONS[slug]
  if (!c || c.primaryPhase === 'across') {
    return 'develop'
  }
  return c.primaryPhase
}
