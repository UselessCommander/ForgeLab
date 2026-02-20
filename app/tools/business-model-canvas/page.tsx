'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'

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

  // Automatically save/load data when in a project
  useProjectToolData('business-model-canvas', canvas, setCanvas)

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
            <div className="flex items-center gap-4 mb-2">
              <ForgeLabLogo size={48} />
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Business Model Canvas
              </h1>
            </div>
            <p className="text-gray-600">
              Visualiser og design din forretningsmodel
            </p>
          </div>
        </header>

        {/* Classic BMC Layout - 3x3 Grid */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
          <div className="grid grid-cols-3 gap-0 border-2 border-gray-400">
            {/* Row 1 */}
            <div className="border-r-2 border-b-2 border-gray-400 p-3 bg-blue-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Partners</h3>
              <div className="space-y-1">
                {canvas.keyPartners.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('keyPartners', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-blue-600"
                    />
                    {canvas.keyPartners.length > 1 && (
                      <button onClick={() => removeItem('keyPartners', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('keyPartners')} className="text-xs text-blue-600 hover:text-blue-800">+</button>
              </div>
            </div>

            <div className="border-r-2 border-b-2 border-gray-400 p-3 bg-blue-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Activities</h3>
              <div className="space-y-1">
                {canvas.keyActivities.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('keyActivities', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-blue-600"
                    />
                    {canvas.keyActivities.length > 1 && (
                      <button onClick={() => removeItem('keyActivities', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('keyActivities')} className="text-xs text-blue-600 hover:text-blue-800">+</button>
              </div>
            </div>

            <div className="border-b-2 border-gray-400 p-3 bg-blue-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Resources</h3>
              <div className="space-y-1">
                {canvas.keyResources.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('keyResources', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-blue-600"
                    />
                    {canvas.keyResources.length > 1 && (
                      <button onClick={() => removeItem('keyResources', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('keyResources')} className="text-xs text-blue-600 hover:text-blue-800">+</button>
              </div>
            </div>

            {/* Row 2 - Value Proposition centered */}
            <div className="col-span-3 border-b-2 border-gray-400 p-4 bg-green-50">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Value Propositions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {canvas.valuePropositions.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('valuePropositions', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-green-600"
                    />
                    {canvas.valuePropositions.length > 1 && (
                      <button onClick={() => removeItem('valuePropositions', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => addItem('valuePropositions')} className="mt-2 text-xs text-green-600 hover:text-green-800">+ Tilføj</button>
            </div>

            {/* Row 3 */}
            <div className="border-r-2 border-gray-400 p-3 bg-pink-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Customer Relationships</h3>
              <div className="space-y-1">
                {canvas.customerRelationships.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('customerRelationships', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-pink-600"
                    />
                    {canvas.customerRelationships.length > 1 && (
                      <button onClick={() => removeItem('customerRelationships', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('customerRelationships')} className="text-xs text-pink-600 hover:text-pink-800">+</button>
              </div>
            </div>

            <div className="border-r-2 border-gray-400 p-3 bg-pink-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Channels</h3>
              <div className="space-y-1">
                {canvas.channels.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('channels', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-pink-600"
                    />
                    {canvas.channels.length > 1 && (
                      <button onClick={() => removeItem('channels', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('channels')} className="text-xs text-pink-600 hover:text-pink-800">+</button>
              </div>
            </div>

            <div className="border-gray-400 p-3 bg-pink-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Customer Segments</h3>
              <div className="space-y-1">
                {canvas.customerSegments.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('customerSegments', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-pink-600"
                    />
                    {canvas.customerSegments.length > 1 && (
                      <button onClick={() => removeItem('customerSegments', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('customerSegments')} className="text-xs text-pink-600 hover:text-pink-800">+</button>
              </div>
            </div>

            {/* Row 4 */}
            <div className="col-span-2 border-r-2 border-gray-400 p-3 bg-orange-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Cost Structure</h3>
              <div className="grid grid-cols-2 gap-1">
                {canvas.costStructure.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('costStructure', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-orange-600"
                    />
                    {canvas.costStructure.length > 1 && (
                      <button onClick={() => removeItem('costStructure', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => addItem('costStructure')} className="mt-1 text-xs text-orange-600 hover:text-orange-800">+</button>
            </div>

            <div className="border-gray-400 p-3 bg-green-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Revenue Streams</h3>
              <div className="space-y-1">
                {canvas.revenueStreams.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateField('revenueStreams', index, e.target.value)}
                      placeholder="..."
                      rows={1}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-green-600"
                    />
                    {canvas.revenueStreams.length > 1 && (
                      <button onClick={() => removeItem('revenueStreams', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItem('revenueStreams')} className="text-xs text-green-600 hover:text-green-800">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
