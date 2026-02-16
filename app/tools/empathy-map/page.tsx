'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

type MapSection = string[]

export default function EmpathyMap() {
  const [goal, setGoal] = useState('')
  const [map, setMap] = useState<Record<string, MapSection>>({
    who: [''],
    needToDo: [''],
    see: [''],
    say: [''],
    do: [''],
    hear: [''],
    pains: [''],
    gains: ['']
  })

  const updateField = (category: keyof typeof map, index: number, value: string) => {
    const newMap = { ...map }
    newMap[category] = [...newMap[category]]
    newMap[category][index] = value
    setMap(newMap)
  }

  const addItem = (category: keyof typeof map) => {
    const newMap = { ...map }
    newMap[category] = [...newMap[category], '']
    setMap(newMap)
  }

  const removeItem = (category: keyof typeof map, index: number) => {
    const newMap = { ...map }
    newMap[category] = newMap[category].filter((_, i) => i !== index)
    if (newMap[category].length === 0) newMap[category] = ['']
    setMap(newMap)
  }

  const SectionBlock = ({
    id,
    title,
    prompts,
    items,
    onUpdate,
    onAdd,
    onRemove,
    gray = false,
    borderColor = 'border-gray-300'
  }: {
    id: keyof typeof map
    title: string
    prompts: string[]
    items: string[]
    onUpdate: (i: number, v: string) => void
    onAdd: () => void
    onRemove: (i: number) => void
    gray?: boolean
    borderColor?: string
  }) => (
    <div className={`rounded-lg border-2 ${borderColor} p-4 h-full flex flex-col ${gray ? 'bg-gray-100' : 'bg-white'}`}>
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">{title}</h3>
      <ul className="text-xs text-gray-600 mb-3 space-y-0.5">
        {prompts.map((p, i) => (
          <li key={i}>• {p}</li>
        ))}
      </ul>
      <div className="space-y-2 flex-1">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder="..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
            {items.length > 1 && (
              <button
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700 text-sm shrink-0"
                aria-label="Fjern"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={onAdd} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
          + Tilføj
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            <div className="flex items-center gap-4 mb-2">
              <ForgeLabLogo size={48} />
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Empathy Map
              </h1>
            </div>
            <p className="text-gray-600">
              Forstå kundens perspektiv gennem deres ord, tanker, følelser og handlinger
            </p>
          </div>
        </header>

        {/* Empathy Map - Template layout with head in center */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border-2 border-gray-300 overflow-hidden">
          {/* GOAL - top center */}
          <div className="text-center mb-6">
            <label htmlFor="goal" className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
              Mål (GOAL)
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Hvad er målet med denne empathy map?"
              className="w-full max-w-xl mx-auto px-4 py-2 text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>

          {/* Main grid: head in center, sections around */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Top row: WHO (1) + What do they need to DO (2) */}
            <div className="md:col-span-5">
              <SectionBlock
                id="who"
                title="1. Hvem empatiserer vi med?"
                prompts={[
                  'Hvem er personen vi vil forstå?',
                  'Hvilken situation er de i?',
                  'Hvilken rolle har de i situationen?'
                ]}
                items={map.who}
                onUpdate={(i, v) => updateField('who', i, v)}
                onAdd={() => addItem('who')}
                onRemove={(i) => removeItem('who', i)}
                gray
              />
            </div>
            <div className="md:col-span-2 hidden md:block" />
            <div className="md:col-span-5">
              <SectionBlock
                id="needToDo"
                title="2. Hvad skal de gøre?"
                prompts={[
                  'Hvad skal de gøre anderledes?',
                  'Hvilke opgaver vil/de har brug for at løse?',
                  'Hvilke beslutninger skal de tage?',
                  'Hvordan ved vi at de lykkedes?'
                ]}
                items={map.needToDo}
                onUpdate={(i, v) => updateField('needToDo', i, v)}
                onAdd={() => addItem('needToDo')}
                onRemove={(i) => removeItem('needToDo', i)}
                gray
              />
            </div>

            {/* Middle row: HEAR (6) | HEAD (7) | SEE (3) */}
            <div className="md:col-span-4">
              <SectionBlock
                id="hear"
                title="6. Hvad hører de?"
                prompts={[
                  'Hvad hører de andre sige?',
                  'Hvad hører de fra venner?',
                  'Hvad hører de fra kolleger?',
                  'Hvad hører de andenhånds?'
                ]}
                items={map.hear}
                onUpdate={(i, v) => updateField('hear', i, v)}
                onAdd={() => addItem('hear')}
                onRemove={(i) => removeItem('hear', i)}
              />
            </div>

            {/* Center: Head with THINK and FEEL (7) */}
            <div className="md:col-span-4 flex items-stretch">
              <div className="w-full rounded-lg border-2 border-gray-300 bg-white p-4 flex flex-col">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 text-center">
                  7. Hvad tænker og føler de?
                </p>
                {/* Head SVG - facing right */}
                <div className="flex justify-center mb-4">
                  <svg viewBox="0 0 120 140" className="w-24 h-auto shrink-0" aria-hidden>
                    <path
                      d="M 18 24 Q 18 6 33 9 Q 72 15 96 36 Q 105 51 102 72 Q 99 93 84 108 Q 66 123 42 126 Q 21 127 12 111 Q 6 90 9 66 Q 12 42 18 24 Z"
                      fill="white"
                      stroke="#1f2937"
                      strokeWidth="2"
                    />
                    <ellipse cx="15" cy="60" rx="5" ry="11" fill="white" stroke="#1f2937" strokeWidth="2" />
                    <circle cx="60" cy="45" r="5" fill="#1f2937" />
                    <path
                      d="M 51 78 L 60 87 L 63 80 L 69 89 L 75 81"
                      stroke="#1f2937"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block mb-1">SMERTER</span>
                    <p className="text-[10px] text-gray-500 mb-2">Frygt, frustration, angst?</p>
                    {map.pains.map((item, i) => (
                      <div key={i} className="flex gap-1 mb-2">
                        <textarea
                          value={item}
                          onChange={(e) => updateField('pains', i, e.target.value)}
                          placeholder="..."
                          rows={2}
                          className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                        {map.pains.length > 1 && (
                          <button onClick={() => removeItem('pains', i)} className="text-red-500 text-sm">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addItem('pains')} className="text-xs text-gray-600 hover:text-gray-900">+ Tilføj</button>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-700 block mb-1">GEVINSTER</span>
                    <p className="text-[10px] text-gray-500 mb-2">Ønsker, behov, drømme?</p>
                    {map.gains.map((item, i) => (
                      <div key={i} className="flex gap-1 mb-2">
                        <textarea
                          value={item}
                          onChange={(e) => updateField('gains', i, e.target.value)}
                          placeholder="..."
                          rows={2}
                          className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                        {map.gains.length > 1 && (
                          <button onClick={() => removeItem('gains', i)} className="text-red-500 text-sm">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addItem('gains')} className="text-xs text-gray-600 hover:text-gray-900">+ Tilføj</button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-3 text-center">
                  Hvad andre tanker og følelser driver deres adfærd?
                </p>
              </div>
            </div>

            <div className="md:col-span-4">
              <SectionBlock
                id="see"
                title="3. Hvad ser de?"
                prompts={[
                  'Hvad ser de på markedet?',
                  'Hvad ser de i deres nærmiljø?',
                  'Hvad ser de andre sige og gøre?',
                  'Hvad ser og læser de?'
                ]}
                items={map.see}
                onUpdate={(i, v) => updateField('see', i, v)}
                onAdd={() => addItem('see')}
                onRemove={(i) => removeItem('see', i)}
              />
            </div>
          </div>

          {/* Bottom row: DO (5) + SAY (4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <SectionBlock
                id="do"
                title="5. Hvad gør de?"
                prompts={[
                  'Hvad gør de i dag?',
                  'Hvilken adfærd har vi observeret?',
                  'Hvad kan vi forestille os at de gør?'
                ]}
                items={map.do}
                onUpdate={(i, v) => updateField('do', i, v)}
                onAdd={() => addItem('do')}
                onRemove={(i) => removeItem('do', i)}
              />
            </div>
            <div>
              <SectionBlock
                id="say"
                title="4. Hvad siger de?"
                prompts={[
                  'Hvad har vi hørt dem sige?',
                  'Hvad kan vi forestille os at de siger?'
                ]}
                items={map.say}
                onUpdate={(i, v) => updateField('say', i, v)}
                onAdd={() => addItem('say')}
                onRemove={(i) => removeItem('say', i)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
