export type SnapRect = {
  left: number
  top: number
  width: number
  height: number
}

export type AlignmentGuide = {
  orientation: 'vertical' | 'horizontal'
  position: number
  start: number
  end: number
}

export type BoardSnapExclude = {
  cardSlugs?: string[]
  flowNodeIds?: string[]
  stickyNoteIds?: string[]
  sectionIds?: string[]
  commentIds?: string[]
  freeTextIds?: string[]
  imageIds?: string[]
}

export const BOARD_ALIGN_THRESHOLD = 6

/** Skip React state updates when snap guides are unchanged. */
export function alignmentGuidesEqual(a: AlignmentGuide[], b: AlignmentGuide[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ga = a[i]
    const gb = b[i]
    if (
      ga.orientation !== gb.orientation ||
      ga.position !== gb.position ||
      ga.start !== gb.start ||
      ga.end !== gb.end
    ) {
      return false
    }
  }
  return true
}

function rectEdges(rect: SnapRect) {
  return {
    left: rect.left,
    right: rect.left + rect.width,
    top: rect.top,
    bottom: rect.top + rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  }
}

/** Snap position + magenta alignment guides (Figma-style). */
export function computeAlignmentSnap(
  x: number,
  y: number,
  width: number,
  height: number,
  targets: SnapRect[],
  threshold = BOARD_ALIGN_THRESHOLD
): { x: number; y: number; guides: AlignmentGuide[] } {
  if (targets.length === 0 || width <= 0 || height <= 0) {
    return { x, y, guides: [] }
  }

  const moving = rectEdges({ left: x, top: y, width, height })

  type XMatch = { delta: number; guideX: number; spanStart: number; spanEnd: number }
  type YMatch = { delta: number; guideY: number; spanStart: number; spanEnd: number }

  const xMatches: XMatch[] = []
  const yMatches: YMatch[] = []

  for (const targetRect of targets) {
    const target = rectEdges(targetRect)
    const spanYStart = Math.min(moving.top, target.top)
    const spanYEnd = Math.max(moving.bottom, target.bottom)
    const spanXStart = Math.min(moving.left, target.left)
    const spanXEnd = Math.max(moving.right, target.right)

    const xPairs: [number, number][] = [
      [moving.left, target.left],
      [moving.left, target.centerX],
      [moving.left, target.right],
      [moving.centerX, target.left],
      [moving.centerX, target.centerX],
      [moving.centerX, target.right],
      [moving.right, target.left],
      [moving.right, target.centerX],
      [moving.right, target.right],
    ]
    for (const [mv, tv] of xPairs) {
      const delta = tv - mv
      if (Math.abs(delta) <= threshold) {
        xMatches.push({ delta, guideX: tv, spanStart: spanYStart, spanEnd: spanYEnd })
      }
    }

    const yPairs: [number, number][] = [
      [moving.top, target.top],
      [moving.top, target.centerY],
      [moving.top, target.bottom],
      [moving.centerY, target.top],
      [moving.centerY, target.centerY],
      [moving.centerY, target.bottom],
      [moving.bottom, target.top],
      [moving.bottom, target.centerY],
      [moving.bottom, target.bottom],
    ]
    for (const [mv, tv] of yPairs) {
      const delta = tv - mv
      if (Math.abs(delta) <= threshold) {
        yMatches.push({ delta, guideY: tv, spanStart: spanXStart, spanEnd: spanXEnd })
      }
    }
  }

  let dx = 0
  let dy = 0
  const guides: AlignmentGuide[] = []

  if (xMatches.length > 0) {
    xMatches.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    dx = xMatches[0].delta
    for (const m of xMatches) {
      if (Math.abs(m.delta - dx) > 0.5) continue
      guides.push({
        orientation: 'vertical',
        position: m.guideX,
        start: m.spanStart,
        end: m.spanEnd,
      })
    }
  }

  if (yMatches.length > 0) {
    yMatches.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    dy = yMatches[0].delta
    for (const m of yMatches) {
      if (Math.abs(m.delta - dy) > 0.5) continue
      guides.push({
        orientation: 'horizontal',
        position: m.guideY,
        start: m.spanStart,
        end: m.spanEnd,
      })
    }
  }

  return { x: x + dx, y: y + dy, guides: dedupeGuides(guides) }
}

function dedupeGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  const seen = new Set<string>()
  const out: AlignmentGuide[] = []
  for (const g of guides) {
    const key = `${g.orientation}:${g.position}:${g.start}:${g.end}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(g)
  }
  return out
}
