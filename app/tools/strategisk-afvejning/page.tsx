'use client'

import { useCallback, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import styles from './strategisk-afvejning.module.css'

export type StrategiskAfvejningData = {
  topic: string
  angel: string
  devil: string
  judge: string
}

const DEFAULT_DATA: StrategiskAfvejningData = {
  topic: '',
  angel: '',
  devil: '',
  judge: '',
}

function normalizeData(raw: Partial<StrategiskAfvejningData> | undefined): StrategiskAfvejningData {
  return {
    topic: raw?.topic ?? '',
    angel: raw?.angel ?? '',
    devil: raw?.devil ?? '',
    judge: raw?.judge ?? '',
  }
}

function AngelIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <ellipse cx="12" cy="6" rx="4" ry="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c-2-1-4-2-6-1-2 1-3 3-3 6s2 3 5 2c3-1 4-5 4-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c2-1 4-2 6-1 2 1 3 3 3 6s-2 3-5 2c-3-1-4-5-4-7z"
      />
    </svg>
  )
}

function DevilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="14" r="5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10C8 7 6 5 4 6c1 3 2 6 4 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10c1-3 3-5 5-4-1 3-2 6-4 6" />
    </svg>
  )
}

function JudgeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  )
}

const PANELS = [
  {
    key: 'angel' as const,
    title: 'Potentialet',
    headerBg: 'bg-emerald-50/50 border-emerald-100/50',
    iconColor: 'text-emerald-600',
    Icon: AngelIcon,
    placeholder:
      'Hvad er det bedste der kan ske?\n\nHvilke fordele, synergier og muligheder gemmer der sig i denne idé?',
  },
  {
    key: 'devil' as const,
    title: 'Risikoen',
    headerBg: 'bg-rose-50/50 border-rose-100/50',
    iconColor: 'text-rose-600',
    Icon: DevilIcon,
    placeholder:
      'Hvad er det værste der kan ske?\n\nHvilke faldgruber, omkostninger og potentielle farer overser vi?',
  },
  {
    key: 'judge' as const,
    title: 'Dommen',
    headerBg: 'bg-slate-100/50 border-slate-200/50',
    iconColor: 'text-slate-600',
    Icon: JudgeIcon,
    placeholder:
      'Hvad er den endelige konklusion?\n\nNår potentiale og risiko vejes mod hinanden, hvad er så den strategiske anbefaling?',
  },
]

function StrategiskAfvejningContent() {
  const [data, setDataState] = useState<StrategiskAfvejningData>(DEFAULT_DATA)
  const setData = useCallback(
    (next: StrategiskAfvejningData) => setDataState(normalizeData(next)),
    [],
  )

  useProjectToolData<StrategiskAfvejningData>('strategisk-afvejning', data, setData)

  const update = (field: keyof StrategiskAfvejningData, value: string) => {
    setData({ ...data, [field]: value })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 selection:bg-slate-200 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Rollespil: Englen, djævlen og dommeren
          </h1>
          <div className="mx-auto max-w-2xl">
            <input
              type="text"
              value={data.topic}
              onChange={(e) => update('topic', e.target.value)}
              placeholder="Hvad er emnet eller idéen, vi vurderer?"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-lg font-medium text-slate-900 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </header>

        <div
          id="export-area"
          className="-mx-4 grid grid-cols-1 gap-8 bg-transparent p-4 md:grid-cols-3"
        >
          {PANELS.map((panel) => (
            <div
              key={panel.key}
              className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex items-center gap-4 border-b px-6 py-5 ${panel.headerBg}`}
              >
                <div className={panel.iconColor}>
                  <panel.Icon className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-semibold tracking-wide text-slate-800">
                  {panel.title}
                </h2>
              </div>
              <div className="flex flex-grow flex-col p-6">
                <textarea
                  value={data[panel.key]}
                  onChange={(e) => update(panel.key, e.target.value)}
                  className={`${styles.panelTextarea} h-full w-full resize-none border-0 bg-transparent p-0 leading-relaxed text-slate-600`}
                  placeholder={panel.placeholder}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StrategiskAfvejningPage() {
  return (
    <ToolLayout
      title="Rollespil: Englen, djævlen og dommeren"
      description="Vurder idéer med englen (potentiale), djævelen (risiko) og dommeren (konklusion)."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <StrategiskAfvejningContent />
    </ToolLayout>
  )
}
