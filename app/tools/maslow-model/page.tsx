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
      icon: '🌟',
      color: 'purple',
      description: 'Personlig vækst, kreativitet, opfyldelse af potentiale'
    },
    {
      key: 'esteem' as const,
      title: 'Esteem',
      subtitle: 'Selvrespekt',
      icon: '💪',
      color: 'blue',
      description: 'Selvrespekt, anerkendelse, status'
    },
    {
      key: 'love' as const,
      title: 'Love & Belonging',
      subtitle: 'Kærlighed & Tilhørsforhold',
      icon: '❤️',
      color: 'pink',
      description: 'Venskab, familie, intimitet, tilhørsforhold'
    },
    {
      key: 'safety' as const,
      title: 'Safety',
      subtitle: 'Sikkerhed',
      icon: '🛡️',
      color: 'yellow',
      description: 'Sikkerhed, stabilitet, beskyttelse'
    },
    {
      key: 'physiological' as const,
      title: 'Physiological',
      subtitle: 'Fysiologiske behov',
      icon: '🍞',
      color: 'green',
      description: 'Luft, vand, mad, søvn, varme'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string; hover: string }> = {
      purple: {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        hover: 'hover:bg-purple-100'
      },
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        hover: 'hover:bg-blue-100'
      },
      pink: {
        border: 'border-pink-200',
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        hover: 'hover:bg-pink-100'
      },
      yellow: {
        border: 'border-yellow-200',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        hover: 'hover:bg-yellow-100'
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-700',
        hover: 'hover:bg-green-100'
      }
    }
    return colors[color] || colors.blue
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
              Maslow's Hierarchy of Needs
            </h1>
            <p className="text-gray-600">
              Forstå behovshierarkiet og mappér kundens eller brugerens behov
            </p>
          </div>
        </header>

        {/* Pyramid Visualization */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Behovspyramiden</h2>
          <div className="flex flex-col items-center space-y-2">
            {/* Self-Actualization - Top (smallest) */}
            <div className="w-full max-w-xs">
              <div className="bg-purple-100 border-2 border-purple-300 rounded-t-lg p-4 text-center">
                <div className="text-2xl mb-1">🌟</div>
                <div className="font-semibold text-purple-900">Self-Actualization</div>
                <div className="text-sm text-purple-700">Selvrealisering</div>
              </div>
            </div>
            
            {/* Esteem */}
            <div className="w-full max-w-md">
              <div className="bg-blue-100 border-2 border-blue-300 p-4 text-center">
                <div className="text-2xl mb-1">💪</div>
                <div className="font-semibold text-blue-900">Esteem</div>
                <div className="text-sm text-blue-700">Selvrespekt</div>
              </div>
            </div>
            
            {/* Love & Belonging */}
            <div className="w-full max-w-lg">
              <div className="bg-pink-100 border-2 border-pink-300 p-4 text-center">
                <div className="text-2xl mb-1">❤️</div>
                <div className="font-semibold text-pink-900">Love & Belonging</div>
                <div className="text-sm text-pink-700">Kærlighed & Tilhørsforhold</div>
              </div>
            </div>
            
            {/* Safety */}
            <div className="w-full max-w-xl">
              <div className="bg-yellow-100 border-2 border-yellow-300 p-4 text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <div className="font-semibold text-yellow-900">Safety</div>
                <div className="text-sm text-yellow-700">Sikkerhed</div>
              </div>
            </div>
            
            {/* Physiological - Bottom (largest) */}
            <div className="w-full max-w-2xl">
              <div className="bg-green-100 border-2 border-green-300 rounded-b-lg p-4 text-center">
                <div className="text-2xl mb-1">🍞</div>
                <div className="font-semibold text-green-900">Physiological</div>
                <div className="text-sm text-green-700">Fysiologiske behov</div>
              </div>
            </div>
          </div>
        </div>

        {/* Needs Details */}
        <div className="space-y-6">
          {levels.map((level) => {
            const colors = getColorClasses(level.color)
            return (
              <div
                key={level.key}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${colors.border}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{level.icon}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{level.title}</h2>
                    <p className="text-sm text-gray-600">{level.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{level.description}</p>
                <div className="space-y-3">
                  {needs[level.key].map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={item}
                        onChange={(e) => updateNeed(level.key, index, e.target.value)}
                        placeholder={`Tilføj behov for ${level.title.toLowerCase()}...`}
                        rows={2}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 resize-none"
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
                    className={`w-full px-4 py-3 ${colors.bg} ${colors.text} rounded-lg ${colors.hover} transition-colors font-medium`}
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
