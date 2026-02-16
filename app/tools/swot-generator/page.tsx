'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SWOTGenerator() {
  const [swot, setSwot] = useState({
    strengths: [''],
    weaknesses: [''],
    opportunities: [''],
    threats: ['']
  })

  const updateField = (category: keyof typeof swot, index: number, value: string) => {
    const newSwot = { ...swot }
    newSwot[category] = [...newSwot[category]]
    newSwot[category][index] = value
    setSwot(newSwot)
  }

  const addItem = (category: keyof typeof swot) => {
    const newSwot = { ...swot }
    newSwot[category] = [...newSwot[category], '']
    setSwot(newSwot)
  }

  const removeItem = (category: keyof typeof swot, index: number) => {
    const newSwot = { ...swot }
    newSwot[category] = newSwot[category].filter((_, i) => i !== index)
    if (newSwot[category].length === 0) {
      newSwot[category] = ['']
    }
    setSwot(newSwot)
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              SWOT Analysis
            </h1>
            <p className="text-gray-600">
              Analysér styrker, svagheder, muligheder og trusler
            </p>
          </div>
        </header>

        {/* Classic 2x2 SWOT Grid */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
          <div className="grid grid-cols-2 gap-0 border-2 border-gray-400">
            {/* Top Left - Strengths */}
            <div className="border-r-2 border-b-2 border-gray-400 p-4 bg-green-50">
              <h2 className="text-lg font-bold text-green-900 mb-3 uppercase tracking-wide border-b-2 border-green-300 pb-2">
                Strengths
              </h2>
              <div className="space-y-2">
                {swot.strengths.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('strengths', index, e.target.value)}
                      placeholder="Tilføj styrke..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:border-green-600"
                    />
                    {swot.strengths.length > 1 && (
                      <button
                        onClick={() => removeItem('strengths', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItem('strengths')}
                  className="w-full px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                >
                  + Tilføj
                </button>
              </div>
            </div>

            {/* Top Right - Weaknesses */}
            <div className="border-b-2 border-gray-400 p-4 bg-red-50">
              <h2 className="text-lg font-bold text-red-900 mb-3 uppercase tracking-wide border-b-2 border-red-300 pb-2">
                Weaknesses
              </h2>
              <div className="space-y-2">
                {swot.weaknesses.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('weaknesses', index, e.target.value)}
                      placeholder="Tilføj svaghed..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:border-red-600"
                    />
                    {swot.weaknesses.length > 1 && (
                      <button
                        onClick={() => removeItem('weaknesses', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItem('weaknesses')}
                  className="w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                >
                  + Tilføj
                </button>
              </div>
            </div>

            {/* Bottom Left - Opportunities */}
            <div className="border-r-2 border-gray-400 p-4 bg-blue-50">
              <h2 className="text-lg font-bold text-blue-900 mb-3 uppercase tracking-wide border-b-2 border-blue-300 pb-2">
                Opportunities
              </h2>
              <div className="space-y-2">
                {swot.opportunities.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('opportunities', index, e.target.value)}
                      placeholder="Tilføj mulighed..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:border-blue-600"
                    />
                    {swot.opportunities.length > 1 && (
                      <button
                        onClick={() => removeItem('opportunities', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItem('opportunities')}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                >
                  + Tilføj
                </button>
              </div>
            </div>

            {/* Bottom Right - Threats */}
            <div className="border-gray-400 p-4 bg-orange-50">
              <h2 className="text-lg font-bold text-orange-900 mb-3 uppercase tracking-wide border-b-2 border-orange-300 pb-2">
                Threats
              </h2>
              <div className="space-y-2">
                {swot.threats.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('threats', index, e.target.value)}
                      placeholder="Tilføj trussel..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:border-orange-600"
                    />
                    {swot.threats.length > 1 && (
                      <button
                        onClick={() => removeItem('threats', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItem('threats')}
                  className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium"
                >
                  + Tilføj
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
