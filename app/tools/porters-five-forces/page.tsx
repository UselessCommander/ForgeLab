'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'

export default function PortersFiveForces() {
  const [forces, setForces] = useState({
    rivalry: [''],
    suppliers: [''],
    buyers: [''],
    substitutes: [''],
    newEntrants: ['']
  })

  // Automatically save/load data when in a project
  useProjectToolData('porters-five-forces', forces, setForces)

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
                Porter's 5 Forces
              </h1>
            </div>
            <p className="text-gray-600">
              Analysér branchens konkurrencemæssige kræfter
            </p>
          </div>
        </header>

        {/* Classic Porter's 5 Forces Diagram Layout */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-300">
          <div className="relative max-w-4xl mx-auto">
            {/* Center - Industry Competition */}
            <div className="text-center mb-8">
              <div className="inline-block border-4 border-red-400 rounded-full p-8 bg-red-50">
                <h2 className="text-xl font-bold text-red-900 mb-2">Industry Competition</h2>
                <div className="space-y-2">
                  {forces.rivalry.map((item, index) => (
                    <div key={index} className="flex gap-2 justify-center">
                      <textarea
                        value={item}
                        onChange={(e) => updateForce('rivalry', index, e.target.value)}
                        placeholder="..."
                        rows={2}
                        className="w-64 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none"
                      />
                      {forces.rivalry.length > 1 && (
                        <button onClick={() => removeItem('rivalry', index)} className="text-red-500 text-sm">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem('rivalry')} className="text-xs text-red-600">+ Tilføj</button>
                </div>
              </div>
            </div>

            {/* Top - Threat of New Entrants */}
            <div className="mb-6 text-center">
              <div className="inline-block border-2 border-green-400 rounded-lg p-4 bg-green-50">
                <h3 className="text-sm font-bold text-green-900 mb-2">Threat of New Entrants</h3>
                <div className="space-y-1">
                  {forces.newEntrants.map((item, index) => (
                    <div key={index} className="flex gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateForce('newEntrants', index, e.target.value)}
                        placeholder="..."
                        className="w-48 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                      />
                      {forces.newEntrants.length > 1 && (
                        <button onClick={() => removeItem('newEntrants', index)} className="text-red-500 text-xs">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem('newEntrants')} className="text-xs text-green-600">+</button>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Left - Bargaining Power of Suppliers */}
              <div className="border-2 border-orange-400 rounded-lg p-4 bg-orange-50">
                <h3 className="text-sm font-bold text-orange-900 mb-2">Bargaining Power of Suppliers</h3>
                <div className="space-y-1">
                  {forces.suppliers.map((item, index) => (
                    <div key={index} className="flex gap-1">
                      <textarea
                        value={item}
                        onChange={(e) => updateForce('suppliers', index, e.target.value)}
                        placeholder="..."
                        rows={2}
                        className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                      />
                      {forces.suppliers.length > 1 && (
                        <button onClick={() => removeItem('suppliers', index)} className="text-red-500 text-xs">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem('suppliers')} className="text-xs text-orange-600">+</button>
                </div>
              </div>

              {/* Center - Empty space */}
              <div></div>

              {/* Right - Bargaining Power of Buyers */}
              <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-bold text-blue-900 mb-2">Bargaining Power of Buyers</h3>
                <div className="space-y-1">
                  {forces.buyers.map((item, index) => (
                    <div key={index} className="flex gap-1">
                      <textarea
                        value={item}
                        onChange={(e) => updateForce('buyers', index, e.target.value)}
                        placeholder="..."
                        rows={2}
                        className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white resize-none"
                      />
                      {forces.buyers.length > 1 && (
                        <button onClick={() => removeItem('buyers', index)} className="text-red-500 text-xs">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem('buyers')} className="text-xs text-blue-600">+</button>
                </div>
              </div>
            </div>

            {/* Bottom - Threat of Substitutes */}
            <div className="mt-6 text-center">
              <div className="inline-block border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
                <h3 className="text-sm font-bold text-yellow-900 mb-2">Threat of Substitute Products</h3>
                <div className="space-y-1">
                  {forces.substitutes.map((item, index) => (
                    <div key={index} className="flex gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateForce('substitutes', index, e.target.value)}
                        placeholder="..."
                        className="w-48 px-2 py-1 text-xs rounded border border-gray-300 bg-white"
                      />
                      {forces.substitutes.length > 1 && (
                        <button onClick={() => removeItem('substitutes', index)} className="text-red-500 text-xs">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addItem('substitutes')} className="text-xs text-yellow-600">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
