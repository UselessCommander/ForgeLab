'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { JourneyData } from '@/lib/brugerrejse'
import { BrugerrejseReadonlyBoard } from './BrugerrejseReadonlyBoard'

/**
 * Board preview must stay readable. Fitting the full map to card width was
 * crushing text. Keep a minimum scale and a tall viewport; overflow scrolls
 * instead of shrinking further.
 */
const PREVIEW_VIEWPORT_HEIGHT = 720
const MIN_READABLE_SCALE = 0.85
const PREVIEW_STEP_MIN_PX = 148
const PREVIEW_CURVE_HEIGHT = 120

export function BrugerrejseScaledPreview({
  data,
  loading,
}: {
  data: JourneyData
  loading: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ scale: MIN_READABLE_SCALE, width: 900, height: 900 })

  useLayoutEffect(() => {
    if (loading) return

    const measure = () => {
      const viewport = viewportRef.current
      const content = contentRef.current
      if (!viewport || !content) return

      const naturalW = content.offsetWidth
      const naturalH = content.offsetHeight
      if (naturalW <= 0 || naturalH <= 0) return

      const availableW = viewport.clientWidth
      if (availableW <= 0) return

      const scaleW = availableW / naturalW
      const scale = Math.min(1, Math.max(scaleW, MIN_READABLE_SCALE))

      setLayout({
        scale,
        width: Math.ceil(naturalW * scale),
        height: Math.ceil(naturalH * scale),
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(viewportRef.current)
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
      ref={viewportRef}
      className="w-full overflow-auto rounded-lg border border-cyan-100 bg-white shadow-inner"
      style={{ height: PREVIEW_VIEWPORT_HEIGHT }}
    >
      {/* Spacer matches visual size after CSS scale so scrollbars are correct. */}
      <div style={{ width: layout.width, height: layout.height, position: 'relative' }}>
        <div
          ref={contentRef}
          style={{
            transform: `scale(${layout.scale})`,
            transformOrigin: 'top left',
            width: 'max-content',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <BrugerrejseReadonlyBoard
            data={data}
            stepMinPx={PREVIEW_STEP_MIN_PX}
            curveHeightPx={PREVIEW_CURVE_HEIGHT}
          />
        </div>
      </div>
    </div>
  )
}
