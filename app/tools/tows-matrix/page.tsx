'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'

export default function TOWSMatrix() {
  const [matrix, setMatrix] = useState({
    so: [''],
    st: [''],
    wo: [''],
    wt: ['']
  })

  const [strengths, setStrengths] = useState([''])
  const [weaknesses, setWeaknesses] = useState([''])
  const [opportunities, setOpportunities] = useState([''])
  const [threats, setThreats] = useState([''])

  // Combine matrix and SWOT lists into one state object for saving
  const towsData = { matrix, strengths, weaknesses, opportunities, threats }
  const setTOWSData = (data: typeof towsData) => {
    setMatrix(data.matrix)
    setStrengths(data.strengths)
    setWeaknesses(data.weaknesses)
    setOpportunities(data.opportunities)
    setThreats(data.threats)
  }

  // Automatically save/load data when in a project
  useProjectToolData('tows-matrix', towsData, setTOWSData)

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
                TOWS Matrix
              </h1>
            </div>
            <p className="text-gray-600">
              Strategisk analyse: Kombiner SWOT faktorer for at identificere strategiske muligheder
            </p>
          </div>
        </header>

        {/* SWOT Lists - Horizontal */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg border-2 border-gray-300">
          <h2 className="text-lg font-bold mb-4 text-gray-900 uppercase">SWOT Faktorer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-2 border-green-300 rounded p-3 bg-green-50">
              <h3 className="text-sm font-bold text-green-900 mb-2">Strengths</h3>
              <div className="space-y-1">
                {strengths.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateList(strengths, setStrengths, index, e.target.value)}
                      placeholder="..."
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    />
                    {strengths.length > 1 && (
                      <button onClick={() => removeListItem(strengths, setStrengths, index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(strengths, setStrengths)} className="text-xs text-green-600">+</button>
              </div>
            </div>

            <div className="border-2 border-red-300 rounded p-3 bg-red-50">
              <h3 className="text-sm font-bold text-red-900 mb-2">Weaknesses</h3>
              <div className="space-y-1">
                {weaknesses.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateList(weaknesses, setWeaknesses, index, e.target.value)}
                      placeholder="..."
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    />
                    {weaknesses.length > 1 && (
                      <button onClick={() => removeListItem(weaknesses, setWeaknesses, index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(weaknesses, setWeaknesses)} className="text-xs text-red-600">+</button>
              </div>
            </div>

            <div className="border-2 border-blue-300 rounded p-3 bg-blue-50">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Opportunities</h3>
              <div className="space-y-1">
                {opportunities.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateList(opportunities, setOpportunities, index, e.target.value)}
                      placeholder="..."
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    />
                    {opportunities.length > 1 && (
                      <button onClick={() => removeListItem(opportunities, setOpportunities, index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(opportunities, setOpportunities)} className="text-xs text-blue-600">+</button>
              </div>
            </div>

            <div className="border-2 border-orange-300 rounded p-3 bg-orange-50">
              <h3 className="text-sm font-bold text-orange-900 mb-2">Threats</h3>
              <div className="space-y-1">
                {threats.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateList(threats, setThreats, index, e.target.value)}
                      placeholder="..."
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                    />
                    {threats.length > 1 && (
                      <button onClick={() => removeListItem(threats, setThreats, index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(threats, setThreats)} className="text-xs text-orange-600">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* TOWS Matrix - Classic 2x2 */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
          <h2 className="text-lg font-bold mb-4 text-gray-900 uppercase">TOWS Strategier</h2>
          <div className="grid grid-cols-2 gap-0 border-2 border-gray-400">
            {/* SO */}
            <div className="border-r-2 border-b-2 border-gray-400 p-4 bg-green-50">
              <h3 className="text-sm font-bold text-green-900 mb-2 uppercase border-b border-green-300 pb-1">SO Strategies</h3>
              <p className="text-xs text-gray-600 mb-2">Brug styrker til at udnytte muligheder</p>
              <div className="space-y-2">
                {matrix.so.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('so', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                    />
                    {matrix.so.length > 1 && (
                      <button onClick={() => removeMatrixItem('so', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addMatrixItem('so')} className="text-xs text-green-600">+ Tilføj</button>
              </div>
            </div>

            {/* ST */}
            <div className="border-b-2 border-gray-400 p-4 bg-yellow-50">
              <h3 className="text-sm font-bold text-yellow-900 mb-2 uppercase border-b border-yellow-300 pb-1">ST Strategies</h3>
              <p className="text-xs text-gray-600 mb-2">Brug styrker til at modstå trusler</p>
              <div className="space-y-2">
                {matrix.st.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('st', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                    />
                    {matrix.st.length > 1 && (
                      <button onClick={() => removeMatrixItem('st', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addMatrixItem('st')} className="text-xs text-yellow-600">+ Tilføj</button>
              </div>
            </div>

            {/* WO */}
            <div className="border-r-2 border-gray-400 p-4 bg-blue-50">
              <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase border-b border-blue-300 pb-1">WO Strategies</h3>
              <p className="text-xs text-gray-600 mb-2">Overvind svagheder for at udnytte muligheder</p>
              <div className="space-y-2">
                {matrix.wo.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('wo', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                    />
                    {matrix.wo.length > 1 && (
                      <button onClick={() => removeMatrixItem('wo', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addMatrixItem('wo')} className="text-xs text-blue-600">+ Tilføj</button>
              </div>
            </div>

            {/* WT */}
            <div className="border-gray-400 p-4 bg-red-50">
              <h3 className="text-sm font-bold text-red-900 mb-2 uppercase border-b border-red-300 pb-1">WT Strategies</h3>
              <p className="text-xs text-gray-600 mb-2">Minimer svagheder og undgå trusler</p>
              <div className="space-y-2">
                {matrix.wt.map((item, index) => (
                  <div key={index} className="flex gap-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateMatrix('wt', index, e.target.value)}
                      placeholder="..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                    />
                    {matrix.wt.length > 1 && (
                      <button onClick={() => removeMatrixItem('wt', index)} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addMatrixItem('wt')} className="text-xs text-red-600">+ Tilføj</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
