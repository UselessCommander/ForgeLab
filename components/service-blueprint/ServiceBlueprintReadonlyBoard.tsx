'use client'

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  blueprintBoardOuterWidth,
  blueprintNaturalWidth,
  buildConnectionPaths,
  CARD_MIN_HEIGHT_PX,
  COLUMN_WIDTH,
  blueprintLanes,
  getSafeColSpan,
  type BlueprintCardData,
  type BlueprintData,
  type ConnectionPath,
} from '@/lib/service-blueprint'
import { ServiceBlueprintCardStatic } from './ServiceBlueprintCardStatic'
import { ServiceBlueprintLineDivider } from './ServiceBlueprintLineDivider'

export function ServiceBlueprintReadonlyBoard({
  data,
  measureKey = 1,
}: {
  data: BlueprintData
  /** Bump when parent CSS scale changes so connection anchors recompute. */
  measureKey?: number
}) {
  const { phases, cardTypes, cards, connections } = data
  const lanes = blueprintLanes
  const boardRef = useRef<HTMLDivElement>(null)
  const [connectionPaths, setConnectionPaths] = useState<ConnectionPath[]>([])

  const boardWidth = blueprintBoardOuterWidth(phases.length)

  const cardsByCell = useMemo(() => {
    const map = new Map<string, BlueprintCardData[]>()
    for (const lane of lanes) {
      for (const phase of phases) {
        map.set(`${lane.id}:${phase.id}`, [])
      }
    }
    for (const card of cards) {
      const key = `${card.laneId}:${card.phaseId}`
      const list = map.get(key)
      if (list) list.push(card)
    }
    map.forEach((value, key) => {
      map.set(
        key,
        [...value].sort(
          (a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title),
        ),
      )
    })
    return map
  }, [cards, phases, lanes])

  const rebuildConnectionPaths = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    setConnectionPaths(buildConnectionPaths(board, connections, cardTypes))
  }, [connections, cardTypes])

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(rebuildConnectionPaths)
    return () => window.cancelAnimationFrame(frame)
  }, [rebuildConnectionPaths, cards, phases, measureKey])

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const ro = new ResizeObserver(() => rebuildConnectionPaths())
    ro.observe(board)
    return () => ro.disconnect()
  }, [rebuildConnectionPaths])

  useLayoutEffect(() => {
    const t1 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(rebuildConnectionPaths)
    })
    return () => window.cancelAnimationFrame(t1)
  }, [measureKey, rebuildConnectionPaths])

  return (
    <div
      ref={boardRef}
      className="relative bg-[#f8fafc] p-6 pb-12 pointer-events-none select-none"
      style={{ width: boardWidth, maxWidth: boardWidth }}
    >
      <div
        className="relative z-20 grid items-stretch"
        style={{
          width: blueprintNaturalWidth(phases.length),
          gridTemplateColumns: `minmax(290px, auto) repeat(${phases.length}, ${COLUMN_WIDTH}px)`,
          gridAutoRows: 'minmax(min-content, auto)',
        }}
      >
        <div />
        {phases.map((phase) => (
          <div key={phase.id} className="p-4">
            <div className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1">
              <p className="min-w-0 flex-1 text-sm font-bold text-slate-900">{phase.title}</p>
            </div>
          </div>
        ))}

        {lanes.map((lane) => (
          <React.Fragment key={lane.id}>
            {lane.dividerBefore && (
              <ServiceBlueprintLineDivider
                label="Line of Visibility"
                variant="solid"
                phaseCount={phases.length}
              />
            )}
            {lane.dividerInternalBefore && (
              <ServiceBlueprintLineDivider
                label="Line of internal interaction"
                variant="dashed"
                phaseCount={phases.length}
              />
            )}

            <div className="relative flex min-h-[220px] flex-col border-t-2 border-slate-200/60 p-4">
              <div className="sticky top-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {lane.title}
                </h4>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                  {lane.hint}
                </p>
              </div>
            </div>

            {phases.map((phase) => {
              const cellKey = `${lane.id}:${phase.id}`
              const cellCards = cardsByCell.get(cellKey) || []

              return (
                <div
                  key={cellKey}
                  className="relative flex min-h-[220px] flex-col border-l border-t-2 border-slate-200/60 p-4"
                >
                  <div className="relative z-20 flex min-h-0 flex-1 flex-col gap-3">
                    {cellCards.map((card) => {
                      const span = getSafeColSpan(card.colSpan || 1, phase.id, phases)
                      return (
                        <div
                          key={card.id}
                          className="flex min-h-0 flex-1 flex-col"
                          style={{
                            width: `${span * COLUMN_WIDTH - 32}px`,
                            position: span > 1 ? 'absolute' : 'relative',
                            zIndex: span > 1 ? 30 : 'auto',
                          }}
                        >
                          <ServiceBlueprintCardStatic card={card} cardTypes={cardTypes} />
                        </div>
                      )
                    })}

                    {cellCards.map((card) => {
                      const span = getSafeColSpan(card.colSpan || 1, phase.id, phases)
                      if (span > 1) {
                        return (
                          <div
                            key={`placeholder-${card.id}`}
                            style={{ height: CARD_MIN_HEIGHT_PX }}
                            className="pointer-events-none w-full opacity-0"
                            aria-hidden
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <svg
        className="pointer-events-none absolute inset-0 z-[25] h-full w-full overflow-visible"
        aria-hidden
      >
        {connectionPaths.map((conn) => (
          <g key={`preview-conn-${conn.id}`}>
            <defs>
              <marker
                id={`preview-arrow-${conn.id}`}
                viewBox="0 0 12 12"
                refX="10"
                refY="6"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 12 6 L 0 12 z" fill={conn.stroke} />
              </marker>
            </defs>
            <path
              d={conn.d}
              fill="none"
              stroke={conn.stroke}
              strokeWidth="2.75"
              strokeDasharray={
                conn.type === 'ai' ? '6 7' : conn.type === 'analytics' ? '4 7' : '8 8'
              }
              strokeLinejoin="round"
              strokeLinecap="round"
              markerEnd={`url(#preview-arrow-${conn.id})`}
              className="opacity-80"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
