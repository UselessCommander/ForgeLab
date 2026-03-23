'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type DikwData = {
  data: string[]
  information: string[]
  knowledge: string[]
  wisdom: string[]
}

const DEFAULT_DATA: DikwData = {
  data: [''],
  information: [''],
  knowledge: [''],
  wisdom: [''],
}

export default function DikwPyramidenPage() {
  const [state, setState] = useState<DikwData>(DEFAULT_DATA)
  useProjectToolData<DikwData>('dikw-pyramiden', state, setState)

  const updateItem = (key: keyof DikwData, index: number, value: string) => {
    setState((prev) => {
      const next = { ...prev }
      next[key] = [...next[key]]
      next[key][index] = value
      return next
    })
  }

  const addItem = (key: keyof DikwData) => {
    setState((prev) => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeItem = (key: keyof DikwData, index: number) => {
    setState((prev) => {
      const filtered = prev[key].filter((_, i) => i !== index)
      return { ...prev, [key]: filtered.length > 0 ? filtered : [''] }
    })
  }

  const sections: Array<{ key: keyof DikwData; title: string; subtitle: string }> = [
    { key: 'data', title: 'Data', subtitle: 'Rå observationer, fakta og signaler' },
    { key: 'information', title: 'Information', subtitle: 'Sorterede data med kontekst' },
    { key: 'knowledge', title: 'Knowledge', subtitle: 'Mønstre, læring og forklaringer' },
    { key: 'wisdom', title: 'Wisdom', subtitle: 'Vurdering og beslutning om næste skridt' },
  ]

  return (
    <ToolLayout
      title="DIKW-pyramiden"
      description="Omsæt data til beslutninger gennem DIKW-lagene."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <section key={section.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
            <p className="text-xs text-gray-500 mt-1 mb-3">{section.subtitle}</p>
            <div className="space-y-2">
              {state[section.key].map((item, index) => (
                <div key={`${section.key}-${index}`} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateItem(section.key, index, e.target.value)}
                    placeholder="Skriv punkt..."
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  {state[section.key].length > 1 && (
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

