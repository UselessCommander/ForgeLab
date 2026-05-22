'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import styles from './peso.module.css'
import type { PesoModelData } from './peso-data'
import { PesoReadonlyDiagram } from './PesoReadonlyBoard'
import PesoReportCards from './PesoReportCards'

const MAX_DIAGRAM_PREVIEW_HEIGHT = 560

export function PesoScaledPreview({
  data,
  loading,
}: {
  data: PesoModelData
  loading: boolean
}) {
  const diagramContainerRef = useRef<HTMLDivElement>(null)
  const diagramContentRef = useRef<HTMLDivElement>(null)
  const [diagramLayout, setDiagramLayout] = useState({ scale: 0.65, height: 400, width: 520 })

  useLayoutEffect(() => {
    if (loading) return

    const measure = () => {
      const container = diagramContainerRef.current
      const content = diagramContentRef.current
      if (!container || !content) return

      const naturalW = content.offsetWidth
      const naturalH = content.offsetHeight
      if (naturalW <= 0 || naturalH <= 0) return

      const parentW = container.parentElement?.clientWidth ?? naturalW
      const scaleW = parentW / naturalW
      const scaleH = MAX_DIAGRAM_PREVIEW_HEIGHT / naturalH
      const scale = Math.min(scaleW, scaleH, 1)

      setDiagramLayout({
        scale,
        width: Math.ceil(naturalW * scale),
        height: Math.ceil(naturalH * scale),
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    if (diagramContainerRef.current?.parentElement) {
      ro.observe(diagramContainerRef.current.parentElement)
    }

    return () => ro.disconnect()
  }, [data, loading])

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-full animate-pulse rounded-lg border border-amber-100 bg-amber-50/40"
        style={{ height: 400 }}
      />
    )
  }

  return (
    <div className={styles.boardPreview}>
      <div className={styles.boardPreviewDiagram}>
        <div
          ref={diagramContainerRef}
          className="overflow-hidden rounded-lg border border-amber-100 bg-white shadow-inner"
          style={{
            width: diagramLayout.width,
            height: diagramLayout.height,
            maxWidth: '100%',
          }}
        >
          <div
            ref={diagramContentRef}
            style={{
              transform: `scale(${diagramLayout.scale})`,
              transformOrigin: 'top left',
              width: 'max-content',
            }}
          >
            <PesoReadonlyDiagram data={data} />
          </div>
        </div>
      </div>

      <section className={styles.boardPreviewReports} aria-label="PESO-dokumentation">
        <PesoReportCards data={data} compact />
      </section>
    </div>
  )
}
