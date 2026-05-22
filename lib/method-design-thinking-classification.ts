import type { MethodLibraryCategoryId } from '@/lib/method-diamond-classification'

/**
 * Design Thinking-klassifikation for metodebiblioteket.
 * primaryDesignThinkingPhase = primær fase; secondary = også relevant.
 * "across" = planlægning/workflow på tværs af processen.
 *
 * Væsentlige forskelle fra tidligere defaults i frameworks.ts:
 * - Empathize: porters-five-forces, brugerrejse, pestel (fra define)
 * - Prototype: business-model-canvas, service-blueprint (fra ideate/define)
 * - Ideate: tows-matrix (fra define)
 * - Test: ab-test (fra prototype)
 * - Across: gantt-chart, kanban (fra prototype/test)
 */
export type MethodDesignThinkingPhase =
  | 'empathize'
  | 'define'
  | 'ideate'
  | 'prototype'
  | 'test'
  | 'across'

export type MethodDesignThinkingClassification = {
  primaryPhase: MethodDesignThinkingPhase
  secondaryPhases?: MethodDesignThinkingPhase[]
  /** Kan afvige fra Double Diamond libraryCategory (fx Service Design, Informationsarkitektur). */
  category?: MethodLibraryCategoryId
  tags?: string[]
}

export const METHOD_DESIGN_THINKING_CLASSIFICATIONS: Record<string, MethodDesignThinkingClassification> = {
  'ab-test': {
    primaryPhase: 'test',
    secondaryPhases: ['prototype'],
    category: 'testing',
    tags: ['Eksperiment', 'Validering', 'Optimering'],
  },
  'swot-generator': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'analyse',
    tags: ['Strategi', 'Situationsanalyse'],
  },
  'business-model-canvas': {
    primaryPhase: 'prototype',
    secondaryPhases: ['ideate', 'define'],
    category: 'strategi',
    tags: ['Forretningsmodel', 'Konceptudvikling'],
  },
  'gantt-chart': {
    primaryPhase: 'across',
    category: 'planning',
    tags: ['Projektstyring', 'Tidsplan'],
  },
  kanban: {
    primaryPhase: 'across',
    category: 'planning',
    tags: ['Workflow', 'Opgavestyring'],
  },
  'gallup-kompasrose': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'strategi',
    tags: ['Segmentering', 'Målgruppe'],
  },
  'tows-matrix': {
    primaryPhase: 'ideate',
    secondaryPhases: ['define'],
    category: 'strategi',
    tags: ['Strategiske handlemuligheder', 'SWOT'],
  },
  'porters-five-forces': {
    primaryPhase: 'empathize',
    secondaryPhases: ['define'],
    category: 'analyse',
    tags: ['Marked', 'Konkurrence', 'Strategi'],
  },
  'value-proposition-canvas': {
    primaryPhase: 'define',
    secondaryPhases: ['ideate', 'prototype'],
    category: 'strategi',
    tags: ['Value Proposition', 'Problem Solution Fit'],
  },
  'empathy-map': {
    primaryPhase: 'empathize',
    secondaryPhases: ['define'],
    category: 'research',
    tags: ['Brugerforståelse', 'Syntese'],
  },
  'card-sorting': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize', 'test'],
    category: 'informationsarkitektur',
    tags: ['Navigation', 'Mental Models', 'Research'],
  },
  'smuk-model': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'strategi',
    tags: ['Segmentering', 'Prioritering'],
  },
  'aaker-identity-model': {
    primaryPhase: 'define',
    secondaryPhases: ['ideate'],
    category: 'strategi',
    tags: ['Brand', 'Identitet'],
  },
  'survey-template': {
    primaryPhase: 'empathize',
    secondaryPhases: ['test'],
    category: 'research',
    tags: ['Dataindsamling', 'Feedback', 'Validering'],
  },
  'affinity-diagram': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'analyse',
    tags: ['Syntese', 'Mønstergenkendelse'],
  },
  scamper: {
    primaryPhase: 'ideate',
    category: 'ideation',
    tags: ['Idégenerering', 'Kreativ metode'],
  },
  hmw: {
    primaryPhase: 'define',
    secondaryPhases: ['ideate'],
    category: 'ideation',
    tags: ['Problem framing', 'Mulighedsrum'],
  },
  'five-whys': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'analyse',
    tags: ['Root Cause Analysis', 'Problemforståelse'],
  },
  brugerrejse: {
    primaryPhase: 'empathize',
    secondaryPhases: ['define', 'ideate'],
    category: 'research',
    tags: ['User Journey', 'Touchpoints', 'Service Design'],
  },
  'dikw-pyramiden': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'analyse',
    tags: ['Data', 'Information', 'Viden', 'Indsigt'],
  },
  brainstorming: {
    primaryPhase: 'ideate',
    category: 'ideation',
    tags: ['Idégenerering', 'Divergent Thinking'],
  },
  pestel: {
    primaryPhase: 'empathize',
    secondaryPhases: ['define'],
    category: 'analyse',
    tags: ['Omverdensanalyse', 'Strategi', 'Kontekst'],
  },
  peso: {
    primaryPhase: 'define',
    secondaryPhases: ['prototype'],
    category: 'strategi',
    tags: ['Kommunikation', 'Medier'],
  },
  'golden-circle': {
    primaryPhase: 'define',
    secondaryPhases: ['ideate'],
    category: 'strategi',
    tags: ['Purpose', 'Simon Sinek', 'Why'],
  },
  'persona-canvas': {
    primaryPhase: 'define',
    secondaryPhases: ['empathize'],
    category: 'research',
    tags: ['Persona', 'Målgruppe', 'Syntese'],
  },
  'pirate-funnel': {
    primaryPhase: 'define',
    secondaryPhases: ['test'],
    category: 'analyse',
    tags: ['Funnel', 'Growth', 'Optimering'],
  },
  'service-blueprint': {
    primaryPhase: 'prototype',
    secondaryPhases: ['define', 'ideate'],
    category: 'service-design',
    tags: ['Service Design', 'Frontstage', 'Backstage', 'Touchpoints'],
  },
}

export function getMethodDesignThinkingClassification(
  slug: string
): MethodDesignThinkingClassification | undefined {
  return METHOD_DESIGN_THINKING_CLASSIFICATIONS[slug]
}

export function methodMatchesDesignThinkingPhaseFilter(
  classification: MethodDesignThinkingClassification,
  phase: MethodDesignThinkingPhase
): boolean {
  if (classification.primaryPhase === phase) return true
  return classification.secondaryPhases?.includes(phase) ?? false
}

/** Primær fase til projekt-board (kun de fem klassiske DT-faser). */
export function getProjectBoardDesignThinkingPhase(
  slug: string
): import('@/lib/frameworks').DesignThinkingPhase {
  const c = METHOD_DESIGN_THINKING_CLASSIFICATIONS[slug]
  if (!c || c.primaryPhase === 'across') {
    return 'ideate'
  }
  return c.primaryPhase
}
