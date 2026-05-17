'use client'

import { COLUMN_WIDTH } from '@/lib/service-blueprint'

export function ServiceBlueprintLineDivider({
  label,
  variant = 'solid',
  phaseCount,
}: {
  label: string
  variant?: 'solid' | 'dotted' | 'dashed'
  phaseCount: number
}) {
  const line =
    variant === 'solid'
      ? 'border-slate-800'
      : variant === 'dotted'
        ? 'border-dotted border-slate-400'
        : 'border-dashed border-slate-400'

  return (
    <div
      className="relative col-span-full grid items-stretch pointer-events-none"
      style={{
        gridTemplateColumns: `minmax(290px, auto) repeat(${phaseCount}, ${COLUMN_WIDTH}px)`,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 border-t-2 ${line}`}
        aria-hidden
      />

      <div className="relative z-10 flex min-w-0 items-center gap-3 self-center px-4 py-2">
        <div className="w-4 shrink-0" aria-hidden />
        <div className="max-w-[min(100%,240px)] shrink-0 rounded-full border-2 border-slate-800 bg-[#f8fafc] px-3 py-1.5 text-[10px] font-extrabold uppercase leading-tight tracking-[0.14em] text-slate-800 shadow-sm">
          {label}
        </div>
      </div>

      {Array.from({ length: phaseCount }).map((_, i) => (
        <div key={i} className="relative self-stretch py-2" aria-hidden />
      ))}
    </div>
  )
}
