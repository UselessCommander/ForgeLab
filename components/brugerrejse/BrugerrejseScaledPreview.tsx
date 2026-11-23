'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { JourneyData } from '@/lib/brugerrejse'
import { journeyNaturalWidth } from '@/lib/brugerrejse'
import { BrugerrejseReadonlyBoard } from './BrugerrejseReadonlyBoard'

/**
 * Fixed scale + tall viewport. Columns are fixed-width (no 1fr grow) so the
 * map keeps a natural aspect instead of stretching across a wide board card.
 */
const PREVIEW_VIEWPORT_HEIGHT = 720
const PREVIEW_SCALE = 0.9
const PREVIEW_STEP_MIN_PX = 184
const PREVIEW_CURVE_HEIGHT = 120

export function BrugerrejseScaledPreview({
  data,
  loading,
}: {
  data: JourneyData
  loading: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [spacer, setSpacer] = useState({ width: 0, height: 0 })
  const [ready, setReady] = useState(false)

  const contentWidth = journeyNaturalWidth(data, PREVIEW_STEP_MIN_PX)

  useLayoutEffect(() => {
    if (loading) {
      setReady(false)
      return
    }

    const measure = () => {
      const content = contentRef.current
      if (!content) return

      const naturalW = content.offsetWidth
      const naturalH = content.offsetHeight
      if (naturalW <= 0 || naturalH <= 0) return

      setSpacer({
        width: Math.ceil(naturalW * PREVIEW_SCALE),
        height: Math.ceil(naturalH * PREVIEW_SCALE),
      })
      setReady(true)
    }

    measure()

    const ro = new ResizeObserver(measure)
    if (contentRef.current) ro.observe(contentRef.current)

    return () => ro.disconnect()
  }, [data, loading])

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-full animate-pulse rounded-lg border border-cyan-100 bg-cyan-50/30"
        style={{ height: PREVIEW_VIEWPORT_HEIGHT }}
      />
    )
  }

  return (
    <div
      className="w-full overflow-auto rounded-lg border border-cyan-100 bg-white shadow-inner"
      style={{ height: PREVIEW_VIEWPORT_HEIGHT }}
    >
      <div
        style={{
          width: spacer.width || Math.ceil(contentWidth * PREVIEW_SCALE),
          height: spacer.height || undefined,
          position: 'relative',
          opacity: ready ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
            width: contentWidth,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <BrugerrejseReadonlyBoard
            data={data}
            stepMinPx={PREVIEW_STEP_MIN_PX}
            curveHeightPx={PREVIEW_CURVE_HEIGHT}
            fixedStepCols
          />
        </div>
      </div>
    </div>
  )
}
