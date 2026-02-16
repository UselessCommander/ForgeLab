'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function EmpathyMap() {
  const [map, setMap] = useState({
    says: [''],
    thinks: [''],
    feels: [''],
    does: ['']
  })

  const updateField = (category: keyof typeof map, index: number, value: string) => {
    const newMap = { ...map }
    newMap[category] = [...newMap[category]]
    newMap[category][index] = value
    setMap(newMap)
  }

  const addItem = (category: keyof typeof map) => {
    const newMap = { ...map }
    newMap[category] = [...newMap[category], '']
    setMap(newMap)
  }

  const removeItem = (category: keyof typeof map, index: number) => {
    const newMap = { ...map }
    newMap[category] = newMap[category].filter((_, i) => i !== index)
    if (newMap[category].length === 0) {
      newMap[category] = ['']
    }
    setMap(newMap)
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
              Empathy Map
            </h1>
            <p className="text-gray-600">
              Forstå kundens perspektiv gennem deres ord, tanker, følelser og handlinger
            </p>
          </div>
        </header>

        {/* Classic 2x2 Empathy Map Grid */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
          <div className="grid grid-cols-2 gap-0 border-2 border-gray-400">
            {/* Top Left - Says */}
            <div className="border-r-2 border-b-2 border-gray-400 p-4 bg-blue-50">
              <h2 className="text-lg font-bold text-blue-900 mb-3 uppercase tracking-wide border-b-2 border-blue-300 pb-2">
                Says
              </h2>
              <p className="text-xs text-gray-600 mb-3">Hvad siger kunden højt?</p>
              <div className="space-y-2">
                {map.says.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('says', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-blue-600"
                    />
                    {map.says.length > 1 && (
                      <button onClick={() => removeItem('says', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('says')} className="text-xs text-blue-600 hover:text-blue-800">+ Tilføj</button>
              </div>
            </div>

            {/* Top Right - Thinks */}
            <div className="border-b-2 border-gray-400 p-4 bg-purple-50">
              <h2 className="text-lg font-bold text-purple-900 mb-3 uppercase tracking-wide border-b-2 border-purple-300 pb-2">
                Thinks
              </h2>
              <p className="text-xs text-gray-600 mb-3">Hvad tænker kunden?</p>
              <div className="space-y-2">
                {map.thinks.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('thinks', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-purple-600"
                    />
                    {map.thinks.length > 1 && (
                      <button onClick={() => removeItem('thinks', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('thinks')} className="text-xs text-purple-600 hover:text-purple-800">+ Tilføj</button>
              </div>
            </div>

            {/* Bottom Left - Feels */}
            <div className="border-r-2 border-gray-400 p-4 bg-red-50">
              <h2 className="text-lg font-bold text-red-900 mb-3 uppercase tracking-wide border-b-2 border-red-300 pb-2">
                Feels
              </h2>
              <p className="text-xs text-gray-600 mb-3">Hvad føler kunden?</p>
              <div className="space-y-2">
                {map.feels.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('feels', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-red-600"
                    />
                    {map.feels.length > 1 && (
                      <button onClick={() => removeItem('feels', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('feels')} className="text-xs text-red-600 hover:text-red-800">+ Tilføj</button>
              </div>
            </div>

            {/* Bottom Right - Does */}
            <div className="border-gray-400 p-4 bg-green-50">
              <h2 className="text-lg font-bold text-green-900 mb-3 uppercase tracking-wide border-b-2 border-green-300 pb-2">
                Does
              </h2>
              <p className="text-xs text-gray-600 mb-3">Hvad gør kunden?</p>
              <div className="space-y-2">
                {map.does.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('does', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-green-600"
                    />
                    {map.does.length > 1 && (
                      <button onClick={() => removeItem('does', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('does')} className="text-xs text-green-600 hover:text-green-800">+ Tilføj</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
