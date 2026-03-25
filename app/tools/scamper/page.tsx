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

  const sections: Array<{
    key: keyof ScamperData
    letter: string
    title: string
    prompt: string
    color: string
    light: string
  }> = [
    {
      key: 'substitute',
      letter: 'S',
      title: 'Substituér',
      prompt: 'Hvad kan erstattes i løsning, materiale eller proces?',
      color: 'bg-[#3b82f6]',
      light: 'bg-blue-50',
    },
    {
      key: 'combine',
      letter: 'C',
      title: 'Kombinér',
      prompt: 'Hvilke elementer kan samles for at skabe mere værdi?',
      color: 'bg-[#14b8a6]',
      light: 'bg-teal-50',
    },
    {
      key: 'adapt',
      letter: 'A',
      title: 'Adaptér',
      prompt: 'Hvad kan tilpasses fra en anden branche eller kontekst?',
      color: 'bg-[#f59e0b]',
      light: 'bg-amber-50',
    },
    {
      key: 'modify',
      letter: 'M',
      title: 'Modificér',
      prompt: 'Hvad kan forstørres, reduceres eller ændres?',
      color: 'bg-[#fb923c]',
      light: 'bg-orange-50',
    },
    {
      key: 'putToAnotherUse',
      letter: 'P',
      title: 'Put til andet brug',
      prompt: 'Kan det bruges til et nyt segment eller formål?',
      color: 'bg-[#f97316]',
      light: 'bg-orange-50',
    },
    {
      key: 'eliminate',
      letter: 'E',
      title: 'Eliminér',
      prompt: 'Hvad kan fjernes for at gøre løsningen enklere?',
      color: 'bg-[#e11d48]',
      light: 'bg-rose-50',
    },
    {
      key: 'reverse',
      letter: 'R',
      title: 'Reversér',
      prompt: 'Kan rækkefølge, logik eller roller vendes om?',
      color: 'bg-[#6366f1]',
      light: 'bg-indigo-50',
    },
  ]

  return (
    <ToolLayout
      title="SCAMPER"
      description="Generér idéer ved at udfordre en løsning med SCAMPER-metoden."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1240px] grid-cols-7 gap-3">
        {sections.map((section) => (
            <section
              key={section.key}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className={`px-3 py-4 text-white ${section.color}`}>
                <p className="text-5xl font-serif font-bold leading-none">{section.letter}</p>
                <p className="mt-3 text-lg font-semibold">{section.title}</p>
              </div>
              <div className={`px-3 py-4 ${section.light} border-b border-gray-200`}>
                <p className="min-h-[72px] text-sm leading-relaxed text-gray-700">{section.prompt}</p>
              </div>

              <div className="p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Idé-rækker</p>
                  <button
                    type="button"
                    onClick={() => addItem(section.key)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    + Række
                  </button>
                </div>

                <div className="space-y-3">
              {data[section.key].map((item, index) => (
                      <div
                        key={`${section.key}-${index}`}
                        className="relative rounded-xl border border-gray-200 bg-gray-50/70 p-3.5"
                      >
                        {data[section.key].length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItem(section.key, index)}
                            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-sm font-semibold text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Slet idé ${index + 1}`}
                          >
                            ×
                          </button>
                        ) : null}
                        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Idé {index + 1}
                        </div>
                        <div>
                          <input
                            value={item}
                            onChange={(e) => updateItem(section.key, index, e.target.value)}
                            placeholder="Skriv idé..."
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                      </div>
              ))}
                </div>
            </div>
          </section>
        ))}
        </div>
      </div>
    </ToolLayout>
  )
}

