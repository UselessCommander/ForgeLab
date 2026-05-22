import type { AlignmentGuide } from '@/lib/board-alignment-guides'

export type BoardPoint = { x: number; y: number }

export function sameBoardPoint(a: BoardPoint, b: BoardPoint): boolean {
  return a.x === b.x && a.y === b.y
}

export function setRecordPositionIfChanged(
  prev: Record<string, BoardPoint>,
  id: string,
  pos: BoardPoint
): Record<string, BoardPoint> {
  const cur = prev[id]
  if (cur && sameBoardPoint(cur, pos)) return prev
  return { ...prev, [id]: pos }
}

export function patchRecordPositionsIfChanged(
  prev: Record<string, BoardPoint>,
  updates: Record<string, BoardPoint>
): Record<string, BoardPoint> {
  let changed = false
  const next = { ...prev }
  for (const [id, pos] of Object.entries(updates)) {
    const cur = prev[id]
    if (cur && sameBoardPoint(cur, pos)) continue
    next[id] = pos
    changed = true
  }
  return changed ? next : prev
}

export function mapEntityPositionIfChanged<T extends { id: string; x: number; y: number }>(
  items: T[],
  id: string,
  x: number,
  y: number
): T[] | null {
  let changed = false
  const next = items.map(item => {
    if (item.id !== id) return item
    if (item.x === x && item.y === y) return item
    changed = true
    return { ...item, x, y }
  })
  return changed ? next : null
}

export function mapEntityGroupDeltaIfChanged<T extends { id: string; x: number; y: number }>(
  items: T[],
  ids: string[],
  startById: Record<string, BoardPoint>,
  dx: number,
  dy: number,
  snap: (x: number, y: number) => BoardPoint
): T[] | null {
  let changed = false
  const idSet = new Set(ids)
  const next = items.map(item => {
    if (!idSet.has(item.id)) return item
    const init = startById[item.id]
    if (!init) return item
    const p = snap(init.x + dx, init.y + dy)
    if (item.x === p.x && item.y === p.y) return item
    changed = true
    return { ...item, x: p.x, y: p.y }
  })
  return changed ? next : null
}

export type LiveCursorView = {
  userId: string
  username: string
  x: number
  y: number
  visible: boolean
  color: string
}

export function liveCursorsEqual(
  a: Record<string, LiveCursorView>,
  b: Record<string, LiveCursorView>,
  epsilon = 0.5
): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    const ca = a[key]
    const cb = b[key]
    if (!ca || !cb) return false
    if (ca.visible !== cb.visible) return false
    if (Math.abs(ca.x - cb.x) > epsilon || Math.abs(ca.y - cb.y) > epsilon) return false
    if (ca.username !== cb.username || ca.color !== cb.color) return false
  }
  return true
}

export { alignmentGuidesEqual } from '@/lib/board-alignment-guides'
