'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PortersFiveForces() {
  const [forces, setForces] = useState({
    rivalry: [''],
    suppliers: [''],
    buyers: [''],
    substitutes: [''],
    newEntrants: ['']
  })

  const updateForce = (category: keyof typeof forces, index: number, value: string) => {
    const newForces = { ...forces }
    newForces[category] = [...newForces[category]]
    newForces[category][index] = value
    setForces(newForces)
  }

  const addItem = (category: keyof typeof forces) => {
    const newForces = { ...forces }
    newForces[category] = [...newForces[category], '']
    setForces(newForces)
  }

  const removeItem = (category: keyof typeof forces, index: number) => {
    const newForces = { ...forces }
    newForces[category] = newForces[category].filter((_, i) => i !== index)
    if (newForces[category].length === 0) {
      newForces[category] = ['']
    }
    setForces(newForces)
  }

  const forceConfigs = [
    {
      key: 'rivalry' as const,
      title: 'Rivalry Among Existing Competitors',
      icon: '⚔️',
      color: 'red',
      description: 'Konkurrenceintensiteten i branchen'
    },
    {
      key: 'suppliers' as const,
      title: 'Bargaining Power of Suppliers',
      icon: '🏭',
      color: 'orange',
      description: 'Leverandørernes forhandlingsstyrke'
    },
    {
      key: 'buyers' as const,
      title: 'Bargaining Power of Buyers',
      icon: '🛒',
      color: 'blue',
      description: 'Købernes forhandlingsstyrke'
    },
    {
      key: 'substitutes' as const,
      title: 'Threat of Substitute Products',
      icon: '🔄',
      color: 'yellow',
      description: 'Truslen fra erstatningsprodukter'
    },
    {
      key: 'newEntrants' as const,
      title: 'Threat of New Entrants',
      icon: '🚪',
      color: 'green',
      description: 'Truslen fra nye aktører'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string; hover: string }> = {
      red: {
        border: 'border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-700',
        hover: 'hover:bg-red-100'
      },
      orange: {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        hover: 'hover:bg-orange-100'
      },
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        hover: 'hover:bg-blue-100'
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
              Porter's 5 Forces
            </h1>
            <p className="text-gray-600">
              Analysér branchens konkurrencemæssige kræfter og strukturelle faktorer
            </p>
          </div>
        </header>

        {/* Forces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forceConfigs.map((force) => {
            const colors = getColorClasses(force.color)
            return (
              <div
                key={force.key}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 ${colors.border}`}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">{force.icon}</span>
                  {force.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{force.description}</p>
                <div className="space-y-3">
                  {forces[force.key].map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={item}
                        onChange={(e) => updateForce(force.key, index, e.target.value)}
                        placeholder="Tilføj faktor..."
                        rows={3}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 resize-none"
                      />
                      {forces[force.key].length > 1 && (
                        <button
                          onClick={() => removeItem(force.key, index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(force.key)}
                    className={`w-full px-4 py-3 ${colors.bg} ${colors.text} rounded-lg ${colors.hover} transition-colors font-medium`}
                  >
                    + Tilføj faktor
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
