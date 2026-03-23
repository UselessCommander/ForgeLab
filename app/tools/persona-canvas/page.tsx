'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type PersonaData = {
  name: string
  age: string
  role: string
  context: string
  quote: string
  goals: string[]
  frustrations: string[]
  needs: string[]
  behaviours: string[]
  channels: string[]
}

const DEFAULT_DATA: PersonaData = {
  name: '',
  age: '',
  role: '',
  context: '',
  quote: '',
  goals: [''],
  frustrations: [''],
  needs: [''],
  behaviours: [''],
  channels: [''],
}

export default function PersonaCanvasPage() {
  const [data, setData] = useState<PersonaData>(DEFAULT_DATA)
  useProjectToolData<PersonaData>('persona-canvas', data, setData)

  const updateField = (key: keyof PersonaData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateListItem = (
    key: 'goals' | 'frustrations' | 'needs' | 'behaviours' | 'channels',
    index: number,
    value: string
  ) => {
    setData((prev) => {
      const next = { ...prev }
      next[key] = [...next[key]]
      next[key][index] = value
      return next
    })
  }

  const addListItem = (key: 'goals' | 'frustrations' | 'needs' | 'behaviours' | 'channels') => {
    setData((prev) => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeListItem = (
    key: 'goals' | 'frustrations' | 'needs' | 'behaviours' | 'channels',
    index: number
  ) => {
    setData((prev) => {
      const filtered = prev[key].filter((_, i) => i !== index)
      return { ...prev, [key]: filtered.length > 0 ? filtered : [''] }
    })
  }

  const listSections: Array<{
    key: 'goals' | 'frustrations' | 'needs' | 'behaviours' | 'channels'
    title: string
    placeholder: string
  }> = [
    { key: 'goals', title: 'Mål', placeholder: 'Hvad vil personen opnå?' },
    { key: 'frustrations', title: 'Frustrationer', placeholder: 'Hvad er svært eller irriterende?' },
    { key: 'needs', title: 'Behov', placeholder: 'Hvad har personen brug for?' },
    { key: 'behaviours', title: 'Adfærd', placeholder: 'Hvordan handler personen typisk?' },
    { key: 'channels', title: 'Kanaler', placeholder: 'Hvor møder vi personen?' },
  ]

  return (
    <ToolLayout
      title="Persona Canvas"
      description="Skab en tydelig persona med mål, behov og adfærd."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Profil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Navn på persona (fx Maria)"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              value={data.age}
              onChange={(e) => updateField('age', e.target.value)}
              placeholder="Alder (fx 34)"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              value={data.role}
              onChange={(e) => updateField('role', e.target.value)}
              placeholder="Rolle (fx Marketing manager)"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              value={data.context}
              onChange={(e) => updateField('context', e.target.value)}
              placeholder="Kontekst (fx B2B SaaS virksomhed)"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <textarea
            value={data.quote}
            onChange={(e) => updateField('quote', e.target.value)}
            placeholder='Citat: "Jeg vil gerne løse opgaven hurtigere uden at miste overblik."'
            rows={2}
            className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listSections.map((section) => (
            <div key={section.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h3>
              <div className="space-y-2">
                {data[section.key].map((item, index) => (
                  <div key={`${section.key}-${index}`} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateListItem(section.key, index, e.target.value)}
                      placeholder={section.placeholder}
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {data[section.key].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem(section.key, index)}
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
                onClick={() => addListItem(section.key)}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                + Tilføj
              </button>
            </div>
          ))}
        </section>
      </div>
    </ToolLayout>
  )
}

