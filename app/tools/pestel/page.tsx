'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type PestelData = {
  political: string[]
  economic: string[]
  social: string[]
  technological: string[]
  environmental: string[]
  legal: string[]
}

const DEFAULT_DATA: PestelData = {
  political: [''],
  economic: [''],
  social: [''],
  technological: [''],
  environmental: [''],
  legal: [''],
}

export default function PestelPage() {
  const [data, setData] = useState<PestelData>(DEFAULT_DATA)
  useProjectToolData<PestelData>('pestel', data, setData)

  const updateItem = (key: keyof PestelData, index: number, value: string) => {
    setData((prev) => {
      const next = { ...prev }
      next[key] = [...next[key]]
      next[key][index] = value
      return next
    })
  }

  const addItem = (key: keyof PestelData) => {
    setData((prev) => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeItem = (key: keyof PestelData, index: number) => {
    setData((prev) => {
      const filtered = prev[key].filter((_, i) => i !== index)
      return { ...prev, [key]: filtered.length > 0 ? filtered : [''] }
    })
  }

  const sections: Array<{ key: keyof PestelData; label: string; hint: string }> = [
    { key: 'political', label: 'Political', hint: 'Lover, regulering, politiske forhold' },
    { key: 'economic', label: 'Economic', hint: 'Inflation, renter, købekraft, økonomi' },
    { key: 'social', label: 'Social', hint: 'Adfærd, kultur, demografi, trends' },
    { key: 'technological', label: 'Technological', hint: 'Teknologi, innovation, digitalisering' },
    { key: 'environmental', label: 'Environmental', hint: 'Bæredygtighed, klima, miljøkrav' },
    { key: 'legal', label: 'Legal', hint: 'Jura, compliance, branchekrav' },
  ]

  return (
    <ToolLayout
      title="PESTEL"
      description="Analysér eksterne forhold med PESTEL-modellen."
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
                    placeholder="Skriv faktor..."
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

