'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { Link2, ImagePlus, Plus, Copy, Check, Trash2 } from 'lucide-react'

type VariantType = 'url' | 'image'

interface VariantRow {
  id: string
  label: string
  type: VariantType
  value: string
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function AbTestPage() {
  const [title, setTitle] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>([
    { id: '1', label: 'A', type: 'url', value: '' },
    { id: '2', label: 'B', type: 'url', value: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ magicLink: string; testId: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [results, setResults] = useState<{ label: string; count: number }[] | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)

  const updateVariant = (id: string, upd: Partial<VariantRow>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...upd } : v)))
  }

  const addVariant = () => {
    if (variants.length >= 6) return
    const nextLabel = LABELS[variants.length] ?? String(variants.length + 1)
    setVariants((prev) => [...prev, { id: String(Date.now()), label: nextLabel, type: 'url', value: '' }])
  }

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  const onImageFile = (id: string, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateVariant(id, { type: 'image', value: reader.result as string })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        title: title.trim() || 'A/B/N Test',
        variants: variants.map((v) => ({
          label: v.label,
          type: v.type,
          value: v.value.trim(),
        })),
      }
      const res = await fetch('/api/ab-test/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fejl ved oprettelse')
        return
      }
      setCreated({ magicLink: data.magicLink, testId: data.testId })
    } catch {
      setError('Netværksfejl')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (!created) return
    navigator.clipboard.writeText(created.magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadResults = async () => {
    if (!created) return
    setResultsLoading(true)
    setResults(null)
    try {
      const res = await fetch(`/api/ab-test/results?testId=${encodeURIComponent(created.testId)}`)
      const data = await res.json()
      if (res.ok && data.results) setResults(data.results)
    } finally {
      setResultsLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">A/B/N Test</h1>
              <p className="text-gray-600">Opret en test og del et magic link. Testpersoner vælger den variant de bedst kan lide.</p>
            </div>
          </div>
        </header>

        {created ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Test oprettet</h2>
              <p className="text-gray-600">Del linket nedenfor med testpersoner. De ser varianterne og vælger deres favorit.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={created.magicLink}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopieret' : 'Kopier link'}
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div>
                <button
                  type="button"
                  onClick={loadResults}
                  disabled={resultsLoading}
                  className="text-violet-600 font-medium hover:underline disabled:opacity-50"
                >
                  {resultsLoading ? 'Henter...' : 'Se resultater'}
                </button>
                {results && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {results.map((r) => (
                      <li key={r.label}>Variant {r.label}: {r.count} stemmer</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setCreated(null); setTitle(''); setVariants([{ id: '1', label: 'A', type: 'url', value: '' }, { id: '2', label: 'B', type: 'url', value: '' }]); setResults(null) }}
                className="block text-violet-600 font-medium hover:underline"
              >
                Opret en ny test
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Testens titel (valgfri)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Forside design"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Varianter</h2>
                <button
                  type="button"
                  onClick={addVariant}
                  disabled={variants.length >= 6}
                  className="inline-flex items-center gap-2 px-3 py-2 text-violet-600 font-medium hover:bg-violet-50 rounded-lg disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Tilføj
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">Variant {v.label}</span>
                      {variants.length > 2 && (
                        <button type="button" onClick={() => removeVariant(v.id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => updateVariant(v.id, { type: 'url' })}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${v.type === 'url' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                      >
                        <Link2 className="w-4 h-4" /> URL / hjemmeside
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVariant(v.id, { type: 'image', value: v.type === 'image' ? v.value : '' })}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${v.type === 'image' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                      >
                        <ImagePlus className="w-4 h-4" /> Billede
                      </button>
                    </div>
                    {v.type === 'url' ? (
                      <input
                        type="url"
                        value={v.value}
                        onChange={(e) => updateVariant(v.id, { value: e.target.value })}
                        placeholder="https://eksempel.dk"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                        required
                      />
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onImageFile(v.id, e.target.files?.[0] ?? null)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200 file:bg-white file:text-violet-600"
                        />
                        {v.value && (
                          <div className="mt-2 relative inline-block max-w-[200px] rounded-lg overflow-hidden border border-gray-200">
                            <img src={v.value} alt={`Variant ${v.label}`} className="w-full h-auto max-h-32 object-contain" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? 'Opretter...' : 'Opret test og få magic link'}
            </button>
          </form>
        )}

        <footer className="mt-12 text-center">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">← Tilbage til dashboard</Link>
        </footer>
      </div>
    </div>
  )
}
