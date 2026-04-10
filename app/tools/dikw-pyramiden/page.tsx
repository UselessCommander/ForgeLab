'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

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

  const sections: Array<{
    key: keyof DikwData
    title: string
    subtitle: string
    widthClass: string
    accentClass: string
  }> = [
    {
      key: 'wisdom',
      title: 'Wisdom',
      subtitle: 'Vurdering og beslutning om næste skridt',
      widthClass: 'w-[48%]',
      accentClass: 'border-amber-300 bg-amber-50/70',
    },
    {
      key: 'knowledge',
      title: 'Knowledge',
      subtitle: 'Mønstre, læring og forklaringer',
      widthClass: 'w-[64%]',
      accentClass: 'border-orange-300 bg-orange-50/70',
    },
    {
      key: 'information',
      title: 'Information',
      subtitle: 'Sorterede data med kontekst',
      widthClass: 'w-[80%]',
      accentClass: 'border-sky-300 bg-sky-50/70',
    },
    {
      key: 'data',
      title: 'Data',
      subtitle: 'Rå observationer, fakta og signaler',
      widthClass: 'w-[96%]',
      accentClass: 'border-slate-300 bg-slate-50/80',
    },
  ]

  return (
    <ToolLayout
      title="DIKW-pyramiden"
      description="Omsæt data til beslutninger gennem DIKW-lagene."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">DIKW-pyramiden</h2>
          <p className="text-sm text-gray-500">
            Arbejd op gennem lagene: fra data til information, knowledge og til sidst wisdom.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
        {sections.map((section) => (
          <section
            key={section.key}
            className={`${section.widthClass} min-w-[290px] rounded-2xl border p-4 shadow-sm ${section.accentClass}`}
          >
            <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
            <p className="text-xs text-gray-500 mt-1 mb-3">{section.subtitle}</p>
            <div className="space-y-2">
              {state[section.key].map((item, index) => (
                <div key={`${section.key}-${index}`} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateItem(section.key, index, e.target.value)}
                    onKeyDown={(e) =>
                      deleteEmptyFieldRow(e, item, state[section.key].length > 1, () =>
                        removeItem(section.key, index)
                      )
                    }
                    placeholder="Skriv punkt..."
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addItem(section.key)}
              className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-gray-400/70 text-sm text-gray-700 hover:bg-white/70"
            >
              + Tilføj
            </button>
          </section>
        ))}
        </div>
      </div>
    </ToolLayout>
  )
}

