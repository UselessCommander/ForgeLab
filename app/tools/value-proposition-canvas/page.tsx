'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ValuePropositionCanvas() {
  const [customerProfile, setCustomerProfile] = useState({
    jobs: [''],
    pains: [''],
    gains: ['']
  })

  const [valueMap, setValueMap] = useState({
    products: [''],
    painRelievers: [''],
    gainCreators: ['']
  })

  const updateCustomerField = (category: keyof typeof customerProfile, index: number, value: string) => {
    const newProfile = { ...customerProfile }
    newProfile[category] = [...newProfile[category]]
    newProfile[category][index] = value
    setCustomerProfile(newProfile)
  }

  const updateValueField = (category: keyof typeof valueMap, index: number, value: string) => {
    const newValueMap = { ...valueMap }
    newValueMap[category] = [...newValueMap[category]]
    newValueMap[category][index] = value
    setValueMap(newValueMap)
  }

  const addCustomerItem = (category: keyof typeof customerProfile) => {
    const newProfile = { ...customerProfile }
    newProfile[category] = [...newProfile[category], '']
    setCustomerProfile(newProfile)
  }

  const addValueItem = (category: keyof typeof valueMap) => {
    const newValueMap = { ...valueMap }
    newValueMap[category] = [...newValueMap[category], '']
    setValueMap(newValueMap)
  }

  const removeCustomerItem = (category: keyof typeof customerProfile, index: number) => {
    const newProfile = { ...customerProfile }
    newProfile[category] = newProfile[category].filter((_, i) => i !== index)
    if (newProfile[category].length === 0) {
      newProfile[category] = ['']
    }
    setCustomerProfile(newProfile)
  }

  const removeValueItem = (category: keyof typeof valueMap, index: number) => {
    const newValueMap = { ...valueMap }
    newValueMap[category] = newValueMap[category].filter((_, i) => i !== index)
    if (newValueMap[category].length === 0) {
      newValueMap[category] = ['']
    }
    setValueMap(newValueMap)
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
              Value Proposition Canvas
            </h1>
            <p className="text-gray-600">
              Mappér kundens behov og værdi tilbud
            </p>
          </div>
        </header>

        {/* Canvas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Profile */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6 pb-4 border-b border-blue-200">
              Customer Profile
            </h2>

            {/* Jobs to be Done */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Jobs to be Done
              </h3>
              <div className="space-y-2">
                {customerProfile.jobs.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('jobs', index, e.target.value)}
                      placeholder="Hvad prøver kunden at opnå?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                    />
                    {customerProfile.jobs.length > 1 && (
                      <button
                        onClick={() => removeCustomerItem('jobs', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addCustomerItem('jobs')}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  + Tilføj job
                </button>
              </div>
            </div>

            {/* Pains */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">😣</span>
                Pains
              </h3>
              <div className="space-y-2">
                {customerProfile.pains.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('pains', index, e.target.value)}
                      placeholder="Hvad frustrerer kunden?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 resize-none"
                    />
                    {customerProfile.pains.length > 1 && (
                      <button
                        onClick={() => removeCustomerItem('pains', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addCustomerItem('pains')}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  + Tilføj pain
                </button>
              </div>
            </div>

            {/* Gains */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">✨</span>
                Gains
              </h3>
              <div className="space-y-2">
                {customerProfile.gains.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('gains', index, e.target.value)}
                      placeholder="Hvad ønsker kunden at opnå?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 resize-none"
                    />
                    {customerProfile.gains.length > 1 && (
                      <button
                        onClick={() => removeCustomerItem('gains', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addCustomerItem('gains')}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                >
                  + Tilføj gain
                </button>
              </div>
            </div>
          </div>

          {/* Value Map */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200">
            <h2 className="text-2xl font-semibold text-purple-700 mb-6 pb-4 border-b border-purple-200">
              Value Map
            </h2>

            {/* Products & Services */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🎁</span>
                Products & Services
              </h3>
              <div className="space-y-2">
                {valueMap.products.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('products', index, e.target.value)}
                      placeholder="Hvad tilbyder du?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none"
                    />
                    {valueMap.products.length > 1 && (
                      <button
                        onClick={() => removeValueItem('products', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addValueItem('products')}
                  className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                >
                  + Tilføj produkt/service
                </button>
              </div>
            </div>

            {/* Pain Relievers */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">💊</span>
                Pain Relievers
              </h3>
              <div className="space-y-2">
                {valueMap.painRelievers.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('painRelievers', index, e.target.value)}
                      placeholder="Hvordan løser du kundens problemer?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 resize-none"
                    />
                    {valueMap.painRelievers.length > 1 && (
                      <button
                        onClick={() => removeValueItem('painRelievers', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addValueItem('painRelievers')}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  + Tilføj pain reliever
                </button>
              </div>
            </div>

            {/* Gain Creators */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🌟</span>
                Gain Creators
              </h3>
              <div className="space-y-2">
                {valueMap.gainCreators.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('gainCreators', index, e.target.value)}
                      placeholder="Hvordan skaber du værdi for kunden?"
                      rows={2}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 resize-none"
                    />
                    {valueMap.gainCreators.length > 1 && (
                      <button
                        onClick={() => removeValueItem('gainCreators', index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors self-start"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addValueItem('gainCreators')}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                >
                  + Tilføj gain creator
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
