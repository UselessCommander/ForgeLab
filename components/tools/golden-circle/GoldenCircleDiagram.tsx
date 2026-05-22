'use client'

import { memo, useId } from 'react'
import styles from './golden-circle.module.css'
import {
  GOLDEN_CIRCLE_LAYERS,
  GOLDEN_CIRCLE_RINGS,
  type GoldenCircleLayerId,
} from './golden-circle-data'

type GoldenCircleDiagramProps = {
  activeLayer: GoldenCircleLayerId
  onSelectLayer?: (id: GoldenCircleLayerId) => void
}

function GoldenCircleDiagramInner({ activeLayer, onSelectLayer }: GoldenCircleDiagramProps) {
  const interactive = Boolean(onSelectLayer)
  const shadowId = `goldenCircleShadow-${useId().replace(/:/g, '')}`

  return (
    <div className={styles.diagramWrap}>
      <svg
        viewBox="0 0 760 760"
        role="img"
        aria-label="The Golden Circle"
        className={styles.diagramSvg}
      >
        <defs>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="24"
              stdDeviation="26"
              floodColor="#111827"
              floodOpacity="0.1"
            />
          </filter>
        </defs>

        <circle cx="380" cy="380" r="302" fill="#ffffff" filter={`url(#${shadowId})`} />

        {GOLDEN_CIRCLE_RINGS.map(ring => {
          const layer = GOLDEN_CIRCLE_LAYERS[ring.id]
          const isActive = activeLayer === ring.id

          return (
            <g
              key={ring.id}
              className={interactive ? styles.ringInteractive : undefined}
              onClick={interactive ? () => onSelectLayer?.(ring.id) : undefined}
              onKeyDown={
                interactive
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectLayer?.(ring.id)
                      }
                    }
                  : undefined
              }
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `Vælg ${layer.title}` : undefined}
            >
              <circle
                cx="380"
                cy="380"
                r={ring.r}
                fill={layer.fill}
                stroke={isActive ? layer.stroke : 'rgba(17,24,39,0.14)'}
                strokeWidth={isActive ? 7 : 2}
                strokeDasharray={isActive ? '16 9' : '0'}
              />

              <text
                x="380"
                y={ring.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={layer.text}
                className={styles.ringTitle}
                style={{ fontSize: ring.labelSize }}
              >
                {layer.title}
              </text>

              <text
                x="380"
                y={ring.labelY + 30}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={layer.muted}
                className={styles.ringSubtitle}
              >
                {layer.subtitle}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export const GoldenCircleDiagram = memo(GoldenCircleDiagramInner)
