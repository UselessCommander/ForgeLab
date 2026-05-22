/** World-space overscan around the visible board viewport (px). */
export const BOARD_VIEWPORT_OVERSCAN_PX = 1000

export type WorldBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function padWorldBounds(bounds: WorldBounds, pad: number): WorldBounds {
  return {
    minX: bounds.minX - pad,
    minY: bounds.minY - pad,
    maxX: bounds.maxX + pad,
    maxY: bounds.maxY + pad,
  }
}

export function worldBoundsIntersect(a: WorldBounds, b: WorldBounds): boolean {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY
}

/** Visible board area in world coordinates from pan/zoom and canvas size (screen px). */
export function getBoardViewportBounds(
  panX: number,
  panY: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number
): WorldBounds {
  const z = Math.max(zoom, 0.0001)
  return {
    minX: -panX / z,
    minY: -panY / z,
    maxX: (viewportWidth - panX) / z,
    maxY: (viewportHeight - panY) / z,
  }
}

export function isRectInViewport(
  rect: WorldBounds,
  viewport: WorldBounds,
  overscanPx = BOARD_VIEWPORT_OVERSCAN_PX
): boolean {
  return worldBoundsIntersect(rect, padWorldBounds(viewport, overscanPx))
}
