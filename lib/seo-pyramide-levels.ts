export type SeoPyramideLevel = {
  id: string
  title: string
  placeholder: string
  textWidth: string
  color: string
  borderColor: string
  textColor: string
}

/** Top → bottom (featured → crawlable) */
export const SEO_PYRAMIDE_LEVELS: SeoPyramideLevel[] = [
  {
    id: 'level6',
    title: 'Be Featured',
    placeholder: 'Show in special SERP features...',
    textWidth: 'w-[82%]',
    color: '#b45309',
    borderColor: '#f59e0b',
    textColor: '#ffffff',
  },
  {
    id: 'level5',
    title: 'Be Enticing To Click',
    placeholder: 'Titles, descriptions & CTR...',
    textWidth: 'w-[75%]',
    color: '#d97706',
    borderColor: '#f59e0b',
    textColor: '#ffffff',
  },
  {
    id: 'level4',
    title: 'Be Shareworthy',
    placeholder: 'Helpful & highly shareable content...',
    textWidth: 'w-[80%]',
    color: '#f59e0b',
    borderColor: '#fbbf24',
    textColor: '#111827',
  },
  {
    id: 'level3',
    title: 'Be Easy To Use',
    placeholder: 'Speed, mobile responsiveness & UX...',
    textWidth: 'w-[84%]',
    color: '#fbbf24',
    borderColor: '#fcd34d',
    textColor: '#111827',
  },
  {
    id: 'level2',
    title: 'Be Optimised',
    placeholder: 'Keywords, entities & on-page SEO...',
    textWidth: 'w-[88%]',
    color: '#fcd34d',
    borderColor: '#fde68a',
    textColor: '#111827',
  },
  {
    id: 'level1',
    title: 'Be Interesting',
    placeholder: 'High value content answering user intent...',
    textWidth: 'w-[92%]',
    color: '#fde68a',
    borderColor: '#fcd34d',
    textColor: '#111827',
  },
  {
    id: 'level0',
    title: 'Be Crawlable',
    placeholder: 'Sitemaps, robots.txt, rendering & status...',
    textWidth: 'w-[96%]',
    color: '#fef3c7',
    borderColor: '#fcd34d',
    textColor: '#111827',
  },
]

export const SEO_PYRAMIDE_HEIGHT_UNITS = [2.5, 1, 1, 1, 1, 1, 1] as const

export function getPyramidLayerGeometry(index: number) {
  const heightUnits = SEO_PYRAMIDE_HEIGHT_UNITS
  const totalHeightUnits = heightUnits.reduce((sum, unit) => sum + unit, 0)
  const topUnits = heightUnits.slice(0, index).reduce((sum, unit) => sum + unit, 0)
  const bottomUnits = topUnits + heightUnits[index]
  const topWidthPercent = (topUnits / totalHeightUnits) * 100
  const bottomWidthPercent = (bottomUnits / totalHeightUnits) * 100
  const relativeTopWidth = topWidthPercent / bottomWidthPercent
  const leftInset = ((1 - relativeTopWidth) / 2) * 100
  const rightInset = 100 - leftInset
  const clipPath = `polygon(${leftInset.toFixed(4)}% 0%, ${rightInset.toFixed(4)}% 0%, 100% 100%, 0% 100%)`

  return {
    widthPercent: bottomWidthPercent,
    heightUnits: heightUnits[index],
    clipPath,
  }
}

export type SeoPyramideData = Record<string, string>

export function defaultSeoPyramideData(): SeoPyramideData {
  return Object.fromEntries(SEO_PYRAMIDE_LEVELS.map((l) => [l.id, '']))
}

export function normalizeSeoPyramideData(raw: Partial<SeoPyramideData> | undefined): SeoPyramideData {
  const base = defaultSeoPyramideData()
  if (!raw) return base
  for (const level of SEO_PYRAMIDE_LEVELS) {
    const value = raw[level.id]
    if (typeof value === 'string') base[level.id] = value
  }
  return base
}
