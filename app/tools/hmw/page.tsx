'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type HmwItem = {
  id: string
  insight: string
  question: string
}

type HmwData = {
  items: HmwItem[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_DATA: HmwData = {
  items: [{ id: createId(), insight: '', question: '' }],
}

export default function HmwPage() {
  const [data, setData] = useState<HmwData>(DEFAULT_DATA)
  useProjectToolData<HmwData>('hmw', data, setData)

  const updateItem = (id: string, field: keyof Omit<HmwItem, 'id'>, value: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }

  const addItem = () => {
    setData((prev) => ({
      ...prev,
      items: [...prev.items, { id: createId(), insight: '', question: '' }],
    }))
  }

  const removeItem = (id: string) => {
    setData((prev) => {
      const filtered = prev.items.filter((item) => item.id !== id)
      return {
        ...prev,
        items: filtered.length > 0 ? filtered : [{ id: createId(), insight: '', question: '' }],
      }
    })
  }

  return (
    <ToolLayout
      title="HMW (How Might We)"
      description="Omsæt indsigter til stærke How Might We-spørgsmål."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">HMW spørgsmål</h2>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
          >
            + Tilføj
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Start med en indsigt, og formulér derefter et åbent “How might we...” spørgsmål.
        </p>

        <div className="space-y-3">
          {data.items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">#{index + 1}</p>
              <textarea
                value={item.insight}
                onChange={(e) => updateItem(item.id, 'insight', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Backspace' && e.key !== 'Delete') return
                  if (e.metaKey || e.ctrlKey || e.altKey) return
                  if (item.insight.trim() !== '' || item.question.trim() !== '') return
                  if (data.items.length <= 1) return
                  e.preventDefault()
                  removeItem(item.id)
                }}
                placeholder="Indsigt/problem (fx: Brugere forstår ikke onboarding flowet)"
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <input
                value={item.question}
                onChange={(e) => updateItem(item.id, 'question', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Backspace' && e.key !== 'Delete') return
                  if (e.metaKey || e.ctrlKey || e.altKey) return
                  if (item.insight.trim() !== '' || item.question.trim() !== '') return
                  if (data.items.length <= 1) return
                  e.preventDefault()
                  removeItem(item.id)
                }}
                placeholder="How might we..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          ))}
        </div>
      </section>
    </ToolLayout>
  )
}

