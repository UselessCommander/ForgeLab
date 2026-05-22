'use client'

import { memo } from 'react'
import type { AlignmentGuide } from '@/lib/board-alignment-guides'

type BoardAlignmentGuidesProps = {
  guides: AlignmentGuide[]
}

function BoardAlignmentGuidesInner({ guides }: BoardAlignmentGuidesProps) {
  if (guides.length === 0) return null

  const pad = 40

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 997,
      }}
    >
      {guides.map((guide, i) => {
        if (guide.orientation === 'vertical') {
          return (
            <line
              key={`align-v-${i}-${guide.position}`}
              x1={guide.position}
              y1={guide.start - pad}
              x2={guide.position}
              y2={guide.end + pad}
              stroke="#EC4899"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          )
        }
        return (
          <line
            key={`align-h-${i}-${guide.position}`}
            x1={guide.start - pad}
            y1={guide.position}
            x2={guide.end + pad}
            y2={guide.position}
            stroke="#EC4899"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )
      })}
    </svg>
  )
}

const BoardAlignmentGuides = memo(BoardAlignmentGuidesInner)
export default BoardAlignmentGuides
