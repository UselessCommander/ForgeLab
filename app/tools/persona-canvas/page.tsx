'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type PersonaData = {
  name: string
  age: string
  education: string
  status: string
  occupation: string
  role?: string
  location: string
  techLiterate: string
  bio: string
  context?: string
  quote: string
  coreNeeds: string[]
  frustrations: string[]
  brands: string[]
  personality: string[]
  paymentMedium: string
  platform: string
  imageDataUrl?: string
}

const defaultList = (value: unknown, fallback: string[] = ['']): string[] => {
  if (!Array.isArray(value)) return fallback
  const normalized = value.map((item) => String(item ?? '').trimEnd())
  return normalized.length > 0 ? normalized : fallback
}

const DEFAULT_DATA: PersonaData = {
  name: '',
  age: '',
  education: '',
  status: '',
  occupation: '',
  role: '',
  location: '',
  techLiterate: '',
  bio: '',
  context: '',
  quote: '',
  coreNeeds: [''],
  frustrations: [''],
  brands: [''],
  personality: [''],
  paymentMedium: '',
  platform: '',
  imageDataUrl: '',
}

function normalizePersonaData(raw: any): PersonaData {
  const normalized: PersonaData = {
    ...DEFAULT_DATA,
    ...raw,
    coreNeeds: defaultList(raw?.coreNeeds || raw?.needs),
    frustrations: defaultList(raw?.frustrations),
    brands: defaultList(raw?.brands),
    personality: defaultList(raw?.personality),
  }

  if (!normalized.bio && typeof raw?.context === 'string') {
    normalized.bio = raw.context
  }

  if (!normalized.occupation && typeof raw?.role === 'string') {
    normalized.occupation = raw.role
  }

  if (!normalized.role && typeof normalized.occupation === 'string') {
    normalized.role = normalized.occupation
  }

  if (!normalized.context && typeof normalized.bio === 'string') {
    normalized.context = normalized.bio
  }

  if (!normalized.name && typeof raw?.profileTitle === 'string') {
    normalized.name = raw.profileTitle
  }

  if (Array.isArray(raw?.sections)) {
    const mapped = raw.sections as Array<{ title?: string; items?: string[] }>
    mapped.forEach((section) => {
      const title = String(section?.title || '').toLowerCase()
      const items = defaultList(section?.items)
      if (title.includes('behov') || title.includes('need')) normalized.coreNeeds = items
      if (title.includes('frustr')) normalized.frustrations = items
      if (title.includes('brand')) normalized.brands = items
      if (title.includes('person')) normalized.personality = items
    })
  }

  return normalized
}

function SectionListEditor({
  title,
  items,
  onChange,
}: {
  title: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-start gap-2">
            <span className="mt-2 text-gray-400">•</span>
            <textarea
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[index] = e.target.value
                onChange(next)
              }}
              rows={2}
              placeholder="Skriv punkt..."
              className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
            />
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                aria-label={`Fjern ${title} punkt`}
              >
                Fjern
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-3 rounded-md border border-dashed border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50"
      >
        + Tilføj punkt
      </button>
    </section>
  )
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
    setData((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'occupation') next.role = value
      if (key === 'bio') next.context = value
      return next
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
      title="Persona-kort"
      description="Byg en tydelig persona i et visuelt kort med redigerbare felter."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 text-gray-900 shadow-sm md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">Klik i felterne og skriv dit eget indhold.</p>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100">
              Upload billede
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {data.imageDataUrl ? (
              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, imageDataUrl: '' }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Fjern billede
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(520px,1.4fr)]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <input
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Navn på persona"
                className="mb-4 w-full bg-transparent text-4xl font-bold text-gray-900 outline-none placeholder:text-gray-400"
              />
              <div className="mb-4 overflow-hidden rounded-full border border-amber-200 bg-amber-50">
                {data.imageDataUrl ? (
                  <img src={data.imageDataUrl} alt="Persona" className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-gray-500">Upload et portrætbillede</div>
                )}
              </div>

              <div className="space-y-2">
                {[
                  { label: 'ALDER', key: 'age' },
                  { label: 'UDDANNELSE', key: 'education' },
                  { label: 'STATUS', key: 'status' },
                  { label: 'STILLING', key: 'occupation' },
                  { label: 'LOKATION', key: 'location' },
                  { label: 'TEKNISK NIVEAU', key: 'techLiterate' },
                ].map((field) => (
                  <div key={field.key} className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <p className="text-xs font-semibold tracking-wide text-gray-500">{field.label}</p>
                    <input
                      value={data[field.key as keyof PersonaData] as string}
                      onChange={(e) => updateField(field.key as keyof PersonaData, e.target.value)}
                      placeholder="Skriv værdi"
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <textarea
                value={data.quote}
                onChange={(e) => updateField('quote', e.target.value)}
                rows={4}
                placeholder='Citat, fx: "Jeg bruger mest online løsninger..."'
                className="w-full resize-y bg-transparent text-2xl leading-snug text-gray-900 outline-none placeholder:text-gray-400"
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-gray-900">Personlighed</h3>
              <div className="grid grid-cols-2 gap-2">
                {data.personality.map((tag, index) => (
                  <div key={`personality-${index}`} className="flex gap-2">
                    <input
                      value={tag}
                      onChange={(e) => {
                        const next = [...data.personality]
                        next[index] = e.target.value
                        setData((prev) => ({ ...prev, personality: next }))
                      }}
                      placeholder="Egenskab"
                      className="w-full rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
                    />
                    {data.personality.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            personality: prev.personality.filter((_, i) => i !== index),
                          }))
                        }
                        className="rounded-md border border-gray-300 px-2 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        -
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, personality: [...prev.personality, ''] }))}
                className="mt-3 rounded-md border border-dashed border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50"
              >
                + Tilføj egenskab
              </button>
            </section>
          </section>

          <section className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-gray-900">Bio</h3>
              <textarea
                value={data.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={4}
                placeholder="Beskriv personaen..."
                className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
              />
            </section>

            <SectionListEditor
              title="Kernebehov"
              items={data.coreNeeds}
              onChange={(items) => setData((prev) => ({ ...prev, coreNeeds: items }))}
            />

            <SectionListEditor
              title="Frustrationer"
              items={data.frustrations}
              onChange={(items) => setData((prev) => ({ ...prev, frustrations: items }))}
            />

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-gray-900">Foretrukne brands</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {data.brands.map((brand, index) => (
                  <div key={`brand-${index}`} className="flex gap-2">
                    <input
                      value={brand}
                      onChange={(e) => {
                        const next = [...data.brands]
                        next[index] = e.target.value
                        setData((prev) => ({ ...prev, brands: next }))
                      }}
                      placeholder="Brand"
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
                    />
                    {data.brands.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, brands: prev.brands.filter((_, i) => i !== index) }))
                        }
                        className="rounded-md border border-gray-300 px-2 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        -
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setData((prev) => ({ ...prev, brands: [...prev.brands, ''] }))}
                className="mt-3 rounded-md border border-dashed border-amber-300 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-50"
              >
                + Tilføj brand
              </button>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-xl font-bold text-gray-900">Betalingsform</h3>
                <input
                  value={data.paymentMedium}
                  onChange={(e) => updateField('paymentMedium', e.target.value)}
                  placeholder="fx Digital betaling"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
                />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-xl font-bold text-gray-900">Platform</h3>
                <input
                  value={data.platform}
                  onChange={(e) => updateField('platform', e.target.value)}
                  placeholder="fx Mobil app"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300"
                />
              </section>
            </div>
          </section>
        </div>
      </div>
    </ToolLayout>
  )
}

