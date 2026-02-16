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

  const sections = [
    { key: 'says' as const, title: 'Says', icon: '💬', color: 'blue', description: 'Hvad siger kunden højt?' },
    { key: 'thinks' as const, title: 'Thinks', icon: '🧠', color: 'purple', description: 'Hvad tænker kunden?' },
    { key: 'feels' as const, title: 'Feels', icon: '❤️', color: 'red', description: 'Hvad føler kunden?' },
    { key: 'does' as const, title: 'Does', icon: '👤', color: 'green', description: 'Hvad gør kunden?' }
  ]

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
              Empathy Map
            </h1>
            <p className="text-gray-600">
              Forstå kundens perspektiv gennem deres ord, tanker, følelser og handlinger
            </p>
          </div>
        </header>

        {/* Empathy Map Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const colorClasses = {
              blue: 'border-blue-200 bg-blue-50',
              purple: 'border-purple-200 bg-purple-50',
              red: 'border-red-200 bg-red-50',
              green: 'border-green-200 bg-green-50'
            }
            
            return (
              <div
                key={section.key}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${colorClasses[section.color as keyof typeof colorClasses]}`}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  {section.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                <div className="space-y-3">
                  {map[section.key].map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={item}
                        onChange={(e) => updateField(section.key, index, e.target.value)}
                        placeholder={`Tilføj ${section.title.toLowerCase()}...`}
                        rows={3}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none"
                      />
                      {map[section.key].length > 1 && (
                        <button
                          onClick={() => removeItem(section.key, index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(section.key)}
                    className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
                  >
                    + Tilføj {section.title}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
