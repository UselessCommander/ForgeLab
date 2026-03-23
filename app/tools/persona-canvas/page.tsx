'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type PersonaSection = {
  id: string
  title: string
  items: string[]
}

type PersonaData = {
  profileTitle: string
  name: string
  age: string
  role: string
  context: string
  quote: string
  imageDataUrl?: string
  sections: PersonaSection[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const defaultSections = (): PersonaSection[] => [
  { id: createId(), title: 'Mål', items: [''] },
  { id: createId(), title: 'Frustrationer', items: [''] },
  { id: createId(), title: 'Behov', items: [''] },
  { id: createId(), title: 'Adfærd', items: [''] },
  { id: createId(), title: 'Kanaler', items: [''] },
]

const DEFAULT_DATA: PersonaData = {
  profileTitle: 'Profil',
  name: '',
  age: '',
  role: '',
  context: '',
  quote: '',
  imageDataUrl: '',
  sections: defaultSections(),
}

function normalizePersonaData(raw: any): PersonaData {
  const base: PersonaData = {
    ...DEFAULT_DATA,
    ...raw,
  }

  if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
    base.sections = raw.sections.map((section: any) => ({
      id: section?.id || createId(),
      title: String(section?.title || 'Ny sektion'),
      items: Array.isArray(section?.items) && section.items.length > 0
        ? section.items.map((item: any) => String(item ?? ''))
        : [''],
    }))
    return base
  }

  // Backward compatibility with previous saved shape
  const legacySections: PersonaSection[] = [
    { id: createId(), title: 'Mål', items: Array.isArray(raw?.goals) ? raw.goals : [''] },
    { id: createId(), title: 'Frustrationer', items: Array.isArray(raw?.frustrations) ? raw.frustrations : [''] },
    { id: createId(), title: 'Behov', items: Array.isArray(raw?.needs) ? raw.needs : [''] },
    { id: createId(), title: 'Adfærd', items: Array.isArray(raw?.behaviours) ? raw.behaviours : [''] },
    { id: createId(), title: 'Kanaler', items: Array.isArray(raw?.channels) ? raw.channels : [''] },
  ].map((section) => ({
    ...section,
    items: section.items.length > 0 ? section.items.map((item: any) => String(item ?? '')) : [''],
  }))

  return {
    ...base,
    sections: legacySections,
  }
}

export default function PersonaCanvasPage() {
  const [data, setData] = useState<PersonaData>(DEFAULT_DATA)
  useProjectToolData<PersonaData>('persona-canvas', data, setData)

  useEffect(() => {
    const normalized = normalizePersonaData(data)
    const currentSerialized = JSON.stringify(data)
    const normalizedSerialized = JSON.stringify(normalized)
    if (currentSerialized !== normalizedSerialized) {
      setData(normalized)
    }
  }, [data, setData])

  const updateField = (key: keyof PersonaData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateSectionTitle = (sectionId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section
      ),
    }))
  }

  const updateListItem = (sectionId: string, index: number, value: string) => {
    setData((prev) => {
      const next = { ...prev }
      next.sections = next.sections.map((section) => {
        if (section.id !== sectionId) return section
        const items = [...section.items]
        items[index] = value
        return { ...section, items }
      })
      return next
    })
  }

  const addListItem = (sectionId: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, ''] } : section
      ),
    }))
  }

  const removeListItem = (sectionId: string, index: number) => {
    setData((prev) => {
      return {
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.id !== sectionId) return section
          const filtered = section.items.filter((_, i) => i !== index)
          return { ...section, items: filtered.length > 0 ? filtered : [''] }
        }),
      }
    })
  }

  const addSection = () => {
    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, { id: createId(), title: 'Ny sektion', items: [''] }],
    }))
  }

  const removeSection = (sectionId: string) => {
    setData((prev) => {
      const filtered = prev.sections.filter((section) => section.id !== sectionId)
      return { ...prev, sections: filtered.length > 0 ? filtered : defaultSections() }
    })
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setData((prev) => ({ ...prev, imageDataUrl: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <ToolLayout
      title="Persona Canvas"
      description="Skab en tydelig persona med mål, behov og adfærd."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="space-y-5">
        <section className="rounded-3xl border border-pink-200/70 bg-gradient-to-br from-pink-50 via-white to-amber-50 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <input
              value={data.profileTitle}
              onChange={(e) => updateField('profileTitle', e.target.value)}
              placeholder="Titel på sektionen"
              className="text-lg font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-pink-300 focus:outline-none max-w-xs"
            />
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg border border-pink-300 bg-pink-50 text-pink-700 text-sm font-medium cursor-pointer hover:bg-pink-100">
                Upload billede
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {data.imageDataUrl && (
                <button
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, imageDataUrl: '' }))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-white"
                >
                  Fjern billede
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-4">
            <div className="rounded-2xl border border-pink-200 bg-white/80 p-3 flex items-center justify-center min-h-[180px]">
              {data.imageDataUrl ? (
                <img
                  src={data.imageDataUrl}
                  alt="Persona"
                  className="w-full h-full object-cover rounded-xl max-h-[240px]"
                />
              ) : (
                <p className="text-xs text-gray-500 text-center">Ingen billede endnu</p>
              )}
            </div>
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
            <textarea
              value={data.quote}
              onChange={(e) => updateField('quote', e.target.value)}
              placeholder='Citat: "Jeg vil gerne løse opgaven hurtigere uden at miste overblik."'
              rows={3}
              className="md:col-span-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Persona-bokse</h2>
            <button
              type="button"
              onClick={addSection}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
            >
              + Tilføj boks
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.sections.map((section) => (
            <div key={section.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={section.title}
                  onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                  className="flex-1 text-base font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-amber-300 focus:outline-none"
                  placeholder="Sektionstitel"
                />
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Slet
                </button>
              </div>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={`${section.id}-${index}`} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateListItem(section.id, index, e.target.value)}
                      placeholder="Skriv indhold..."
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {section.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem(section.id, index)}
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
                onClick={() => addListItem(section.id)}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                + Tilføj
              </button>
            </div>
          ))}
          </div>
        </section>
      </div>
    </ToolLayout>
  )
}

