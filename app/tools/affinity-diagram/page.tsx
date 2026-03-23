'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type AffinityNote = {
  id: string
  text: string
}

type AffinityGroup = {
  id: string
  title: string
  notes: AffinityNote[]
}

type AffinityData = {
  groups: AffinityGroup[]
  ungrouped: AffinityNote[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_DATA: AffinityData = {
  groups: [
    { id: createId(), title: 'Tema 1', notes: [] },
    { id: createId(), title: 'Tema 2', notes: [] },
    { id: createId(), title: 'Tema 3', notes: [] },
  ],
  ungrouped: [
    { id: createId(), text: '' },
    { id: createId(), text: '' },
  ],
}

function AffinityDiagramContent() {
  const [data, setData] = useState<AffinityData>(DEFAULT_DATA)

  // Gem/indlæs automatisk i projektkontekst
  useProjectToolData<AffinityData>('affinity-diagram', data, setData)

  const addUngroupedNote = () => {
    setData((prev) => ({
      ...prev,
      ungrouped: [...prev.ungrouped, { id: createId(), text: '' }],
    }))
  }

  const updateUngroupedNote = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      ungrouped: prev.ungrouped.map((n) => (n.id === id ? { ...n, text } : n)),
    }))
  }

  const removeUngroupedNote = (id: string) => {
    setData((prev) => ({
      ...prev,
      ungrouped: prev.ungrouped.filter((n) => n.id !== id),
    }))
  }

  const addGroup = () => {
    const next = data.groups.length + 1
    setData((prev) => ({
      ...prev,
      groups: [...prev.groups, { id: createId(), title: `Tema ${next}`, notes: [] }],
    }))
  }

  const updateGroupTitle = (groupId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, title } : g)),
    }))
  }

  const removeGroup = (groupId: string) => {
    setData((prev) => {
      const target = prev.groups.find((g) => g.id === groupId)
      const movedNotes = target?.notes || []
      return {
        groups: prev.groups.filter((g) => g.id !== groupId),
        ungrouped: [...prev.ungrouped, ...movedNotes],
      }
    })
  }

  const addNoteToGroup = (groupId: string) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, notes: [...g.notes, { id: createId(), text: '' }] } : g
      ),
    }))
  }

  const updateGroupNote = (groupId: string, noteId: string, text: string) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? { ...g, notes: g.notes.map((n) => (n.id === noteId ? { ...n, text } : n)) }
          : g
      ),
    }))
  }

  const removeGroupNote = (groupId: string, noteId: string) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, notes: g.notes.filter((n) => n.id !== noteId) } : g
      ),
    }))
  }

  const moveUngroupedToGroup = (noteId: string, groupId: string) => {
    setData((prev) => {
      const note = prev.ungrouped.find((n) => n.id === noteId)
      if (!note) return prev
      return {
        ungrouped: prev.ungrouped.filter((n) => n.id !== noteId),
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, notes: [...g.notes, note] } : g
        ),
      }
    })
  }

  const moveGroupNoteToUngrouped = (groupId: string, noteId: string) => {
    setData((prev) => {
      const group = prev.groups.find((g) => g.id === groupId)
      const note = group?.notes.find((n) => n.id === noteId)
      if (!note) return prev
      return {
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, notes: g.notes.filter((n) => n.id !== noteId) } : g
        ),
        ungrouped: [...prev.ungrouped, note],
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Rå noter</h2>
          <button
            type="button"
            onClick={addUngroupedNote}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
          >
            + Tilføj note
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Skriv dine idéer her først, og flyt dem derefter til et tema i diagrammet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.ungrouped.map((note) => (
            <div key={note.id} className="rounded-xl border border-gray-200 bg-amber-50/50 p-3 space-y-2">
              <textarea
                value={note.text}
                onChange={(e) => updateUngroupedNote(note.id, e.target.value)}
                placeholder="Skriv note..."
                className="w-full min-h-[90px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex flex-wrap gap-2">
                {data.groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => moveUngroupedToGroup(note.id, group.id)}
                    className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                  >
                    + {group.title || 'Tema'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => removeUngroupedNote(note.id)}
                  className="ml-auto text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Slet
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Affinity Diagram</h2>
          <button
            type="button"
            onClick={addGroup}
            className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black"
          >
            + Nyt tema
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.groups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={group.title}
                  onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                  placeholder="Tema-navn"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="px-2 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Slet
                </button>
              </div>
              <div className="space-y-2">
                {group.notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-gray-200 bg-gray-50 p-2 space-y-2">
                    <textarea
                      value={note.text}
                      onChange={(e) => updateGroupNote(group.id, note.id, e.target.value)}
                      placeholder="Skriv note..."
                      className="w-full min-h-[80px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => moveGroupNoteToUngrouped(group.id, note.id)}
                        className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-white"
                      >
                        Til rå noter
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGroupNote(group.id, note.id)}
                        className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addNoteToGroup(group.id)}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                + Tilføj note i tema
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function AffinityDiagramPage() {
  return (
    <ToolLayout
      title="Affinity Diagram"
      description="Gruppér idéer og observationer i temaer for at skabe mønstre og overblik."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <AffinityDiagramContent />
    </ToolLayout>
  )
}

