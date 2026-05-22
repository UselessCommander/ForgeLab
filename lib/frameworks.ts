export type FrameworkId = 'none' | 'double-diamond' | 'google-design-sprint' | 'design-thinking'
export type DoubleDiamondPhase = 'discover' | 'define' | 'develop' | 'deliver'
export type GoogleDesignSprintPhase = 'understand' | 'sketch' | 'decide' | 'prototype' | 'test'
export type DesignThinkingPhase = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test'
export type FrameworkPhase = DoubleDiamondPhase | GoogleDesignSprintPhase | DesignThinkingPhase | null

export const DOUBLE_DIAMOND_PHASES: Array<{
  id: DoubleDiamondPhase
  label: string
  description: string
}> = [
  { id: 'discover', label: 'Discover', description: 'Udforsk behov, indsigter og muligheder' },
  { id: 'define', label: 'Define', description: 'Afgræns problemet og vælg retning' },
  { id: 'develop', label: 'Develop', description: 'Udvikl idéer og løsninger' },
  { id: 'deliver', label: 'Deliver', description: 'Test, implementér og iterér' },
]

export const GOOGLE_DESIGN_SPRINT_PHASES: Array<{
  id: GoogleDesignSprintPhase
  label: string
  description: string
}> = [
  { id: 'understand', label: 'Map', description: 'Mandag: forstå problemet og vælg fokus' },
  { id: 'sketch', label: 'Sketch', description: 'Tirsdag: individuelle løsningsforslag' },
  { id: 'decide', label: 'Decide', description: 'Onsdag: vælg retning og storyboard' },
  { id: 'prototype', label: 'Prototype', description: 'Torsdag: byg en testbar facade' },
  { id: 'test', label: 'Test', description: 'Fredag: fem kvalitative brugerinterviews' },
]

export const DESIGN_THINKING_PHASES: Array<{
  id: DesignThinkingPhase
  label: string
  description: string
}> = [
  { id: 'empathize', label: 'Empathize', description: 'Forstå mennesker, behov og kontekst' },
  { id: 'define', label: 'Define', description: 'Afgræns problemet skarpt' },
  { id: 'ideate', label: 'Ideate', description: 'Skab mange løsningsidéer' },
  { id: 'prototype', label: 'Prototype', description: 'Gør idéer konkrete hurtigt' },
  { id: 'test', label: 'Test', description: 'Test med brugere og lær' },
]

// Default forslag til placering af værktøjer i Double Diamond (projekt-board).
// Metodebibliotekets faglige klassifikation: lib/method-diamond-classification.ts
const DOUBLE_DIAMOND_TOOL_DEFAULTS: Record<string, DoubleDiamondPhase> = {
  'ab-test': 'deliver',
  'swot-generator': 'define',
  'business-model-canvas': 'develop',
  'gallup-kompasrose': 'define',
  'tows-matrix': 'develop',
  'porters-five-forces': 'discover',
  'value-proposition-canvas': 'define',
  'empathy-map': 'discover',
  'card-sorting': 'define',
  'smuk-model': 'define',
  'aaker-identity-model': 'define',
  'survey-template': 'discover',
  'affinity-diagram': 'define',
  scamper: 'develop',
  hmw: 'define',
  'five-whys': 'define',
  brugerrejse: 'define',
  'dikw-pyramiden': 'define',
  'seo-pyramide': 'define',
  'strategisk-afvejning': 'define',
  'aida-funnel': 'define',
  'dvf-venn-model': 'define',
  brainstorming: 'develop',
  pestel: 'discover',
  peso: 'define',
  'golden-circle': 'define',
  'persona-canvas': 'define',
  'pirate-funnel': 'define',
  'service-blueprint': 'define',
  'qr-generator': 'deliver',
  // kanban / gantt-chart: across i metodebibliotek — ingen diamant-default her
}

// Default forslag til placering af værktøjer i GV Design Sprint (projekt-board).
// Playbook og aktiviteter: lib/gv-design-sprint-framework.ts — kun eksplicit linkede tools.
const GOOGLE_DESIGN_SPRINT_TOOL_DEFAULTS: Record<string, GoogleDesignSprintPhase> = {
  brugerrejse: 'understand',
  hmw: 'understand',
}

// Default forslag til placering af værktøjer i Design Thinking (projekt-board).
// Metodebibliotekets faglige klassifikation: lib/method-design-thinking-classification.ts
const DESIGN_THINKING_TOOL_DEFAULTS: Record<string, DesignThinkingPhase> = {
  'ab-test': 'test',
  'swot-generator': 'define',
  'business-model-canvas': 'prototype',
  'gallup-kompasrose': 'define',
  'tows-matrix': 'ideate',
  'porters-five-forces': 'empathize',
  'value-proposition-canvas': 'define',
  'empathy-map': 'empathize',
  'card-sorting': 'define',
  'smuk-model': 'define',
  'aaker-identity-model': 'define',
  'survey-template': 'empathize',
  'affinity-diagram': 'define',
  scamper: 'ideate',
  hmw: 'define',
  'five-whys': 'define',
  brugerrejse: 'empathize',
  'dikw-pyramiden': 'define',
  'seo-pyramide': 'define',
  'strategisk-afvejning': 'define',
  'aida-funnel': 'define',
  'dvf-venn-model': 'define',
  brainstorming: 'ideate',
  pestel: 'empathize',
  peso: 'define',
  'golden-circle': 'define',
  'persona-canvas': 'define',
  'pirate-funnel': 'define',
  'service-blueprint': 'prototype',
  'qr-generator': 'prototype',
  // kanban / gantt-chart: across i metodebibliotek — ingen DT-default her
}

export function normalizeFramework(input: unknown): FrameworkId {
  if (input === 'double-diamond') return 'double-diamond'
  if (input === 'google-design-sprint') return 'google-design-sprint'
  if (input === 'design-thinking') return 'design-thinking'
  return 'none'
}

export function getDefaultPhaseForTool(
  framework: FrameworkId,
  toolSlug: string
): FrameworkPhase {
  if (framework === 'double-diamond') {
    return DOUBLE_DIAMOND_TOOL_DEFAULTS[toolSlug] || 'develop'
  }
  if (framework === 'google-design-sprint') {
    return GOOGLE_DESIGN_SPRINT_TOOL_DEFAULTS[toolSlug] || 'prototype'
  }
  if (framework === 'design-thinking') {
    return DESIGN_THINKING_TOOL_DEFAULTS[toolSlug] || 'ideate'
  }
  return null
}

export function isValidDoubleDiamondPhase(input: unknown): input is DoubleDiamondPhase {
  return input === 'discover' || input === 'define' || input === 'develop' || input === 'deliver'
}

export function isValidGoogleDesignSprintPhase(input: unknown): input is GoogleDesignSprintPhase {
  return (
    input === 'understand' ||
    input === 'sketch' ||
    input === 'decide' ||
    input === 'prototype' ||
    input === 'test'
  )
}

export function isValidDesignThinkingPhase(input: unknown): input is DesignThinkingPhase {
  return (
    input === 'empathize' ||
    input === 'define' ||
    input === 'ideate' ||
    input === 'prototype' ||
    input === 'test'
  )
}

export function getFrameworkPhases(framework: FrameworkId) {
  if (framework === 'double-diamond') return DOUBLE_DIAMOND_PHASES
  if (framework === 'google-design-sprint') return GOOGLE_DESIGN_SPRINT_PHASES
  if (framework === 'design-thinking') return DESIGN_THINKING_PHASES
  return []
}

