'use client'

import { useState } from 'react'

interface Variant {
  id: string
  label: string
  type: 'url' | 'image'
  value: string
}

interface Props {
  testId: string
  title: string
  variants: Variant[]
}

export default function AbTestVoteClient({ testId, title, variants }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (variantId: string) => {
    if (submitted) return
    setChosen(variantId)
    setLoading(true)
    try {
      const res = await fetch('/api/ab-test/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, variantId }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tak for din stemme!</h1>
          <p className="text-gray-600">Du har valgt variant {variants.find((v) => v.id === chosen)?.label ?? ''}. Din feedback er gemt.</p>
        </div>
      </div>
    )
  }

  const n = variants.length
  const isTwo = n === 2
  const gridCols =
    n <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : n === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : n === 4
          ? 'grid-cols-2 sm:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  const maxWidth = isTwo ? 'max-w-6xl' : n === 3 ? 'max-w-5xl' : 'max-w-6xl'
  const gap = isTwo ? 'gap-6 sm:gap-8' : n === 3 ? 'gap-6' : 'gap-4'

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className={`w-full ${maxWidth} mx-auto`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title || 'A/B/N Test'}</h1>
          <p className="text-gray-600">Vælg den variant du bedst kan lide.</p>
        </div>

        <div className={`grid grid-cols-1 ${gridCols} ${gap}`}>
          {variants.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:border-violet-300 hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-gray-100 relative">
                {v.type === 'url' ? (
                  <iframe
                    src={v.value}
                    title={`Variant ${v.label}`}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <img src={v.value} alt={`Variant ${v.label}`} className="w-full h-full object-contain" />
                )}
              </div>
              <div className={isTwo ? 'p-5' : 'p-4'}>
                <p className="font-medium text-gray-900 mb-3">Variant {v.label}</p>
                <button
                  type="button"
                  onClick={() => submit(v.id)}
                  disabled={loading}
                  className="w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
                >
                  Vælg denne
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
