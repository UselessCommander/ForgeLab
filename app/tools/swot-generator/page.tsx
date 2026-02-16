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
        <header className="mb-8 md:mb-12">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              SWOT Generator
            </h1>
            <p className="text-gray-600">
              Analysér styrker, svagheder, muligheder og trusler
            </p>
          </div>
        </header>

        {/* SWOT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">💪</span>
              Styrker (Strengths)
            </h2>
            <div className="space-y-3">
              {swot.strengths.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField('strengths', index, e.target.value)}
                    placeholder="Tilføj en styrke..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  />
                  {swot.strengths.length > 1 && (
                    <button
                      onClick={() => removeItem('strengths', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('strengths')}
                className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                + Tilføj styrke
              </button>
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-red-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Svagheder (Weaknesses)
            </h2>
            <div className="space-y-3">
              {swot.weaknesses.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField('weaknesses', index, e.target.value)}
                    placeholder="Tilføj en svaghed..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                  {swot.weaknesses.length > 1 && (
                    <button
                      onClick={() => removeItem('weaknesses', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('weaknesses')}
                className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                + Tilføj svaghed
              </button>
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              Muligheder (Opportunities)
            </h2>
            <div className="space-y-3">
              {swot.opportunities.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField('opportunities', index, e.target.value)}
                    placeholder="Tilføj en mulighed..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  {swot.opportunities.length > 1 && (
                    <button
                      onClick={() => removeItem('opportunities', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('opportunities')}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                + Tilføj mulighed
              </button>
            </div>
          </div>

          {/* Threats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-orange-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Trusler (Threats)
            </h2>
            <div className="space-y-3">
              {swot.threats.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField('threats', index, e.target.value)}
                    placeholder="Tilføj en trussel..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  />
                  {swot.threats.length > 1 && (
                    <button
                      onClick={() => removeItem('threats', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('threats')}
                className="w-full px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium"
              >
                + Tilføj trussel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
