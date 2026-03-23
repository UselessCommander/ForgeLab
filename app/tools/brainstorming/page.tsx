'use client'

import { useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type BrainstormIdea = {
  id: string
  text: string
  theme: string
  priority: 1 | 2 | 3
}

type BrainstormData = {
  challenge: string
  ideas: BrainstormIdea[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_DATA: BrainstormData = {
  challenge: '',
  ideas: [{ id: createId(), text: '', theme: '', priority: 2 }],
}

export default function BrainstormingPage() {
  const [data, setData] = useState<BrainstormData>(DEFAULT_DATA)
  useProjectToolData<BrainstormData>('brainstorming', data, setData)

  const addIdea = () => {
    setData((prev) => ({
      ...prev,
      ideas: [...prev.ideas, { id: createId(), text: '', theme: '', priority: 2 }],
    }))
  }

  const updateIdea = (id: string, patch: Partial<BrainstormIdea>) => {
    setData((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) => (idea.id === id ? { ...idea, ...patch } : idea)),
    }))
  }

  const removeIdea = (id: string) => {
    setData((prev) => {
      const filtered = prev.ideas.filter((idea) => idea.id !== id)
      return {
        ...prev,
        ideas: filtered.length > 0 ? filtered : [{ id: createId(), text: '', theme: '', priority: 2 }],
      }
    })
  }

  const sortedIdeas = useMemo(
    () => [...data.ideas].sort((a, b) => b.priority - a.priority),
    [data.ideas]
  )

  return (
    <ToolLayout
      title="Brainstorming"
      description="Indsaml, sorter og prioriter idéer hurtigt."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-gray-700">Udfordring / fokusområde</label>
          <textarea
            value={data.challenge}
            onChange={(e) => setData((prev) => ({ ...prev, challenge: e.target.value }))}
            placeholder="Hvad brainstormer I på?"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Idéer</h2>
            <button
              type="button"
              onClick={addIdea}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
            >
              + Tilføj idé
            </button>
          </div>
          <div className="space-y-3">
            {sortedIdeas.map((idea) => (
              <div key={idea.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                <textarea
                  value={idea.text}
                  onChange={(e) => updateIdea(idea.id, { text: e.target.value })}
                  placeholder="Skriv idé..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    value={idea.theme}
                    onChange={(e) => updateIdea(idea.id, { theme: e.target.value })}
                    placeholder="Tema (fx onboarding)"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <select
                    value={idea.priority}
                    onChange={(e) =>
                      updateIdea(idea.id, { priority: Number(e.target.value) as 1 | 2 | 3 })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value={1}>Prioritet 1 (lav)</option>
                    <option value={2}>Prioritet 2 (mellem)</option>
                    <option value={3}>Prioritet 3 (høj)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIdea(idea.id)}
                    className="rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
                  >
                    Slet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}

