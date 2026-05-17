'use client'

import { useMemo, type ReactNode } from 'react'
import {
  allStepsInOrder,
  buildJourneyGridCols,
  getPhaseColor,
  SENTIMENT_OPTIONS,
  sentimentColor,
  stepsForPhase,
  type JourneyData,
  type JourneyPhase,
  type JourneyStep,
} from '@/lib/brugerrejse'

function JourneyLabelCell({
  children,
  cls,
  bg = 'bg-white',
}: {
  children: ReactNode
  cls?: string
  bg?: string
}) {
  return (
    <div
      className={`sticky left-0 z-10 ${bg} flex items-center justify-end pr-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 border-r border-gray-100 select-none ${cls ?? ''}`}
    >
      {children}
    </div>
  )
}

function StaticTextCell({
  text,
  emptyClass = 'text-gray-300 italic',
  className = '',
}: {
  text: string
  emptyClass?: string
  className?: string
}) {
  const trimmed = text.trim()
  if (!trimmed) {
    return <span className={`text-[11px] ${emptyClass}`}>—</span>
  }
  return (
    <p className={`text-xs text-gray-700 whitespace-pre-wrap leading-relaxed ${className}`}>
      {trimmed}
    </p>
  )
}

export function BrugerrejseReadonlyBoard({
  data,
  stepMinPx,
}: {
  data: JourneyData
  stepMinPx?: number
}) {
  const gridCols = buildJourneyGridCols(data, stepMinPx)
  const cellCls = 'border-l border-gray-100 px-3'
  const allSteps = allStepsInOrder(data)
  const stepColCount = data.phases.reduce(
    (sum, ph) => sum + Math.max(1, stepsForPhase(data, ph.id).length),
    0,
  )

  const experienceSvg = useMemo(() => {
    const n = allSteps.length
    if (n === 0) return null
    const pts = allSteps.map((s, i) => ({
      x: ((i + 0.5) / n) * 100,
      y: 10 + ((2 - s.sentiment) / 4) * 80,
      sentiment: s.sentiment,
    }))
    const scaledPts = pts.map((p) => ({ ...p, x: p.x * 10 }))
    return { n, scaledPts }
  }, [allSteps])

  return (
    <div className="pointer-events-none select-none bg-white" style={{ width: 'max-content' }}>
      <div className="overflow-x-auto">
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
          <div className="sticky left-0 z-10 border-r border-gray-100 bg-white" />
          {data.phases.map((phase) => {
            const c = getPhaseColor(phase)
            const n = Math.max(1, stepsForPhase(data, phase.id).length)
            return (
              <div
                key={phase.id}
                className="border-l border-gray-100 first:border-l-0"
                style={{ gridColumn: `span ${n}` }}
              >
                <div
                  className={`${c.bg} px-4 py-2.5 text-[13px] font-semibold tracking-wide text-white`}
                >
                  {phase.label || 'Fase'}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
          <JourneyLabelCell>Touchpoint</JourneyLabelCell>
          {data.phases.flatMap((phase) => {
            const steps = stepsForPhase(data, phase.id)
            const c = getPhaseColor(phase)
            if (steps.length === 0) {
              return [
                <div
                  key={phase.id}
                  className={`${cellCls} py-2.5 text-center text-xs text-gray-300`}
                >
                  —
                </div>,
              ]
            }
            return steps.map((step, si) => (
              <div key={step.id} className={`${cellCls} py-2.5`}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${c.bg} text-[10px] font-semibold text-white ring-1 ring-white`}
                  >
                    {si + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-800">
                    {step.name.trim() || `Trin ${si + 1}`}
                  </span>
                </div>
              </div>
            ))
          })}
        </div>

        <div
          className="grid border-b border-gray-100 bg-gray-50/50"
          style={{ gridTemplateColumns: gridCols }}
        >
          <JourneyLabelCell bg="bg-gray-50">Channels</JourneyLabelCell>
          <div
            className="border-l border-gray-100 py-2"
            style={{ gridColumn: `span ${stepColCount}` }}
          />
        </div>

        {data.channels.map((channel) => (
          <div
            key={channel.id}
            className="grid border-b border-gray-50"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="sticky left-0 z-10 flex items-center gap-1.5 border-r border-gray-100 bg-white py-2 pl-3 pr-2">
              <span className="w-7 text-center text-base leading-none">{channel.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-gray-700">
                {channel.name || 'Kanal'}
              </span>
            </div>
            {data.phases.flatMap((phase) => {
              const steps = stepsForPhase(data, phase.id)
              if (steps.length === 0) {
                return [<div key={phase.id} className="border-l border-gray-100" />]
              }
              return steps.map((step) => {
                const active = step.activeChannelIds.includes(channel.id)
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-center border-l border-gray-100 py-2 ${
                      active ? 'bg-amber-50/70 ring-1 ring-inset ring-amber-200/70' : ''
                    }`}
                  >
                    {active ? (
                      <span className="text-lg leading-none">{channel.icon}</span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 opacity-40" />
                    )}
                  </div>
                )
              })
            })}
          </div>
        ))}

        {experienceSvg && (
          <div
            className="grid border-b border-gray-100 bg-gradient-to-b from-gray-50/40 via-white to-gray-50/30"
            style={{ gridTemplateColumns: gridCols }}
          >
            <JourneyLabelCell bg="bg-white/70">Oplevelse</JourneyLabelCell>
            <div className="border-l border-gray-100 py-4" style={{ gridColumn: `span ${stepColCount}` }}>
              <svg
                viewBox="0 0 1000 100"
                preserveAspectRatio="none"
                style={{ width: '100%', height: 72, display: 'block' }}
              >
                <defs>
                  {experienceSvg.scaledPts.map((p, i) => {
                    if (i === 0) return null
                    const prev = experienceSvg.scaledPts[i - 1]
                    return (
                      <linearGradient
                        key={i}
                        id={`preview-seg-${i}`}
                        x1={prev.x}
                        y1="0"
                        x2={p.x}
                        y2="0"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop
                          offset="0%"
                          stopColor={sentimentColor(experienceSvg.scaledPts[i - 1].sentiment)}
                        />
                        <stop offset="100%" stopColor={sentimentColor(p.sentiment)} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <line
                  x1="0"
                  y1="50"
                  x2="1000"
                  y2="50"
                  stroke="#e5e7eb"
                  strokeWidth="0.4"
                  vectorEffect="nonScalingStroke"
                />
                {experienceSvg.scaledPts.map((p, i) => {
                  if (i === 0) return null
                  const prev = experienceSvg.scaledPts[i - 1]
                  const cpx = (prev.x + p.x) / 2
                  const d = `M ${prev.x} ${prev.y} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke={`url(#preview-seg-${i})`}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="nonScalingStroke"
                    />
                  )
                })}
              </svg>
              <div
                className="mt-1 grid"
                style={{ gridTemplateColumns: `repeat(${experienceSvg.n}, 1fr)` }}
              >
                {allSteps.map((s, i) => (
                  <div
                    key={s.id}
                    className="truncate px-1 text-center text-[10px] font-medium text-gray-500"
                  >
                    {s.name.trim() || `Trin ${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ReadonlyJourneyRow
          label="Handlinger"
          labelCls="text-sky-600"
          bg="bg-sky-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="py-2">
              <StaticTextCell
                text={step.action}
                className={
                  step.action.trim() ? 'rounded-lg border border-sky-100 bg-white px-2 py-1.5' : ''
                }
              />
            </div>
          )}
        />

        <ReadonlyJourneyRow
          label="Tanker"
          labelCls="text-violet-600"
          bg="bg-violet-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="py-2">
              <StaticTextCell
                text={step.thought}
                className={
                  step.thought.trim()
                    ? 'rounded-lg border border-violet-100 bg-white px-2 py-1.5 italic'
                    : ''
                }
              />
            </div>
          )}
        />

        <ReadonlyJourneyRow
          label="Emotion"
          labelCls="text-amber-600"
          bg="bg-amber-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="flex items-center gap-0.5 py-2">
              {SENTIMENT_OPTIONS.map((opt) => (
                <span
                  key={opt.value}
                  className={`p-0.5 text-lg leading-none ${
                    step.sentiment === opt.value ? 'scale-110 opacity-100' : 'opacity-35'
                  }`}
                  title={opt.label}
                >
                  {opt.emoji}
                </span>
              ))}
            </div>
          )}
        />

        <ReadonlyJourneyRow
          label="Pains"
          labelCls="text-rose-600"
          bg="bg-rose-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="space-y-1 py-2">
              {step.pains.filter((p) => p.trim()).length === 0 ? (
                <StaticTextCell text="" />
              ) : (
                step.pains
                  .filter((p) => p.trim())
                  .map((pain, idx) => (
                    <p key={idx} className="flex gap-1 text-xs text-gray-700">
                      <span className="shrink-0 text-rose-400">—</span>
                      <span>{pain}</span>
                    </p>
                  ))
              )}
            </div>
          )}
        />

        <ReadonlyJourneyRow
          label="Gains"
          labelCls="text-emerald-600"
          bg="bg-emerald-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="space-y-1 py-2">
              {step.gains.filter((g) => g.trim()).length === 0 ? (
                <StaticTextCell text="" />
              ) : (
                step.gains
                  .filter((g) => g.trim())
                  .map((gain, idx) => (
                    <p key={idx} className="flex gap-1 text-xs text-gray-700">
                      <span className="shrink-0 text-emerald-500">+</span>
                      <span>{gain}</span>
                    </p>
                  ))
              )}
            </div>
          )}
        />

        <ReadonlyJourneyRow
          label="Insight"
          labelCls="text-amber-700"
          bg="bg-amber-50/20"
          gridCols={gridCols}
          cellCls={cellCls}
          data={data}
          render={(step) => (
            <div className="py-2">
              <StaticTextCell
                text={step.opportunity}
                className={
                  step.opportunity.trim()
                    ? 'rounded-lg border border-amber-100 bg-amber-50/60 px-2 py-1.5'
                    : ''
                }
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}

function ReadonlyJourneyRow({
  label,
  labelCls,
  bg,
  gridCols,
  cellCls,
  data,
  render,
}: {
  label: string
  labelCls?: string
  bg?: string
  gridCols: string
  cellCls: string
  data: JourneyData
  render: (step: JourneyStep, phase: JourneyPhase, stepIndex: number) => ReactNode
}) {
  return (
    <div className={`grid border-b border-gray-100 ${bg ?? ''}`} style={{ gridTemplateColumns: gridCols }}>
      <JourneyLabelCell cls={labelCls}>{label}</JourneyLabelCell>
      {data.phases.flatMap((phase) => {
        const steps = stepsForPhase(data, phase.id)
        if (steps.length === 0) {
          return [<div key={phase.id} className={cellCls} />]
        }
        return steps.map((step, si) => (
          <div key={step.id} className={cellCls}>
            {render(step, phase, si)}
          </div>
        ))
      })}
    </div>
  )
}
