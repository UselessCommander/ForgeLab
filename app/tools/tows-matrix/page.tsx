'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TOWSMatrix() {
  const [matrix, setMatrix] = useState({
    so: [''], // Strengths-Opportunities
    st: [''], // Strengths-Threats
    wo: [''], // Weaknesses-Opportunities
    wt: ['']  // Weaknesses-Threats
  })

  const [strengths, setStrengths] = useState([''])
  const [weaknesses, setWeaknesses] = useState([''])
  const [opportunities, setOpportunities] = useState([''])
  const [threats, setThreats] = useState([''])

  const updateMatrix = (category: keyof typeof matrix, index: number, value: string) => {
    const newMatrix = { ...matrix }
    newMatrix[category] = [...newMatrix[category]]
    newMatrix[category][index] = value
    setMatrix(newMatrix)
  }

  const addMatrixItem = (category: keyof typeof matrix) => {
    const newMatrix = { ...matrix }
    newMatrix[category] = [...newMatrix[category], '']
    setMatrix(newMatrix)
  }

  const removeMatrixItem = (category: keyof typeof matrix, index: number) => {
    const newMatrix = { ...matrix }
    newMatrix[category] = newMatrix[category].filter((_, i) => i !== index)
    if (newMatrix[category].length === 0) {
      newMatrix[category] = ['']
    }
    setMatrix(newMatrix)
  }

  const updateList = (list: string[], setList: (items: string[]) => void, index: number, value: string) => {
    const newList = [...list]
    newList[index] = value
    setList(newList)
  }

  const addListItem = (list: string[], setList: (items: string[]) => void) => {
    setList([...list, ''])
  }

  const removeListItem = (list: string[], setList: (items: string[]) => void, index: number) => {
    const newList = list.filter((_, i) => i !== index)
    if (newList.length === 0) {
      setList([''])
    } else {
      setList(newList)
    }
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
              TOWS Matrix
            </h1>
            <p className="text-gray-600">
              Strategisk analyse: Kombiner SWOT faktorer for at identificere strategiske muligheder
            </p>
          </div>
        </header>

        {/* SWOT Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
            <h2 className="text-lg font-semibold text-green-700 mb-4">💪 Strengths</h2>
            <div className="space-y-2">
              {strengths.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateList(strengths, setStrengths, index, e.target.value)}
                    placeholder="Tilføj styrke..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600"
                  />
                  {strengths.length > 1 && (
                    <button
                      onClick={() => removeListItem(strengths, setStrengths, index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem(strengths, setStrengths)}
                className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
              >
                + Tilføj
              </button>
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
            <h2 className="text-lg font-semibold text-red-700 mb-4">⚠️ Weaknesses</h2>
            <div className="space-y-2">
              {weaknesses.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateList(weaknesses, setWeaknesses, index, e.target.value)}
                    placeholder="Tilføj svaghed..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-red-600"
                  />
                  {weaknesses.length > 1 && (
                    <button
                      onClick={() => removeListItem(weaknesses, setWeaknesses, index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem(weaknesses, setWeaknesses)}
                className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                + Tilføj
              </button>
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">🚀 Opportunities</h2>
            <div className="space-y-2">
              {opportunities.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateList(opportunities, setOpportunities, index, e.target.value)}
                    placeholder="Tilføj mulighed..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                  {opportunities.length > 1 && (
                    <button
                      onClick={() => removeListItem(opportunities, setOpportunities, index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem(opportunities, setOpportunities)}
                className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
              >
                + Tilføj
              </button>
            </div>
          </div>

          {/* Threats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
            <h2 className="text-lg font-semibold text-orange-700 mb-4">⚡ Threats</h2>
            <div className="space-y-2">
              {threats.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateList(threats, setThreats, index, e.target.value)}
                    placeholder="Tilføj trussel..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-orange-600"
                  />
                  {threats.length > 1 && (
                    <button
                      onClick={() => removeListItem(threats, setThreats, index)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem(threats, setThreats)}
                className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium"
              >
                + Tilføj
              </button>
            </div>
          </div>
        </div>

        {/* TOWS Matrix */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">TOWS Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SO - Strengths-Opportunities */}
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-700 mb-3">SO Strategies</h3>
              <p className="text-sm text-gray-600 mb-3">Brug styrker til at udnytte muligheder</p>
              <div className="space-y-2">
                {matrix.so.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('so', index, e.target.value)}
                      placeholder="Strategi..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white resize-none"
                    />
                    {matrix.so.length > 1 && (
                      <button
                        onClick={() => removeMatrixItem('so', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addMatrixItem('so')}
                  className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                >
                  + Tilføj strategi
                </button>
              </div>
            </div>

            {/* ST - Strengths-Threats */}
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-700 mb-3">ST Strategies</h3>
              <p className="text-sm text-gray-600 mb-3">Brug styrker til at modstå trusler</p>
              <div className="space-y-2">
                {matrix.st.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('st', index, e.target.value)}
                      placeholder="Strategi..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white resize-none"
                    />
                    {matrix.st.length > 1 && (
                      <button
                        onClick={() => removeMatrixItem('st', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addMatrixItem('st')}
                  className="w-full px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium"
                >
                  + Tilføj strategi
                </button>
              </div>
            </div>

            {/* WO - Weaknesses-Opportunities */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">WO Strategies</h3>
              <p className="text-sm text-gray-600 mb-3">Overvind svagheder for at udnytte muligheder</p>
              <div className="space-y-2">
                {matrix.wo.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('wo', index, e.target.value)}
                      placeholder="Strategi..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white resize-none"
                    />
                    {matrix.wo.length > 1 && (
                      <button
                        onClick={() => removeMatrixItem('wo', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addMatrixItem('wo')}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                >
                  + Tilføj strategi
                </button>
              </div>
            </div>

            {/* WT - Weaknesses-Threats */}
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-3">WT Strategies</h3>
              <p className="text-sm text-gray-600 mb-3">Minimer svagheder og undgå trusler</p>
              <div className="space-y-2">
                {matrix.wt.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('wt', index, e.target.value)}
                      placeholder="Strategi..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white resize-none"
                    />
                    {matrix.wt.length > 1 && (
                      <button
                        onClick={() => removeMatrixItem('wt', index)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addMatrixItem('wt')}
                  className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  + Tilføj strategi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
