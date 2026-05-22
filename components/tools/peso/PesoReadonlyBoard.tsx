'use client'

import { memo } from 'react'
import styles from './peso.module.css'
import PesoModelDiagram from './PesoModelDiagram'
import PesoReportCards from './PesoReportCards'
import type { PesoModelData } from './peso-data'

type PesoReadonlyBoardProps = {
  data: PesoModelData
}

function PesoReadonlyDiagramInner({ data }: PesoReadonlyBoardProps) {
  return (
    <section
      className={`${styles.readonlyDiagram} ${styles.readonlyDiagramNatural}`}
      aria-label="PESO-diagram"
    >
      <PesoModelDiagram data={data} />
    </section>
  )
}

function PesoReadonlyBoardInner({ data }: PesoReadonlyBoardProps) {
  return (
    <div className={styles.readonlyBoard}>
      <PesoReadonlyDiagram data={data} />
      <section className={styles.readonlyReport} aria-label="PESO-dokumentation">
        <PesoReportCards data={data} />
      </section>
    </div>
  )
}

export const PesoReadonlyDiagram = memo(PesoReadonlyDiagramInner)
export const PesoReadonlyBoard = memo(PesoReadonlyBoardInner)
