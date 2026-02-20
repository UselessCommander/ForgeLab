/** Canonical list of tool slugs for project workspace */
export const TOOL_SLUGS = [
  'qr-generator',
  'swot-generator',
  'business-model-canvas',
  'gantt-chart',
  'gallup-kompasrose',
  'tows-matrix',
  'porters-five-forces',
  'value-proposition-canvas',
  'empathy-map',
  'card-sorting',
  'maslow-model',
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]
