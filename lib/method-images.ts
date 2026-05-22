/** Offentlige stier til metodebilleder under /public/metoder/[slug]/ */

export function getMethodImagePath(slug: string, filename: string): string {
  return `/metoder/${slug}/${filename}`
}

const BMC = 'business-model-canvas'

export const BUSINESS_MODEL_CANVAS_IMAGES = {
  overview: getMethodImagePath(BMC, 'BMC-Overview.webp'),
  keyPartnerships: getMethodImagePath(BMC, 'BMC-Key-Partnerships.webp'),
  keyActivities: getMethodImagePath(BMC, 'BMC-Key-Activities.webp'),
  keyResources: getMethodImagePath(BMC, 'BMC-Key-Resources.webp'),
  valueProposition: getMethodImagePath(BMC, 'BMC-Value-Proporsition.webp'),
  customerRelationships: getMethodImagePath(BMC, 'BMC-Customer-Relationship.webp'),
  channels: getMethodImagePath(BMC, 'BMC-Channels.webp'),
  customerSegments: getMethodImagePath(BMC, 'BMC-Customer-Segment.webp'),
  costStructure: getMethodImagePath(BMC, 'BMC-Cost-Structure.webp'),
  revenueStreams: getMethodImagePath(BMC, 'BMC-Revenue-Streams.webp'),
} as const
