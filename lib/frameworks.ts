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
  { id: 'understand', label: 'Understand', description: 'Mandag: kortlæg problemet og mål' },
  { id: 'sketch', label: 'Sketch', description: 'Tirsdag: skitser mange løsningsidéer' },
  { id: 'decide', label: 'Decide', description: 'Onsdag: vælg den stærkeste retning' },
  { id: 'prototype', label: 'Prototype', description: 'Torsdag: byg en realistisk prototype' },
  { id: 'test', label: 'Test', description: 'Fredag: test med brugere og lær hurtigt' },
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

// Default forslag til placering af værktøjer i Double Diamond
const DOUBLE_DIAMOND_TOOL_DEFAULTS: Record<string, DoubleDiamondPhase> = {
  'empathy-map': 'define',
  'persona-canvas': 'define',
  'affinity-diagram': 'define',
  'card-sorting': 'define',
  'swot-generator': 'define',
  'smuk-model': 'define',
  'aaker-identity-model': 'define',
  hmw: 'define',
  'five-whys': 'define',
  'dikw-pyramiden': 'define',
  pestel: 'discover',
  brugerrejse: 'define',
  'pirate-funnel': 'develop',
  'value-proposition-canvas': 'define',
  'business-model-canvas': 'develop',
  'gallup-kompasrose': 'define',
  scamper: 'develop',
  brainstorming: 'develop',
  'tows-matrix': 'define',
  'porters-five-forces': 'define',
  'gantt-chart': 'deliver',
  kanban: 'deliver',
  'ab-test': 'deliver',
  'survey-template': 'discover',
  'qr-generator': 'deliver',
}

// Default forslag til placering af værktøjer i Google Design Sprint
const GOOGLE_DESIGN_SPRINT_TOOL_DEFAULTS: Record<string, GoogleDesignSprintPhase> = {
  pestel: 'understand',
  'survey-template': 'understand',
  'five-whys': 'understand',
  'dikw-pyramiden': 'understand',
  'empathy-map': 'understand',
  'persona-canvas': 'understand',
  brugerrejse: 'understand',
  'card-sorting': 'understand',
  'affinity-diagram': 'understand',
  brainstorming: 'sketch',
  scamper: 'sketch',
  hmw: 'decide',
  'value-proposition-canvas': 'decide',
  'business-model-canvas': 'decide',
  'aaker-identity-model': 'decide',
  'smuk-model': 'decide',
  'swot-generator': 'decide',
  'tows-matrix': 'decide',
  'porters-five-forces': 'decide',
  'pirate-funnel': 'decide',
  'gallup-kompasrose': 'decide',
  'ab-test': 'prototype',
  'qr-generator': 'prototype',
  kanban: 'prototype',
  'gantt-chart': 'test',
}

// Default forslag til placering af værktøjer i Design Thinking
const DESIGN_THINKING_TOOL_DEFAULTS: Record<string, DesignThinkingPhase> = {
  'empathy-map': 'empathize',
  'persona-canvas': 'empathize',
  brugerrejse: 'empathize',
  'card-sorting': 'empathize',
  'affinity-diagram': 'define',
  'five-whys': 'define',
  'dikw-pyramiden': 'define',
  pestel: 'define',
  hmw: 'define',
  brainstorming: 'ideate',
  scamper: 'ideate',
  'value-proposition-canvas': 'ideate',
  'business-model-canvas': 'ideate',
  'aaker-identity-model': 'ideate',
  'ab-test': 'prototype',
  kanban: 'prototype',
  'qr-generator': 'prototype',
  'gantt-chart': 'test',
  'survey-template': 'test',
  'swot-generator': 'define',
  'tows-matrix': 'define',
  'porters-five-forces': 'define',
  'gallup-kompasrose': 'define',
  'smuk-model': 'define',
  'pirate-funnel': 'ideate',
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

