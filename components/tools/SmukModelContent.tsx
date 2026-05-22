'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectToolData } from '@/lib/useProjectToolData'
import styles from './smuk-model.module.css'

type CriterionKey = 'sizeGrowth' | 'opportunities' | 'costs' | 'competition'

export type SmukData = {
  segments: string[]
  scores: Record<CriterionKey, number[]>
  notes: Record<CriterionKey, string[]>
  selectedSegment: number | null
}

const CRITERIA: {
  key: CriterionKey
  label: string
  description: string
  color: string
}[] = [
  {
    key: 'sizeGrowth',
    label: 'Størrelse & vækst',
    description: 'Hvor stort er segmentet, og hvor meget vokser det?',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'opportunities',
    label: 'Muligheder',
    description: 'Hvor let er det at nå og bearbejde segmentet effektivt?',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'costs',
    label: 'Udgifter',
    description: 'Hvilke omkostninger er der ved at arbejde med segmentet?',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    key: 'competition',
    label: 'Konkurrence',
    description: 'Hvor hård er konkurrencen om kunderne i segmentet?',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
  },
]

export const SMUK_DEFAULT_DATA: SmukData = {
  segments: ['Segment 1', 'Segment 2', 'Segment 3'],
  scores: {
    sizeGrowth: [0, 0, 0],
    opportunities: [0, 0, 0],
    costs: [0, 0, 0],
    competition: [0, 0, 0],
  },
  notes: {
    sizeGrowth: ['', '', ''],
    opportunities: ['', '', ''],
    costs: ['', '', ''],
    competition: ['', '', ''],
  },
  selectedSegment: null,
}

const SEGMENT_COL = 'w-[200px] shrink-0 md:w-[220px]'
const ACTION_COL = 'w-[140px] shrink-0'
const SEGMENT_COL_EMBEDDED = 'w-[130px] shrink-0'
const ACTION_COL_EMBEDDED = 'w-[96px] shrink-0'
const CRITERION_COL_EMBEDDED = 'min-w-[88px] flex-1'
const CRITERION_COL = 'min-w-[160px] flex-1'

export function normalizeSmukData(raw: Partial<SmukData> | undefined): SmukData {
  if (!raw?.segments?.length) return SMUK_DEFAULT_DATA
  const segmentCount = raw.segments.length
  const pad = (arr: number[] | undefined) =>
    Array.from({ length: segmentCount }, (_, i) => Math.min(5, Math.max(0, arr?.[i] ?? 0)))
  const padNotes = (arr: string[] | undefined) =>
    Array.from({ length: segmentCount }, (_, i) => arr?.[i] ?? '')
  return {
    segments: raw.segments,
    scores: {
      sizeGrowth: pad(raw.scores?.sizeGrowth),
      opportunities: pad(raw.scores?.opportunities),
      costs: pad(raw.scores?.costs),
      competition: pad(raw.scores?.competition),
    },
    notes: {
      sizeGrowth: padNotes(raw.notes?.sizeGrowth),
      opportunities: padNotes(raw.notes?.opportunities),
      costs: padNotes(raw.notes?.costs),
      competition: padNotes(raw.notes?.competition),
    },
    selectedSegment:
      raw.selectedSegment != null &&
      raw.selectedSegment >= 0 &&
      raw.selectedSegment < segmentCount
        ? raw.selectedSegment
        : null,
  }
}

export type SmukLinkedSegments = {
  names: string[]
  selectedIndex: number | null
}

export function mergeSmukWithLinkedSegments(
  current: SmukData,
  names: string[],
  selectedIndex: number | null,
): SmukData {
  return normalizeSmukData({
    segments: names,
    scores: current.scores,
    notes: current.notes,
    selectedSegment: selectedIndex,
  })
}

type SmukModelContentProps = {
  embedded?: boolean
  /** Kobling til SMP: synkroniser segmentnavne og valg */
  linkedSegments?: SmukLinkedSegments
  onLinkedSelectionChange?: (index: number | null) => void
  onLinkedSegmentNameChange?: (index: number, name: string) => void
}

export default function SmukModelContent({
  embedded = false,
  linkedSegments,
  onLinkedSelectionChange,
  onLinkedSegmentNameChange,
}: SmukModelContentProps) {
  const segmentCol = embedded ? SEGMENT_COL_EMBEDDED : SEGMENT_COL
  const actionCol = embedded ? ACTION_COL_EMBEDDED : ACTION_COL
  const criterionCol = embedded ? CRITERION_COL_EMBEDDED : CRITERION_COL
  const tableInnerClass = embedded ? 'w-full min-w-0' : 'min-w-[960px]'
  const [data, setDataState] = useState<SmukData>(SMUK_DEFAULT_DATA)
  const setData = useCallback(
    (next: SmukData) => setDataState(normalizeSmukData(next)),
    [],
  )

  useProjectToolData<SmukData>('smuk-model', data, setData)

  const linkedSyncKeyRef = useRef('')
  const didPropagateSelectionRef = useRef(false)

  useEffect(() => {
    if (!linkedSegments?.names.length) return
    const key = `${linkedSegments.names.join('\u0001')}|${linkedSegments.selectedIndex ?? 'none'}`
    if (key === linkedSyncKeyRef.current) return
    linkedSyncKeyRef.current = key
    setDataState((prev) =>
      normalizeSmukData(
        mergeSmukWithLinkedSegments(prev, linkedSegments.names, linkedSegments.selectedIndex),
      ),
    )
  }, [linkedSegments])

  useEffect(() => {
    if (!onLinkedSelectionChange || !linkedSegments || didPropagateSelectionRef.current) return
    if (data.selectedSegment != null) {
      onLinkedSelectionChange(data.selectedSegment)
      didPropagateSelectionRef.current = true
    }
  }, [data.selectedSegment, linkedSegments, onLinkedSelectionChange])

  const selectedSegment = data.selectedSegment

  const setSelectedSegment = (index: number | null) => {
    setData({ ...data, selectedSegment: index })
    onLinkedSelectionChange?.(index)
  }

  const updateSegmentName = (index: number, value: string) => {
    const segments = [...data.segments]
    segments[index] = value
    setData({ ...data, segments })
    onLinkedSegmentNameChange?.(index, value)
  }

  const updateScore = (criterion: CriterionKey, segmentIndex: number, value: number) => {
    const safeValue = Number.isNaN(value) ? 0 : Math.min(5, Math.max(0, value))
    const scoresForCriterion = [...data.scores[criterion]]
    scoresForCriterion[segmentIndex] = safeValue
    setData({
      ...data,
      scores: {
        ...data.scores,
        [criterion]: scoresForCriterion,
      },
    })
  }

  const updateNote = (criterion: CriterionKey, segmentIndex: number, value: string) => {
    const notesForCriterion = [...(data.notes?.[criterion] ?? [])]
    notesForCriterion[segmentIndex] = value
    setData({
      ...data,
      notes: {
        ...data.notes,
        [criterion]: notesForCriterion,
      },
    })
  }

  const addSegment = () => {
    const nextIndex = data.segments.length + 1
    const segments = [...data.segments, `Segment ${nextIndex}`]
    const scores: Record<CriterionKey, number[]> = {
      sizeGrowth: [...data.scores.sizeGrowth, 0],
      opportunities: [...data.scores.opportunities, 0],
      costs: [...data.scores.costs, 0],
      competition: [...data.scores.competition, 0],
    }
    const notes: Record<CriterionKey, string[]> = {
      sizeGrowth: [...(data.notes?.sizeGrowth ?? []), ''],
      opportunities: [...(data.notes?.opportunities ?? []), ''],
      costs: [...(data.notes?.costs ?? []), ''],
      competition: [...(data.notes?.competition ?? []), ''],
    }
    setData({ segments, scores, notes, selectedSegment: data.selectedSegment })
  }

  const removeSegment = (index: number) => {
    if (data.segments.length <= 1) return

    let nextSelected = data.selectedSegment
    if (nextSelected === index) nextSelected = null
    else if (nextSelected != null && nextSelected > index) nextSelected = nextSelected - 1

    const segments = data.segments.filter((_, i) => i !== index)
    const scores: Record<CriterionKey, number[]> = {
      sizeGrowth: data.scores.sizeGrowth.filter((_, i) => i !== index),
      opportunities: data.scores.opportunities.filter((_, i) => i !== index),
      costs: data.scores.costs.filter((_, i) => i !== index),
      competition: data.scores.competition.filter((_, i) => i !== index),
    }
    const notes: Record<CriterionKey, string[]> = {
      sizeGrowth: (data.notes?.sizeGrowth ?? []).filter((_, i) => i !== index),
      opportunities: (data.notes?.opportunities ?? []).filter((_, i) => i !== index),
      costs: (data.notes?.costs ?? []).filter((_, i) => i !== index),
      competition: (data.notes?.competition ?? []).filter((_, i) => i !== index),
    }
    setData({ segments, scores, notes, selectedSegment: nextSelected })
  }

  const getTotalForSegment = (index: number) => {
    return CRITERIA.reduce((sum, c) => sum + (data.scores[c.key][index] || 0), 0)
  }

  const maxTotal = data.segments.reduce((max, _s, i) => Math.max(max, getTotalForSegment(i)), 0)

  return (
    <div className={styles.smukRoot}>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className={tableInnerClass}>
            <div className="flex items-stretch border-b border-slate-200 bg-slate-50 text-sm">
              <div className={`${segmentCol} border-r border-slate-200 ${embedded ? 'px-3 py-4' : 'px-5 py-5'}`}>
                <p className="font-medium text-slate-700">Scoringstabel</p>
                <p className="mt-1 text-xs font-light text-slate-500">Giv point fra 1 til 5 (5 er bedst)</p>
              </div>

              {CRITERIA.map((criterion, i) => (
                <div
                  key={criterion.key}
                  className={`flex ${criterionCol} flex-col items-center gap-2 border-r border-slate-200 text-center ${embedded ? 'px-2 py-4' : 'px-4 py-5'}`}
                >
                  <div
                    className={`flex items-center justify-center rounded-full border font-medium shadow-sm ${CRITERIA[i].color} ${embedded ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-lg'}`}
                  >
                    {['S', 'M', 'U', 'K'][i]}
                  </div>
                  <div className="text-sm font-medium text-slate-700">{criterion.label}</div>
                  <div className="text-xs font-light leading-relaxed text-slate-500">
                    {criterion.description}
                  </div>
                </div>
              ))}

              <div
                className={`${actionCol} flex flex-col items-center justify-center border-r border-slate-200 text-center ${embedded ? 'px-2 py-4' : 'px-3 py-5'}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Total
                </span>
              </div>

              <div className={`${actionCol} flex flex-col items-center justify-center text-center ${embedded ? 'px-2 py-4' : 'px-3 py-5'}`}>
                <span className="text-sm font-medium text-slate-500">Dit valg</span>
                <span className="mt-0.5 text-xs font-light text-slate-400">Vælg segment</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {data.segments.map((segment, segIndex) => {
                const total = getTotalForSegment(segIndex)
                const isRecommended = maxTotal > 0 && total === maxTotal
                const isSelected = selectedSegment === segIndex

                return (
                  <div
                    key={segIndex}
                    className={`flex items-stretch hover:bg-slate-50/50 ${styles.smoothTransition} ${isSelected ? 'bg-slate-50/80' : ''}`}
                  >
                    <div className={`${segmentCol} flex items-center border-r border-slate-100 ${embedded ? 'px-3 py-4' : 'px-5 py-5'}`}>
                      <div className="group relative w-full">
                        <input
                          value={segment}
                          onChange={(e) => updateSegmentName(segIndex, e.target.value)}
                          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ${styles.smoothTransition} focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-300`}
                          placeholder={`Segment ${segIndex + 1}`}
                        />
                        {data.segments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSegment(segIndex)}
                            className={`absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-400 opacity-0 ${styles.smoothTransition} group-hover:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500`}
                            title="Fjern segment"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {CRITERIA.map((criterion) => (
                      <div
                        key={criterion.key}
                        className={`flex ${criterionCol} flex-col items-center gap-3 border-r border-slate-100 ${embedded ? 'px-2 py-4' : 'px-4 py-5'}`}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[1-5]*"
                          value={
                            data.scores[criterion.key][segIndex] === 0
                              ? ''
                              : data.scores[criterion.key][segIndex]
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^1-5]/g, '').slice(-1)
                            updateScore(criterion.key, segIndex, val ? parseInt(val, 10) : 0)
                          }}
                          className={`w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-slate-700 shadow-sm ${styles.smoothTransition} focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-300`}
                          placeholder="-"
                        />
                        <textarea
                          value={data.notes?.[criterion.key]?.[segIndex] ?? ''}
                          onChange={(e) => updateNote(criterion.key, segIndex, e.target.value)}
                          className={`w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm ${styles.smoothTransition} focus:outline-none focus:ring-2 focus:ring-slate-300 ${embedded ? 'min-h-[48px]' : 'min-h-[60px]'}`}
                          placeholder="Noter / begrundelse..."
                        />
                      </div>
                    ))}

                    <div
                      className={`${actionCol} flex flex-col items-center justify-center border-r border-slate-200 ${embedded ? 'px-2 py-4' : 'px-3 py-5'} ${isSelected ? 'bg-slate-100 shadow-inner' : 'bg-slate-50/50'}`}
                    >
                      <span
                        className={`text-2xl font-semibold ${isRecommended || isSelected ? 'text-slate-800' : 'text-slate-500'}`}
                      >
                        {total || '-'}
                      </span>
                      {isRecommended && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Anbefalet
                        </div>
                      )}
                    </div>

                    <div className={`${actionCol} flex items-center justify-center ${embedded ? 'px-2 py-4' : 'px-3 py-5'}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedSegment(isSelected ? null : segIndex)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${styles.smoothTransition} ${
                          isSelected
                            ? 'bg-slate-800 text-white shadow-md hover:bg-slate-700'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <span>✓</span> Valgt
                          </>
                        ) : (
                          'Vælg'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="flex items-stretch bg-slate-50/30">
                <div className={`${segmentCol} border-r border-slate-100 ${embedded ? 'px-3 py-3' : 'px-5 py-4'}`}>
                  <button
                    type="button"
                    onClick={addSegment}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 ${styles.smoothTransition} hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700`}
                  >
                    <span>+</span> Tilføj segment
                  </button>
                </div>
                {CRITERIA.map((c) => (
                  <div key={c.key} className={`${criterionCol} border-r border-slate-100`} />
                ))}
                <div className={`${actionCol} border-r border-slate-100`} />
                <div className={actionCol} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
