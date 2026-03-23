'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type FiveWhysData = {
  problem: string
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
  rootCause: string
  action: string
}

const DEFAULT_DATA: FiveWhysData = {
  problem: '',
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  rootCause: '',
  action: '',
}

export default function FiveWhysPage() {
  const [data, setData] = useState<FiveWhysData>(DEFAULT_DATA)
  useProjectToolData<FiveWhysData>('five-whys', data, setData)

  const update = (key: keyof FiveWhysData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const whyFields: Array<{ key: keyof FiveWhysData; label: string }> = [
    { key: 'why1', label: '1. Hvorfor?' },
    { key: 'why2', label: '2. Hvorfor?' },
    { key: 'why3', label: '3. Hvorfor?' },
    { key: 'why4', label: '4. Hvorfor?' },
    { key: 'why5', label: '5. Hvorfor?' },
  ]

  return (
    <ToolLayout
      title="5 Why's"
      description="Find rodårsagen ved at spørge hvorfor fem gange."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Problem</label>
          <textarea
            value={data.problem}
            onChange={(e) => update('problem', e.target.value)}
            placeholder="Beskriv problemet..."
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {whyFields.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              value={data[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder="Skriv svar..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-gray-700">Rodårsag</label>
          <textarea
            value={data.rootCause}
            onChange={(e) => update('rootCause', e.target.value)}
            placeholder="Hvad er den mest sandsynlige rodårsag?"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Næste handling</label>
          <textarea
            value={data.action}
            onChange={(e) => update('action', e.target.value)}
            placeholder="Hvad gør I konkret nu?"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </section>
    </ToolLayout>
  )
}

