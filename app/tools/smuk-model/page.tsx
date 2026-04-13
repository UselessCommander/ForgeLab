'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type CriterionKey = 'sizeGrowth' | 'opportunities' | 'costs' | 'competition'

type SmukData = {
  segments: string[]
  scores: Record<CriterionKey, number[]>
  notes: Record<CriterionKey, string[]>
}

const CRITERIA: { key: CriterionKey; label: string; description: string }[] = [
  {
    key: 'sizeGrowth',
    label: 'Størrelse & vækst',
    description: 'Hvor stort er segmentet, og hvor meget vokser det?',
  },
  {
    key: 'opportunities',
    label: 'Muligheder for bearbejdning',
    description: 'Hvor let er det at nå og bearbejde segmentet effektivt?',
  },
  {
    key: 'costs',
    label: 'Udgifter ved bearbejdning',
    description: 'Hvilke omkostninger er der ved at arbejde med segmentet?',
  },
  {
    key: 'competition',
    label: 'Konkurrencesituation i segmentet',
    description: 'Hvor hård er konkurrencen om kunderne i segmentet?',
  },
]

const DEFAULT_DATA: SmukData = {
  segments: ['Segment 1', 'Segment 2', 'Segment 3', 'Segment 4'],
  scores: {
    sizeGrowth: [0, 0, 0, 0],
    opportunities: [0, 0, 0, 0],
    costs: [0, 0, 0, 0],
    competition: [0, 0, 0, 0],
  },
  notes: {
    sizeGrowth: ['', '', '', ''],
    opportunities: ['', '', '', ''],
    costs: ['', '', '', ''],
    competition: ['', '', '', ''],
  },
}

function SmukContent() {
  const [data, setData] = useState<SmukData>(DEFAULT_DATA)

  // Gem/indlæs via projekt-hook (hvis værktøjet bruges i et projekt)
  useProjectToolData<SmukData>('smuk-model', data, setData)

  const updateSegmentName = (index: number, value: string) => {
    const segments = [...data.segments]
    segments[index] = value
    setData({ ...data, segments })
  }

  const updateScore = (criterion: CriterionKey, segmentIndex: number, value: number) => {
    // Clamp value between 0 and 5
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
    setData({ segments, scores, notes })
  }

  const removeSegment = (index: number) => {
    if (data.segments.length <= 1) return
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
    setData({ segments, scores, notes })
  }

  const getTotalForSegment = (index: number) => {
    return CRITERIA.reduce((sum, c) => sum + (data.scores[c.key][index] || 0), 0)
  }

  const maxTotal = data.segments.reduce((max, _s, i) => Math.max(max, getTotalForSegment(i)), 0)

  return (
    <div className="space-y-8">
      {/* SMUK cirkler */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['S', 'M', 'U', 'K'].map((letter, i) => (
          <div key={letter} className="flex flex-col items-center gap-3">
            <div
              className={[
                'w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl font-bold',
                i === 0 && 'bg-emerald-300 text-emerald-950',
                i === 1 && 'bg-teal-700 text-white',
                i === 2 && 'bg-cyan-500 text-white',
                i === 3 && 'bg-sky-900 text-white',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {letter}
            </div>
            <div className="text-xs md:text-sm font-medium text-slate-700 text-center">
              {CRITERIA[i].label}
            </div>
          </div>
        ))}
      </section>

      {/* Forklaring */}
      <section className="grid md:grid-cols-4 gap-4">
        {CRITERIA.map((c, idx) => (
          <div
            key={c.key}
            className={[
              'rounded-full px-4 py-2 text-xs md:text-sm font-medium text-center text-white',
              idx % 2 === 0 ? 'bg-teal-500' : 'bg-sky-800',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {c.label.toUpperCase()}
          </div>
        ))}
      </section>

      {/* Scoringstabel */}
      <section className="bg-white border border-teal-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-teal-800 text-white text-xs md:text-sm font-semibold px-4 py-3 flex">
          <div className="w-1/3 md:w-1/4">
            Scor fra 1 til 5 baseret på attraktivitet (5 er bedst)
          </div>
          {data.segments.map((segment, index) => (
            <div key={index} className="flex-1 px-1 md:px-2 text-center">
              <input
                value={segment}
                onChange={(e) => updateSegmentName(index, e.target.value)}
                className="w-full rounded-md bg-teal-700/60 border border-teal-500/60 px-2 py-1 text-xs md:text-sm font-semibold placeholder:text-teal-100 focus:outline-none focus:ring-1 focus:ring-teal-300"
                placeholder={`Segment ${index + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addSegment}
            className="ml-2 shrink-0 rounded-md border border-teal-500/60 bg-teal-700/60 px-2 py-1 text-xs font-semibold hover:bg-teal-600/80"
          >
            +
          </button>
        </div>

        <div className="divide-y divide-teal-100 bg-teal-50/40">
          {CRITERIA.map((criterion) => (
            <div key={criterion.key} className="flex items-stretch">
              <div className="w-1/3 md:w-1/4 px-4 py-3 text-xs md:text-sm font-medium text-slate-800 bg-teal-50/80">
                <div>{criterion.label}</div>
                <div className="text-[10px] md:text-xs text-slate-600 mt-1">{criterion.description}</div>
              </div>
              {data.segments.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 px-2 py-3 bg-white/70 flex flex-col items-center gap-2 border-l border-teal-100"
                >
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={1}
                    value={data.scores[criterion.key][index] ?? ''}
                    onChange={(e) =>
                      updateScore(
                        criterion.key,
                        index,
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                    className="w-full max-w-[84px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs md:text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="-"
                  />
                  <textarea
                    value={data.notes?.[criterion.key]?.[index] ?? ''}
                    onChange={(e) => updateNote(criterion.key, index, e.target.value)}
                    className="w-full min-h-[54px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] md:text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-y"
                    placeholder="Noter / begrundelse..."
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Total-række */}
          <div className="flex items-stretch bg-cyan-200/90 text-slate-900 font-semibold">
            <div className="w-1/3 md:w-1/4 px-4 py-3 text-xs md:text-sm">Total</div>
            {data.segments.map((_, index) => {
              const total = getTotalForSegment(index)
              const intensity = maxTotal > 0 ? total / maxTotal : 0
              const shade = 78 - Math.round(intensity * 24)
              return (
                <div
                  key={index}
                  className="flex-1 px-2 py-3 flex items-center justify-center border-l border-cyan-400"
                  style={{ backgroundColor: `hsl(186, 80%, ${shade}%)` }}
                >
                  <span className="text-base md:text-lg font-bold">{total || '-'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function SmukModelPage() {
  return (
    <ToolLayout
      title="SMUK-model"
      description="Vurder og sammenlign segmenter ud fra Størrelse & vækst, Muligheder, Udgifter og Konkurrence."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <SmukContent />
    </ToolLayout>
  )
}

