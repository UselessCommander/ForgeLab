'use client'

import { useState, Suspense } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

type MapSection = string[]

function EmpathyMapContent() {
  const [goal, setGoal] = useState('')
  const [showHelpText, setShowHelpText] = useState(true)
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

  // Combine goal and map into one state object for saving
  const empathyData = { goal, map }
  const setEmpathyData = (data: typeof empathyData) => {
    setGoal(data.goal)
    setMap(data.map)
  }

  // Automatically save/load data when in a project
  useProjectToolData('empathy-map', empathyData, setEmpathyData)

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
    borderColor = 'border-gray-300',
    showPrompts = true,
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
    showPrompts?: boolean
  }) => (
    <div className={`rounded-lg border-2 ${borderColor} p-4 h-full flex flex-col ${gray ? 'bg-gray-100' : 'bg-white'}`}>
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">{title}</h3>
      {showPrompts && (
        <ul className="text-xs text-gray-600 mb-3 space-y-0.5">
          {prompts.map((p, i) => (
            <li key={i}>• {p}</li>
          ))}
        </ul>
      )}
      <div className="space-y-2 flex-1">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              onKeyDown={(e) =>
                deleteEmptyFieldRow(e, item, items.length > 1, () => onRemove(index))
              }
              placeholder="..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
        ))}
        <button onClick={onAdd} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
          + Tilføj
        </button>
      </div>
    </div>
  )

  return (
    <ToolLayout title="Empathy Map" description="Forstå kundens perspektiv gennem deres ord, tanker, følelser og handlinger">
      <div className="mb-6 overflow-hidden rounded-xl border-2 border-gray-300 bg-white">
        <img
          src="/diagrams/empathy-map.svg"
          alt="Empathy map template"
          className="h-auto w-full"
          draggable={false}
        />
      </div>

      <div className="rounded-xl border-2 border-gray-300 bg-white p-6 md:p-8 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <label htmlFor="goal" className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Mål (Goal)
          </label>
          <button
            type="button"
            onClick={() => setShowHelpText((prev) => !prev)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            {showHelpText ? 'Skjul beskrivende tekst' : 'Vis beskrivende tekst'}
          </button>
        </div>
        <input
          id="goal"
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Hvad er målet med denne empathy map?"
          className="mb-6 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            showPrompts={showHelpText}
          />
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
            showPrompts={showHelpText}
          />
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
            showPrompts={showHelpText}
          />
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
            showPrompts={showHelpText}
          />
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
            showPrompts={showHelpText}
          />
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
            showPrompts={showHelpText}
          />
          <SectionBlock
            id="pains"
            title="7A. Smerter"
            prompts={['Frygt, frustration, angst?']}
            items={map.pains}
            onUpdate={(i, v) => updateField('pains', i, v)}
            onAdd={() => addItem('pains')}
            onRemove={(i) => removeItem('pains', i)}
            showPrompts={showHelpText}
          />
          <SectionBlock
            id="gains"
            title="7B. Gevinster"
            prompts={['Ønsker, behov, drømme?']}
            items={map.gains}
            onUpdate={(i, v) => updateField('gains', i, v)}
            onAdd={() => addItem('gains')}
            onRemove={(i) => removeItem('gains', i)}
            showPrompts={showHelpText}
          />
        </div>
      </div>
    </ToolLayout>
  )
}

export default function EmpathyMap() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">Indlæser...</div>}>
      <EmpathyMapContent />
    </Suspense>
  )
}
