'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { JourneyData } from '@/lib/brugerrejse'
import { BrugerrejseReadonlyBoard } from './BrugerrejseReadonlyBoard'

const MAX_PREVIEW_HEIGHT = 640
const PREVIEW_STEP_MIN_PX = 160

export function BrugerrejseScaledPreview({
  data,
  loading,
}: {
  data: JourneyData
  loading: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ scale: 0.45, height: 400, width: 520 })

  useLayoutEffect(() => {
    if (loading) return

    const measure = () => {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return

      const naturalW = content.offsetWidth
      const naturalH = content.offsetHeight
      if (naturalW <= 0 || naturalH <= 0) return

      const parentW = container.parentElement?.clientWidth ?? naturalW
      const scaleW = parentW / naturalW
      const scaleH = MAX_PREVIEW_HEIGHT / naturalH
      const scale = Math.min(scaleW, scaleH, 1)

      setLayout({
        scale,
        width: Math.ceil(naturalW * scale),
        height: Math.ceil(naturalH * scale),
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    if (containerRef.current?.parentElement) {
      ro.observe(containerRef.current.parentElement)
    }

    return () => ro.disconnect()
  }, [data, loading])

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-full animate-pulse rounded-lg border border-cyan-100 bg-cyan-50/30"
        style={{ height: 400 }}
      />
    )
  }

  return (
    <div className="flex w-full justify-center">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border border-cyan-100 bg-white shadow-inner"
        style={{ width: layout.width, height: layout.height, maxWidth: '100%' }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${layout.scale})`,
            transformOrigin: 'top left',
            width: 'max-content',
          }}
        >
          <BrugerrejseReadonlyBoard data={data} stepMinPx={PREVIEW_STEP_MIN_PX} />
        </div>
      </div>
    </div>
  )
}
