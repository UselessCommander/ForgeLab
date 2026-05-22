export type DvfId = 'desirability' | 'viability' | 'feasibility'
export type DvfRole = 'left' | 'right' | 'bottom'

export type DvfCircle = {
  id: DvfId
  role: DvfRole
  title: string
  subtitle: string
  prompt: string
  cx: number
  cy: number
  fill: string
  activeFill: string
}

export type DvfValues = Record<DvfId, string>

export type Placement = {
  x: number
  y: number
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

type VerticalInterval = {
  minY: number
  maxY: number
}

export const VIEWBOX_WIDTH = 900
export const VIEWBOX_HEIGHT = 860
export const MODEL_CENTER_X = VIEWBOX_WIDTH / 2
export const RADIUS = 245

const TOP_Y = 290
const HORIZONTAL_SPREAD = 150
const BOTTOM_Y = TOP_Y + Math.sqrt(3) * HORIZONTAL_SPREAD

export const LABEL_WIDTH = 300
export const LABEL_HEIGHT = 88
export const INPUT_WIDTH = 290
export const INPUT_HEIGHT = 118
export const SWEET_SPOT_TEXT_WIDTH = 210
export const SWEET_SPOT_TEXT_HEIGHT = 84

export const DVF_CIRCLES: DvfCircle[] = [
  {
    id: 'desirability',
    role: 'left',
    title: 'Desirability',
    subtitle: 'BRUGERBEHOV',
    prompt: 'Hvad gør konceptet ønskværdigt for brugeren?',
    cx: MODEL_CENTER_X - HORIZONTAL_SPREAD,
    cy: TOP_Y,
    fill: 'rgba(244, 63, 94, 0.68)',
    activeFill: 'rgba(244, 63, 94, 0.82)',
  },
  {
    id: 'viability',
    role: 'right',
    title: 'Viability',
    subtitle: 'FORRETNING',
    prompt: 'Hvorfor giver konceptet strategisk eller økonomisk mening?',
    cx: MODEL_CENTER_X + HORIZONTAL_SPREAD,
    cy: TOP_Y,
    fill: 'rgba(59, 130, 246, 0.68)',
    activeFill: 'rgba(59, 130, 246, 0.82)',
  },
  {
    id: 'feasibility',
    role: 'bottom',
    title: 'Feasibility',
    subtitle: 'TEKNIK OG RESSOURCER',
    prompt: 'Kan vi realistisk bygge og implementere det?',
    cx: MODEL_CENTER_X,
    cy: BOTTOM_Y,
    fill: 'rgba(34, 197, 94, 0.68)',
    activeFill: 'rgba(34, 197, 94, 0.82)',
  },
]

export const DVF_EMPTY_VALUES: DvfValues = {
  desirability: '',
  viability: '',
  feasibility: '',
}

function getCircleVerticalInterval(circle: DvfCircle, x: number): VerticalInterval | null {
  const dx = x - circle.cx
  const inside = RADIUS * RADIUS - dx * dx
  if (inside < 0) return null
  const offset = Math.sqrt(inside)
  return { minY: circle.cy - offset, maxY: circle.cy + offset }
}

function isPointInsideCircle(point: Point, circle: DvfCircle): boolean {
  const dx = point.x - circle.cx
  const dy = point.y - circle.cy
  return dx * dx + dy * dy <= RADIUS * RADIUS
}

export function getTripleOverlapCenter(allCircles: DvfCircle[]): Point {
  const step = 1
  const minX = Math.max(...allCircles.map((circle) => circle.cx - RADIUS))
  const maxX = Math.min(...allCircles.map((circle) => circle.cx + RADIUS))

  let area = 0
  let momentX = 0
  let momentY = 0

  for (let x = minX; x <= maxX; x += step) {
    const intervals = allCircles
      .map((circle) => getCircleVerticalInterval(circle, x))
      .filter((interval): interval is VerticalInterval => interval !== null)

    if (intervals.length !== allCircles.length) continue

    const lowerY = Math.max(...intervals.map((interval) => interval.minY))
    const upperY = Math.min(...intervals.map((interval) => interval.maxY))
    const height = upperY - lowerY
    if (height <= 0) continue

    const stripArea = height * step
    area += stripArea
    momentX += x * stripArea
    momentY += ((upperY * upperY - lowerY * lowerY) / 2) * step
  }

  if (area === 0) {
    return { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }
  }

  return { x: momentX / area, y: momentY / area }
}

export function getLabelPlacement(circle: DvfCircle): Placement {
  const labelCenterY = circle.role === 'bottom' ? circle.cy - 24 : circle.cy - 100
  return {
    x: circle.cx - LABEL_WIDTH / 2,
    y: labelCenterY - LABEL_HEIGHT / 2,
    width: LABEL_WIDTH,
    height: LABEL_HEIGHT,
  }
}

export function getInputPlacement(circle: DvfCircle): Placement {
  const inputCenterY = circle.role === 'bottom' ? circle.cy + 138 : circle.cy + 28
  return {
    x: circle.cx - INPUT_WIDTH / 2,
    y: inputCenterY - INPUT_HEIGHT / 2,
    width: INPUT_WIDTH,
    height: INPUT_HEIGHT,
  }
}

export function getSweetSpotTextPlacement(sweetSpot: Point): Placement {
  return {
    x: sweetSpot.x - SWEET_SPOT_TEXT_WIDTH / 2,
    y: sweetSpot.y - SWEET_SPOT_TEXT_HEIGHT / 2,
    width: SWEET_SPOT_TEXT_WIDTH,
    height: SWEET_SPOT_TEXT_HEIGHT,
  }
}

export function normalizeDvfValues(raw: Partial<DvfValues> | undefined): DvfValues {
  const base = { ...DVF_EMPTY_VALUES }
  if (!raw) return base
  for (const circle of DVF_CIRCLES) {
    const value = raw[circle.id]
    if (typeof value === 'string') base[circle.id] = value
  }
  return base
}

/** Dev-only geometry sanity checks */
export function runDvfSmokeTests() {
  const center = getTripleOverlapCenter(DVF_CIRCLES)
  const distTop = Math.hypot(DVF_CIRCLES[0].cx - DVF_CIRCLES[1].cx, DVF_CIRCLES[0].cy - DVF_CIRCLES[1].cy)
  const distLeftBottom = Math.hypot(
    DVF_CIRCLES[0].cx - DVF_CIRCLES[2].cx,
    DVF_CIRCLES[0].cy - DVF_CIRCLES[2].cy,
  )
  const distRightBottom = Math.hypot(
    DVF_CIRCLES[1].cx - DVF_CIRCLES[2].cx,
    DVF_CIRCLES[1].cy - DVF_CIRCLES[2].cy,
  )

  console.assert(Number.isFinite(center.x), 'Sweet spot x should be finite')
  console.assert(Number.isFinite(center.y), 'Sweet spot y should be finite')
  console.assert(
    DVF_CIRCLES.every((circle) => isPointInsideCircle(center, circle)),
    'Sweet spot should sit inside all three circles',
  )
  console.assert(DVF_CIRCLES.length === 3, 'DVF Venn model should render exactly three circles')
  console.assert(Math.abs(distTop - distLeftBottom) < 0.01, 'Top and left-bottom distances should match')
  console.assert(Math.abs(distTop - distRightBottom) < 0.01, 'Top and right-bottom distances should match')
}
