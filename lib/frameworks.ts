export type FrameworkId = 'none' | 'double-diamond'
export type DoubleDiamondPhase = 'discover' | 'define' | 'develop' | 'deliver'
export type FrameworkPhase = DoubleDiamondPhase | null

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

// Default forslag til placering af værktøjer i Double Diamond
const DOUBLE_DIAMOND_TOOL_DEFAULTS: Record<string, DoubleDiamondPhase> = {
  'empathy-map': 'discover',
  'affinity-diagram': 'define',
  'card-sorting': 'define',
  'swot-generator': 'define',
  'smuk-model': 'define',
  'value-proposition-canvas': 'develop',
  'business-model-canvas': 'develop',
  'gallup-kompasrose': 'develop',
  'maslow-model': 'develop',
  'tows-matrix': 'deliver',
  'porters-five-forces': 'deliver',
  'gantt-chart': 'deliver',
  'ab-test': 'deliver',
  'survey-template': 'deliver',
  'qr-generator': 'deliver',
}

export function normalizeFramework(input: unknown): FrameworkId {
  return input === 'double-diamond' ? 'double-diamond' : 'none'
}

export function getDefaultPhaseForTool(
  framework: FrameworkId,
  toolSlug: string
): FrameworkPhase {
  if (framework !== 'double-diamond') return null
  return DOUBLE_DIAMOND_TOOL_DEFAULTS[toolSlug] || 'develop'
}

export function isValidDoubleDiamondPhase(input: unknown): input is DoubleDiamondPhase {
  return input === 'discover' || input === 'define' || input === 'develop' || input === 'deliver'
}

