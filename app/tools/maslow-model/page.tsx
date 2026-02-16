'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MaslowModel() {
  const [needs, setNeeds] = useState({
    physiological: [''],
    safety: [''],
    love: [''],
    esteem: [''],
    selfActualization: ['']
  })

  const updateNeed = (category: keyof typeof needs, index: number, value: string) => {
    const newNeeds = { ...needs }
    newNeeds[category] = [...newNeeds[category]]
    newNeeds[category][index] = value
    setNeeds(newNeeds)
  }

  const addItem = (category: keyof typeof needs) => {
    const newNeeds = { ...needs }
    newNeeds[category] = [...newNeeds[category], '']
    setNeeds(newNeeds)
  }

  const removeItem = (category: keyof typeof needs, index: number) => {
    const newNeeds = { ...needs }
    newNeeds[category] = newNeeds[category].filter((_, i) => i !== index)
    if (newNeeds[category].length === 0) {
      newNeeds[category] = ['']
    }
    setNeeds(newNeeds)
  }

  const levels = [
    {
      key: 'selfActualization' as const,
      title: 'Self-Actualization',
      subtitle: 'Selvrealisering',
      color: 'purple'
    },
    {
      key: 'esteem' as const,
      title: 'Esteem',
      subtitle: 'Selvrespekt',
      color: 'blue'
    },
    {
      key: 'love' as const,
      title: 'Love & Belonging',
      subtitle: 'Kærlighed & Tilhørsforhold',
      color: 'pink'
    },
    {
      key: 'safety' as const,
      title: 'Safety',
      subtitle: 'Sikkerhed',
      color: 'yellow'
    },
    {
      key: 'physiological' as const,
      title: 'Physiological',
      subtitle: 'Fysiologiske behov',
      color: 'green'
    }
  ]

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
              Maslow's Hierarchy of Needs
            </h1>
            <p className="text-gray-600">
              Forstå behovshierarkiet og mappér kundens eller brugerens behov
            </p>
          </div>
        </header>

        {/* Classic Pyramid Visualization */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-300 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Behovspyramiden</h2>
          <div className="flex flex-col items-center space-y-0">
            {/* Self-Actualization - Top (smallest) */}
            <div className="w-full max-w-[200px]">
              <div className="bg-purple-200 border-4 border-purple-400 rounded-t-lg p-4 text-center">
                <div className="text-xl mb-1">🌟</div>
                <div className="font-bold text-purple-900 text-sm">Self-Actualization</div>
                <div className="text-xs text-purple-700">Selvrealisering</div>
              </div>
            </div>
            
            {/* Esteem */}
            <div className="w-full max-w-[300px]">
              <div className="bg-blue-200 border-4 border-blue-400 p-4 text-center">
                <div className="text-xl mb-1">💪</div>
                <div className="font-bold text-blue-900 text-sm">Esteem</div>
                <div className="text-xs text-blue-700">Selvrespekt</div>
              </div>
            </div>
            
            {/* Love & Belonging */}
            <div className="w-full max-w-[400px]">
              <div className="bg-pink-200 border-4 border-pink-400 p-4 text-center">
                <div className="text-xl mb-1">❤️</div>
                <div className="font-bold text-pink-900 text-sm">Love & Belonging</div>
                <div className="text-xs text-pink-700">Kærlighed & Tilhørsforhold</div>
              </div>
            </div>
            
            {/* Safety */}
            <div className="w-full max-w-[500px]">
              <div className="bg-yellow-200 border-4 border-yellow-400 p-4 text-center">
                <div className="text-xl mb-1">🛡️</div>
                <div className="font-bold text-yellow-900 text-sm">Safety</div>
                <div className="text-xs text-yellow-700">Sikkerhed</div>
              </div>
            </div>
            
            {/* Physiological - Bottom (largest) */}
            <div className="w-full max-w-[600px]">
              <div className="bg-green-200 border-4 border-green-400 rounded-b-lg p-4 text-center">
                <div className="text-xl mb-1">🍞</div>
                <div className="font-bold text-green-900 text-sm">Physiological</div>
                <div className="text-xs text-green-700">Fysiologiske behov</div>
              </div>
            </div>
          </div>
        </div>

        {/* Needs Details */}
        <div className="space-y-4">
          {levels.map((level) => {
            const colorClasses = {
              purple: 'border-purple-300 bg-purple-50',
              blue: 'border-blue-300 bg-blue-50',
              pink: 'border-pink-300 bg-pink-50',
              yellow: 'border-yellow-300 bg-yellow-50',
              green: 'border-green-300 bg-green-50'
            }
            
            return (
              <div
                key={level.key}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${colorClasses[level.color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{level.title}</h2>
                  <span className="text-sm text-gray-600">({level.subtitle})</span>
                </div>
                <div className="space-y-2">
                  {needs[level.key].map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={item}
                        onChange={(e) => updateNeed(level.key, index, e.target.value)}
                        placeholder={`Tilføj behov...`}
                        rows={2}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 resize-none"
                      />
                      {needs[level.key].length > 1 && (
                        <button
                          onClick={() => removeItem(level.key, index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(level.key)}
                    className={`w-full px-4 py-2 ${colorClasses[level.color as keyof typeof colorClasses]} rounded-lg hover:opacity-80 transition-opacity font-medium`}
                  >
                    + Tilføj behov
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
