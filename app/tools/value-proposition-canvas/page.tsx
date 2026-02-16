'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

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
                Value Proposition Canvas
              </h1>
            </div>
            <p className="text-gray-600">
              Mappér kundens behov og værdi tilbud
            </p>
          </div>
        </header>

        {/* Classic Side-by-Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Customer Profile - Left Side */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300">
            <div className="bg-blue-600 text-white p-4 border-b-2 border-gray-400">
              <h2 className="text-xl font-bold uppercase tracking-wide">Customer Profile</h2>
            </div>
            
            {/* Jobs to be Done */}
            <div className="p-4 border-b-2 border-gray-300 bg-blue-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Jobs to be Done</h3>
              <div className="space-y-2">
                {customerProfile.jobs.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('jobs', index, e.target.value)}
                      placeholder="Hvad prøver kunden at opnå?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-blue-600"
                    />
                    {customerProfile.jobs.length > 1 && (
                      <button onClick={() => removeCustomerItem('jobs', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addCustomerItem('jobs')} className="text-xs text-blue-600 hover:text-blue-800">+ Tilføj</button>
              </div>
            </div>

            {/* Pains */}
            <div className="p-4 border-b-2 border-gray-300 bg-red-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Pains</h3>
              <div className="space-y-2">
                {customerProfile.pains.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('pains', index, e.target.value)}
                      placeholder="Hvad frustrerer kunden?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-red-600"
                    />
                    {customerProfile.pains.length > 1 && (
                      <button onClick={() => removeCustomerItem('pains', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addCustomerItem('pains')} className="text-xs text-red-600 hover:text-red-800">+ Tilføj</button>
              </div>
            </div>

            {/* Gains */}
            <div className="p-4 bg-green-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Gains</h3>
              <div className="space-y-2">
                {customerProfile.gains.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateCustomerField('gains', index, e.target.value)}
                      placeholder="Hvad ønsker kunden at opnå?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-green-600"
                    />
                    {customerProfile.gains.length > 1 && (
                      <button onClick={() => removeCustomerItem('gains', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addCustomerItem('gains')} className="text-xs text-green-600 hover:text-green-800">+ Tilføj</button>
              </div>
            </div>
          </div>

          {/* Value Map - Right Side */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300">
            <div className="bg-purple-600 text-white p-4 border-b-2 border-gray-400">
              <h2 className="text-xl font-bold uppercase tracking-wide">Value Map</h2>
            </div>

            {/* Products & Services */}
            <div className="p-4 border-b-2 border-gray-300 bg-purple-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Products & Services</h3>
              <div className="space-y-2">
                {valueMap.products.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('products', index, e.target.value)}
                      placeholder="Hvad tilbyder du?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-purple-600"
                    />
                    {valueMap.products.length > 1 && (
                      <button onClick={() => removeValueItem('products', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addValueItem('products')} className="text-xs text-purple-600 hover:text-purple-800">+ Tilføj</button>
              </div>
            </div>

            {/* Pain Relievers */}
            <div className="p-4 border-b-2 border-gray-300 bg-red-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Pain Relievers</h3>
              <div className="space-y-2">
                {valueMap.painRelievers.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('painRelievers', index, e.target.value)}
                      placeholder="Hvordan løser du kundens problemer?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-red-600"
                    />
                    {valueMap.painRelievers.length > 1 && (
                      <button onClick={() => removeValueItem('painRelievers', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addValueItem('painRelievers')} className="text-xs text-red-600 hover:text-red-800">+ Tilføj</button>
              </div>
            </div>

            {/* Gain Creators */}
            <div className="p-4 bg-green-50">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Gain Creators</h3>
              <div className="space-y-2">
                {valueMap.gainCreators.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateValueField('gainCreators', index, e.target.value)}
                      placeholder="Hvordan skaber du værdi for kunden?"
                      rows={2}
                      className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 bg-white resize-none focus:outline-none focus:border-green-600"
                    />
                    {valueMap.gainCreators.length > 1 && (
                      <button onClick={() => removeValueItem('gainCreators', index)} className="text-red-500 text-sm">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addValueItem('gainCreators')} className="text-xs text-green-600 hover:text-green-800">+ Tilføj</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
