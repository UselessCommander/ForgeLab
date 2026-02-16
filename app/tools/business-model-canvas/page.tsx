'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BusinessModelCanvas() {
  const [canvas, setCanvas] = useState({
    keyPartners: [''],
    keyActivities: [''],
    keyResources: [''],
    valuePropositions: [''],
    customerRelationships: [''],
    channels: [''],
    customerSegments: [''],
    costStructure: [''],
    revenueStreams: ['']
  })

  const updateField = (category: keyof typeof canvas, index: number, value: string) => {
    const newCanvas = { ...canvas }
    newCanvas[category] = [...newCanvas[category]]
    newCanvas[category][index] = value
    setCanvas(newCanvas)
  }

  const addItem = (category: keyof typeof canvas) => {
    const newCanvas = { ...canvas }
    newCanvas[category] = [...newCanvas[category], '']
    setCanvas(newCanvas)
  }

  const removeItem = (category: keyof typeof canvas, index: number) => {
    const newCanvas = { ...canvas }
    newCanvas[category] = newCanvas[category].filter((_, i) => i !== index)
    if (newCanvas[category].length === 0) {
      newCanvas[category] = ['']
    }
    setCanvas(newCanvas)
  }

  const sections = [
    {
      key: 'keyPartners' as const,
      title: 'Key Partners',
      icon: '🤝',
      color: 'blue',
      description: 'Hvem er dine vigtigste partnere og leverandører?'
    },
    {
      key: 'keyActivities' as const,
      title: 'Key Activities',
      icon: '⚙️',
      color: 'blue',
      description: 'Hvad er de vigtigste aktiviteter for din forretning?'
    },
    {
      key: 'keyResources' as const,
      title: 'Key Resources',
      icon: '🔑',
      color: 'blue',
      description: 'Hvad er dine vigtigste ressourcer?'
    },
    {
      key: 'valuePropositions' as const,
      title: 'Value Propositions',
      icon: '💎',
      color: 'green',
      description: 'Hvad er værdien du leverer til kunderne?'
    },
    {
      key: 'customerRelationships' as const,
      title: 'Customer Relationships',
      icon: '💬',
      color: 'pink',
      description: 'Hvilken type relation har du med kunderne?'
    },
    {
      key: 'channels' as const,
      title: 'Channels',
      icon: '📢',
      color: 'pink',
      description: 'Hvordan når du kunderne?'
    },
    {
      key: 'customerSegments' as const,
      title: 'Customer Segments',
      icon: '👥',
      color: 'pink',
      description: 'Hvem er dine kunder?'
    },
    {
      key: 'costStructure' as const,
      title: 'Cost Structure',
      icon: '💰',
      color: 'orange',
      description: 'Hvad er de vigtigste omkostninger?'
    },
    {
      key: 'revenueStreams' as const,
      title: 'Revenue Streams',
      icon: '💵',
      color: 'green',
      description: 'Hvordan tjener du penge?'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string; hover: string }> = {
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        hover: 'hover:bg-blue-100'
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-700',
        hover: 'hover:bg-green-100'
      },
      pink: {
        border: 'border-pink-200',
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        hover: 'hover:bg-pink-100'
      },
      orange: {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        hover: 'hover:bg-orange-100'
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
              Business Model Canvas
            </h1>
            <p className="text-gray-600">
              Visualiser og design din forretningsmodel
            </p>
          </div>
        </header>

        {/* Canvas Grid - 3x3 layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1 */}
          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('blue').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[0].icon}</span>
              {sections[0].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[0].description}</p>
            <div className="space-y-2">
              {canvas.keyPartners.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('keyPartners', index, e.target.value)}
                    placeholder="Tilføj partner..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600 resize-none"
                  />
                  {canvas.keyPartners.length > 1 && (
                    <button
                      onClick={() => removeItem('keyPartners', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('keyPartners')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('blue').bg} ${getColorClasses('blue').text} rounded-lg ${getColorClasses('blue').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('blue').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[1].icon}</span>
              {sections[1].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[1].description}</p>
            <div className="space-y-2">
              {canvas.keyActivities.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('keyActivities', index, e.target.value)}
                    placeholder="Tilføj aktivitet..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600 resize-none"
                  />
                  {canvas.keyActivities.length > 1 && (
                    <button
                      onClick={() => removeItem('keyActivities', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('keyActivities')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('blue').bg} ${getColorClasses('blue').text} rounded-lg ${getColorClasses('blue').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('blue').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[2].icon}</span>
              {sections[2].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[2].description}</p>
            <div className="space-y-2">
              {canvas.keyResources.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('keyResources', index, e.target.value)}
                    placeholder="Tilføj ressource..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600 resize-none"
                  />
                  {canvas.keyResources.length > 1 && (
                    <button
                      onClick={() => removeItem('keyResources', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('keyResources')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('blue').bg} ${getColorClasses('blue').text} rounded-lg ${getColorClasses('blue').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          {/* Row 2 - Value Proposition centered */}
          <div className="md:col-span-3">
            <div className={`bg-white rounded-xl p-6 shadow-sm border-2 ${getColorClasses('green').border}`}>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>{sections[3].icon}</span>
                {sections[3].title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{sections[3].description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {canvas.valuePropositions.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('valuePropositions', index, e.target.value)}
                      placeholder="Tilføj værdiforslag..."
                      rows={3}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600 resize-none"
                    />
                    {canvas.valuePropositions.length > 1 && (
                      <button
                        onClick={() => removeItem('valuePropositions', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addItem('valuePropositions')}
                className={`mt-3 px-4 py-2 ${getColorClasses('green').bg} ${getColorClasses('green').text} rounded-lg ${getColorClasses('green').hover} transition-colors font-medium`}
              >
                + Tilføj værdiforslag
              </button>
            </div>
          </div>

          {/* Row 3 */}
          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('pink').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[4].icon}</span>
              {sections[4].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[4].description}</p>
            <div className="space-y-2">
              {canvas.customerRelationships.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('customerRelationships', index, e.target.value)}
                    placeholder="Tilføj relation..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-pink-600 resize-none"
                  />
                  {canvas.customerRelationships.length > 1 && (
                    <button
                      onClick={() => removeItem('customerRelationships', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('customerRelationships')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('pink').bg} ${getColorClasses('pink').text} rounded-lg ${getColorClasses('pink').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('pink').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[5].icon}</span>
              {sections[5].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[5].description}</p>
            <div className="space-y-2">
              {canvas.channels.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('channels', index, e.target.value)}
                    placeholder="Tilføj kanal..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-pink-600 resize-none"
                  />
                  {canvas.channels.length > 1 && (
                    <button
                      onClick={() => removeItem('channels', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('channels')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('pink').bg} ${getColorClasses('pink').text} rounded-lg ${getColorClasses('pink').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('pink').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[6].icon}</span>
              {sections[6].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[6].description}</p>
            <div className="space-y-2">
              {canvas.customerSegments.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('customerSegments', index, e.target.value)}
                    placeholder="Tilføj segment..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-pink-600 resize-none"
                  />
                  {canvas.customerSegments.length > 1 && (
                    <button
                      onClick={() => removeItem('customerSegments', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('customerSegments')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('pink').bg} ${getColorClasses('pink').text} rounded-lg ${getColorClasses('pink').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          {/* Row 4 */}
          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('orange').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[7].icon}</span>
              {sections[7].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[7].description}</p>
            <div className="space-y-2">
              {canvas.costStructure.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('costStructure', index, e.target.value)}
                    placeholder="Tilføj omkostning..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-orange-600 resize-none"
                  />
                  {canvas.costStructure.length > 1 && (
                    <button
                      onClick={() => removeItem('costStructure', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('costStructure')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('orange').bg} ${getColorClasses('orange').text} rounded-lg ${getColorClasses('orange').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${getColorClasses('green').border}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>{sections[8].icon}</span>
              {sections[8].title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{sections[8].description}</p>
            <div className="space-y-2">
              {canvas.revenueStreams.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={item}
                    onChange={(e) => updateField('revenueStreams', index, e.target.value)}
                    placeholder="Tilføj indtægtskilde..."
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600 resize-none"
                  />
                  {canvas.revenueStreams.length > 1 && (
                    <button
                      onClick={() => removeItem('revenueStreams', index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addItem('revenueStreams')}
                className={`w-full px-3 py-2 text-sm ${getColorClasses('green').bg} ${getColorClasses('green').text} rounded-lg ${getColorClasses('green').hover} transition-colors font-medium`}
              >
                + Tilføj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
