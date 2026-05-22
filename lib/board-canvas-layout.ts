/** Legacy board layout used 0–1 coords relative to a fixed 1600×900 viewBox. */
const LEGACY_LAYOUT_REF_W = 1600
const LEGACY_LAYOUT_REF_H = 900

export type BoardCanvasPosition = { x: number; y: number }

function isLegacyNormalizedPosition(x: number, y: number): boolean {
  return x >= 0 && x <= 1 && y >= 0 && y <= 1
}

/** DB / API layout → absolute world pixels on the infinite canvas. */
export function boardLayoutToCardPositions(
  layout: Record<string, BoardCanvasPosition>
): Record<string, BoardCanvasPosition> {
  const out: Record<string, BoardCanvasPosition> = {}
  for (const [slug, pos] of Object.entries(layout)) {
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') continue
    if (isLegacyNormalizedPosition(pos.x, pos.y)) {
      out[slug] = {
        x: Math.round(pos.x * LEGACY_LAYOUT_REF_W),
        y: Math.round(pos.y * LEGACY_LAYOUT_REF_H),
      }
    } else {
      out[slug] = { x: Math.round(pos.x), y: Math.round(pos.y) }
    }
  }
  return out
}

/** Absolute world pixels → persisted layout (pixel coords, not clamped to 0–1). */
export function cardPositionsToBoardLayout(
  positions: Record<string, BoardCanvasPosition>
): Record<string, BoardCanvasPosition> {
  const out: Record<string, BoardCanvasPosition> = {}
  for (const [slug, { x, y }] of Object.entries(positions)) {
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue
    }
    out[slug] = { x: Math.round(x), y: Math.round(y) }
  }
  return out
}
