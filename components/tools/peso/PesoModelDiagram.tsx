'use client'

import { memo, useId } from 'react'
import styles from './peso.module.css'
import { PESO_HIT_RENDER_ORDER, PESO_ZONES, type PesoFieldId, type PesoModelData } from './peso-data'
import { PesoZoneShapeSvg } from './PesoZoneShape'

type PesoModelDiagramProps = {
  data?: PesoModelData
  activeFieldId?: PesoFieldId | null
  onSelectField?: (id: PesoFieldId) => void
}

const OVERLAP_LABELS: {
  x: number
  y: number
  rotate: number
  label: string
}[] = [
  { x: 350, y: 275, rotate: 48, label: 'Paid & Earned' },
  { x: 550, y: 275, rotate: -48, label: 'Earned & Shared' },
  { x: 560, y: 450, rotate: 48, label: 'Shared & Owned' },
  { x: 340, y: 450, rotate: -48, label: 'Owned & Paid' },
]

function PesoModelDiagramInner({
  data,
  activeFieldId = null,
  onSelectField,
}: PesoModelDiagramProps) {
  const interactive = Boolean(onSelectField)
  const shadowId = `pesoSoftShadow-${useId().replace(/:/g, '')}`

  const handleSelect = (id: PesoFieldId) => {
    if (interactive && onSelectField) onSelectField(id)
  }

  const handleKeySelect = (id: PesoFieldId) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(id)
    }
  }

  return (
    <div className={styles.pesoModel}>
      <svg viewBox="0 0 900 720" aria-label="PESO modellen" role="img">
        <defs>
          <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="18"
              floodColor="#111827"
              floodOpacity="0.14"
            />
          </filter>
        </defs>

        <circle className={styles.pesoCircle} cx="450" cy="210" r="170" fill="var(--earned)" />
        <circle className={styles.pesoCircle} cx="280" cy="360" r="170" fill="var(--paid)" />
        <circle className={styles.pesoCircle} cx="620" cy="360" r="170" fill="var(--shared)" />
        <circle className={styles.pesoCircle} cx="450" cy="510" r="170" fill="var(--owned)" />

        <circle
          className={styles.pesoCore}
          cx="450"
          cy="360"
          r="66"
          fill="var(--core)"
          filter={`url(#${shadowId})`}
        />

        {PESO_HIT_RENDER_ORDER.map(id => (
          <PesoZoneShapeSvg
            key={`marker-${id}`}
            zone={PESO_ZONES[id]}
            className={`${styles.pesoMarker} ${activeFieldId === id ? styles.pesoMarkerIsActive : ''}`}
          />
        ))}

        <text className={styles.pesoLabelMain} x="450" y="150">
          Earned
        </text>
        <text className={styles.pesoLabelMain} x="230" y="360">
          Paid
        </text>
        <text className={styles.pesoLabelMain} x="670" y="360">
          Shared
        </text>
        <text className={styles.pesoLabelMain} x="450" y="590">
          Owned
        </text>

        {OVERLAP_LABELS.map(({ x, y, rotate, label }) => (
          <text
            key={label}
            className={styles.pesoLabelSub}
            x={x}
            y={y}
            transform={`rotate(${rotate} ${x} ${y})`}
          >
            {label}
          </text>
        ))}

        <text className={styles.pesoLabelCore} x="450" y="360">
          Ry
        </text>

        {interactive &&
          PESO_HIT_RENDER_ORDER.map(id => (
            <PesoZoneShapeSvg
              key={`hit-${id}`}
              zone={PESO_ZONES[id]}
              className={styles.pesoHitArea}
              onClick={() => handleSelect(id)}
              onKeyDown={handleKeySelect(id)}
              role="button"
              tabIndex={0}
              aria-label={`Rediger ${data?.[id]?.label ?? id}`}
            />
          ))}
      </svg>
    </div>
  )
}

const PesoModelDiagram = memo(PesoModelDiagramInner)
export default PesoModelDiagram
