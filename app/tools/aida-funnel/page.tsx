'use client'

import { useCallback, useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import {
  AIDA_EMPTY_VALUES,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  buildFunnelSegments,
  CENTER_X,
  normalizeAidaValues,
  widthAtY,
  type AidaStageId,
  type AidaValues,
} from '@/lib/aida-funnel-stages'
import styles from './aida-funnel.module.css'

function AidaFunnelContent() {
  const [activeStage, setActiveStage] = useState<AidaStageId>('attention')
  const [values, setValuesState] = useState<AidaValues>(AIDA_EMPTY_VALUES)
  const setValues = useCallback(
    (next: AidaValues) => setValuesState(normalizeAidaValues(next)),
    [],
  )

  useProjectToolData<AidaValues>('aida-funnel', values, setValues)

  const segments = useMemo(() => buildFunnelSegments(), [])

  const updateValue = (id: AidaStageId, value: string) => {
    setValues({ ...values, [id]: value })
  }

  return (
    <div className="flex min-h-[min(80vh,720px)] items-center justify-center bg-transparent p-4 md:min-h-[720px]">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="Interaktiv AIDA funnel model"
        className="h-auto w-full max-w-5xl overflow-visible drop-shadow-xl"
      >
        <defs>
          <filter id="aidaSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="18"
              floodColor="#111827"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        <g filter="url(#aidaSoftShadow)">
          {segments.map((segment) => {
            const isActive = activeStage === segment.id
            const value = values[segment.id]
            const labelY = segment.drawY1 + 14
            const inputY = segment.drawY1 + 55
            const inputHeight = segment.drawHeight - 68
            const inputWidthAtPosition = widthAtY(inputY + inputHeight / 2)
            const contentWidth = Math.max(120, Math.min(inputWidthAtPosition - 95, 560))
            const contentX = CENTER_X - contentWidth / 2

            return (
              <g
                key={segment.id}
                onClick={() => setActiveStage(segment.id)}
                className="cursor-pointer"
              >
                <polygon
                  points={segment.points}
                  fill={isActive ? segment.activeFill : segment.fill}
                  className="transition-opacity duration-300 hover:opacity-95"
                />

                <foreignObject
                  x={CENTER_X - segment.midWidth / 2}
                  y={labelY}
                  width={segment.midWidth}
                  height="36"
                  className="pointer-events-none"
                >
                  <div className="flex h-full w-full items-center justify-center gap-3 px-8 text-center text-white">
                    <span className="text-[9px] font-bold tracking-[0.24em] opacity-70">
                      0{segment.index + 1}
                    </span>
                    <span className="text-[15px] font-black uppercase tracking-[0.16em] opacity-95">
                      {segment.title}
                    </span>
                    <span className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] opacity-70 sm:inline">
                      {segment.subtitle}
                    </span>
                  </div>
                </foreignObject>

                <foreignObject
                  x={contentX}
                  y={inputY}
                  width={contentWidth}
                  height={inputHeight}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex h-full w-full items-center justify-center text-center text-white">
                    {isActive ? (
                      <textarea
                        autoFocus
                        value={value}
                        onChange={(event) => updateValue(segment.id, event.target.value)}
                        placeholder={segment.prompt}
                        className={`${styles.funnelTextarea} h-full w-full resize-none overflow-hidden border-0 bg-transparent text-center text-[15px] font-semibold leading-snug text-white placeholder:text-white/45`}
                      />
                    ) : value.trim().length > 0 ? (
                      <div
                        className={`${styles.lineClamp4} whitespace-pre-wrap text-[15px] font-semibold leading-snug text-white/92`}
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

export default function AidaFunnelPage() {
  return (
    <ToolLayout
      title="AIDA-tragtmodellen"
      description="Byg budskaber fra Attention til Action — klik på hvert lag og skriv dit indhold."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
      embedTransparent
    >
      <AidaFunnelContent />
    </ToolLayout>
  )
}
