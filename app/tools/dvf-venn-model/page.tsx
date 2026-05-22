'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import {
  DVF_CIRCLES,
  DVF_EMPTY_VALUES,
  RADIUS,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  getInputPlacement,
  getLabelPlacement,
  getSweetSpotTextPlacement,
  getTripleOverlapCenter,
  normalizeDvfValues,
  runDvfSmokeTests,
  type DvfId,
  type DvfValues,
} from '@/lib/dvf-venn-model'
import styles from './dvf-venn-model.module.css'

function DvfVennContent() {
  const [activeCircle, setActiveCircle] = useState<DvfId>('desirability')
  const [values, setValuesState] = useState<DvfValues>(DVF_EMPTY_VALUES)
  const setValues = useCallback(
    (next: DvfValues) => setValuesState(normalizeDvfValues(next)),
    [],
  )

  useProjectToolData<DvfValues>('dvf-venn-model', values, setValues)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      runDvfSmokeTests()
    }
  }, [])

  const sweetSpot = useMemo(() => getTripleOverlapCenter(DVF_CIRCLES), [])
  const sweetSpotText = useMemo(() => getSweetSpotTextPlacement(sweetSpot), [sweetSpot])

  const updateValue = (id: DvfId, value: string) => {
    setValues({ ...values, [id]: value })
  }

  return (
    <div className="flex min-h-[min(80vh,860px)] items-center justify-center bg-transparent p-4 md:min-h-[860px]">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="Interaktiv DVF Venn model"
        className="h-auto w-full max-w-5xl overflow-visible"
      >
        <defs>
          <filter id="dvfShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="18"
              floodColor="#111827"
              floodOpacity="0.14"
            />
          </filter>
          {DVF_CIRCLES.map((circle) => (
            <clipPath key={circle.id} id={`clip-${circle.id}`}>
              <circle cx={circle.cx} cy={circle.cy} r={RADIUS} />
            </clipPath>
          ))}
        </defs>

        <g filter="url(#dvfShadow)">
          <g style={{ isolation: 'isolate' }}>
            {DVF_CIRCLES.map((circle) => {
              const isActive = activeCircle === circle.id
              return (
                <circle
                  key={circle.id}
                  cx={circle.cx}
                  cy={circle.cy}
                  r={RADIUS}
                  fill={isActive ? circle.activeFill : circle.fill}
                  className="cursor-pointer transition-opacity duration-200 hover:opacity-95"
                  style={{ mixBlendMode: 'multiply' }}
                  onClick={() => setActiveCircle(circle.id)}
                />
              )
            })}
          </g>

          <g clipPath="url(#clip-desirability)" className="pointer-events-none">
            <g clipPath="url(#clip-viability)">
              <g clipPath="url(#clip-feasibility)">
                <rect
                  x={0}
                  y={0}
                  width={VIEWBOX_WIDTH}
                  height={VIEWBOX_HEIGHT}
                  fill="rgba(255,255,255,0.18)"
                />
              </g>
            </g>
          </g>

          <foreignObject
            x={sweetSpotText.x}
            y={sweetSpotText.y}
            width={sweetSpotText.width}
            height={sweetSpotText.height}
            className="pointer-events-none"
          >
            <div className="flex h-full w-full flex-col items-center justify-center text-center text-white">
              <div className="text-[14px] font-black uppercase tracking-[0.22em]">Sweet Spot</div>
              <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
                Innovation
              </div>
            </div>
          </foreignObject>

          {DVF_CIRCLES.map((circle) => {
            const label = getLabelPlacement(circle)
            const input = getInputPlacement(circle)
            const isActive = activeCircle === circle.id
            const value = values[circle.id]

            return (
              <g
                key={`${circle.id}-content`}
                onClick={() => setActiveCircle(circle.id)}
                className="cursor-pointer"
              >
                <foreignObject
                  x={label.x}
                  y={label.y}
                  width={label.width}
                  height={label.height}
                  className="pointer-events-none"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center text-center text-white drop-shadow-sm">
                    <div className="text-[25px] font-black leading-none tracking-[0.04em]">
                      {circle.title}
                    </div>
                    <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] opacity-80">
                      {circle.subtitle}
                    </div>
                  </div>
                </foreignObject>

                <foreignObject
                  x={input.x}
                  y={input.y}
                  width={input.width}
                  height={input.height}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex h-full w-full items-center justify-center px-3 text-center text-white">
                    {isActive ? (
                      <textarea
                        autoFocus
                        value={value}
                        onChange={(event) => updateValue(circle.id, event.target.value)}
                        placeholder={circle.prompt}
                        className={`${styles.dvfTextarea} h-full w-full resize-none overflow-hidden border-0 bg-transparent text-center text-[15px] font-semibold leading-snug text-white placeholder:text-white/55`}
                      />
                    ) : value.trim().length > 0 ? (
                      <div
                        className={`${styles.lineClamp5} whitespace-pre-wrap text-[15px] font-semibold leading-snug text-white/92`}
                      >
                        {value}
                      </div>
                    ) : null}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export default function DvfVennModelPage() {
  return (
    <ToolLayout
      title="DVF Venn-modellen"
      description="Vurder koncepter på Desirability, Viability og Feasibility — find sweet spot for innovation."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
      embedTransparent
    >
      <DvfVennContent />
    </ToolLayout>
  )
}
