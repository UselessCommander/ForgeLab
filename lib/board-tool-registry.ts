import type { ToolSlug } from '@/lib/tool-slugs'

/** How a tool may render on the project board. */
export type BoardToolMode = 'interactive' | 'preview-only' | 'focus-only'

export type BoardToolRegistryEntry = {
  slug: ToolSlug | string
  boardMode: BoardToolMode
}

/** Heavy or dedicated-page tools — preview on board, full UI in focus overlay. */
const FOCUS_ONLY_SLUGS = new Set<string>([
  'brugerrejse',
  'service-blueprint',
  'peso',
  'golden-circle',
  'survey-template',
  'card-sorting',
  'qr-generator',
  'gantt-chart',
  'kanban',
])

const PREVIEW_ONLY_SLUGS = new Set<string>([])

export function getBoardToolMode(slug: string): BoardToolMode {
  if (FOCUS_ONLY_SLUGS.has(slug)) return 'focus-only'
  if (PREVIEW_ONLY_SLUGS.has(slug)) return 'preview-only'
  return 'interactive'
}

export function isFocusOnlyBoardTool(slug: string): boolean {
  return getBoardToolMode(slug) === 'focus-only'
}

export function canActivateOnBoard(slug: string): boolean {
  return getBoardToolMode(slug) === 'interactive'
}

/** Wide preview cards (legacy layout hints). */
export function isWideBoardPreviewSlug(slug: string): boolean {
  return (
    slug === 'service-blueprint' ||
    slug === 'brugerrejse' ||
    slug === 'peso' ||
    slug === 'golden-circle'
  )
}
