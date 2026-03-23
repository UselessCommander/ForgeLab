'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type ScamperData = {
  substitute: string[]
  combine: string[]
  adapt: string[]
  modify: string[]
  putToAnotherUse: string[]
  eliminate: string[]
  reverse: string[]
}

const DEFAULT_DATA: ScamperData = {
  substitute: [''],
  combine: [''],
  adapt: [''],
  modify: [''],
  putToAnotherUse: [''],
  eliminate: [''],
  reverse: [''],
}

export default function ScamperPage() {
  const [data, setData] = useState<ScamperData>(DEFAULT_DATA)
  useProjectToolData<ScamperData>('scamper', data, setData)

  const updateItem = (key: keyof ScamperData, index: number, value: string) => {
    setData((prev) => {
      const next = { ...prev }
      next[key] = [...next[key]]
      next[key][index] = value
      return next
    })
  }

  const addItem = (key: keyof ScamperData) => {
    setData((prev) => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeItem = (key: keyof ScamperData, index: number) => {
    setData((prev) => {
      const filtered = prev[key].filter((_, i) => i !== index)
      return { ...prev, [key]: filtered.length > 0 ? filtered : [''] }
    })
  }

  const sections: Array<{ key: keyof ScamperData; label: string; hint: string }> = [
    { key: 'substitute', label: 'S - Substitute', hint: 'Hvad kan erstattes?' },
    { key: 'combine', label: 'C - Combine', hint: 'Hvad kan kombineres?' },
    { key: 'adapt', label: 'A - Adapt', hint: 'Hvad kan tilpasses fra andet?' },
    { key: 'modify', label: 'M - Modify', hint: 'Hvad kan ændres eller forstørres?' },
    { key: 'putToAnotherUse', label: 'P - Put to another use', hint: 'Kan det bruges på en ny måde?' },
    { key: 'eliminate', label: 'E - Eliminate', hint: 'Hvad kan fjernes eller simplificeres?' },
    { key: 'reverse', label: 'R - Reverse', hint: 'Kan rækkefølge eller logik vendes om?' },
  ]

  return (
    <ToolLayout
      title="SCAMPER"
      description="Generér idéer ved at udfordre en løsning med SCAMPER-metoden."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <section key={section.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{section.label}</h2>
            <p className="text-xs text-gray-500 mt-1 mb-3">{section.hint}</p>
            <div className="space-y-2">
              {data[section.key].map((item, index) => (
                <div key={`${section.key}-${index}`} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateItem(section.key, index, e.target.value)}
                    placeholder="Skriv idé..."
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  {data[section.key].length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(section.key, index)}
                      className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Slet
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addItem(section.key)}
              className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Tilføj
            </button>
          </section>
        ))}
      </div>
    </ToolLayout>
  )
}

