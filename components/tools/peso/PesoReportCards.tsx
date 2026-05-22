'use client'

import { memo } from 'react'
import styles from './peso.module.css'
import { PESO_FIELD_ORDER, type PesoModelData } from './peso-data'

type PesoReportCardsProps = {
  data: PesoModelData
  compact?: boolean
}

function PesoReportCardsInner({ data, compact = false }: PesoReportCardsProps) {
  return (
    <div className={compact ? styles.reportGridBoard : styles.reportGrid}>
      {PESO_FIELD_ORDER.map(id => {
        const field = data[id]
        const hasContent = field.description.trim().length > 0
        return (
          <article
            key={id}
            className={compact ? styles.reportCardBoard : styles.reportCard}
            style={{ borderTopColor: field.color }}
          >
            <span className={styles.reportCardLabel}>{field.label}</span>
            <h3 className={compact ? styles.reportCardTitleBoard : styles.reportCardTitle}>
              {field.title}
            </h3>
            <p
              className={`${compact ? styles.reportCardBodyBoard : styles.reportCardBody} ${!hasContent ? styles.reportCardEmpty : ''}`}
            >
              {hasContent ? field.description : 'Ingen beskrivelse angivet.'}
            </p>
          </article>
        )
      })}
    </div>
  )
}

const PesoReportCards = memo(PesoReportCardsInner)
export default PesoReportCards
