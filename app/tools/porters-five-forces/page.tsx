'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

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

  const forceConfig: Array<{
    key: keyof typeof forces
    title: string
    shortTitle: string
    colorClass: string
    positionClass: string
  }> = [
    {
      key: 'newEntrants',
      title: 'Threat of New Entrants',
      shortTitle: 'New Entrants',
      colorClass: 'border-orange-300 bg-orange-50',
      positionClass: 'lg:top-2 lg:left-1/2 lg:-translate-x-1/2',
    },
    {
      key: 'substitutes',
      title: 'Threat of Substitutes',
      shortTitle: 'Substitutes',
      colorClass: 'border-purple-300 bg-purple-50',
      positionClass: 'lg:top-24 lg:right-6',
    },
    {
      key: 'buyers',
      title: 'Bargaining Power of Buyers',
      shortTitle: 'Buyers',
      colorClass: 'border-green-300 bg-green-50',
      positionClass: 'lg:bottom-8 lg:right-20',
    },
    {
      key: 'suppliers',
      title: 'Bargaining Power of Suppliers',
      shortTitle: 'Suppliers',
      colorClass: 'border-blue-300 bg-blue-50',
      positionClass: 'lg:bottom-8 lg:left-20',
    },
    {
      key: 'rivalry',
      title: 'Rivalry Among Existing Competitors',
      shortTitle: 'Rivalry',
      colorClass: 'border-cyan-300 bg-cyan-50',
      positionClass: 'lg:top-24 lg:left-6',
    },
  ]

  return (
    <ToolLayout
      title="Porter's 5 Forces"
      description="Analysér branchens konkurrencemæssige kræfter i et samlet 5-forces diagram."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="swiss-panel p-4 md:p-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 uppercase tracking-wide">Five Forces Map</h2>
          <p className="text-sm text-neutral-600">Redigér felterne direkte i modellen. Layoutet følger den klassiske center + 5 kræfter omkring.</p>
        </div>

        <div className="lg:hidden grid grid-cols-1 gap-3">
          {forceConfig.map((force) => (
            <section key={force.key} className={`border ${force.colorClass} p-3`}>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">{force.title}</h3>
              <div className="space-y-2">
                {forces[force.key].map((item, index) => (
                  <div key={`${force.key}-${index}`} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateForce(force.key, index, e.target.value)}
                      onKeyDown={(e) =>
                        deleteEmptyFieldRow(e, item, forces[force.key].length > 1, () =>
                          removeItem(force.key, index)
                        )
                      }
                      placeholder="Skriv observation..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 bg-white resize-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(force.key)}
                  className="text-xs uppercase tracking-wider text-neutral-700 border border-neutral-300 px-2 py-1"
                >
                  + Tilføj
                </button>
              </div>
            </section>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="relative mx-auto w-full max-w-[920px] h-[760px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 920 760" aria-hidden>
              <polygon
                points="460,130 710,300 615,560 305,560 210,300"
                fill="none"
                stroke="#c5c5c5"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <line x1="460" y1="370" x2="460" y2="130" stroke="#d0d0d0" strokeWidth="1.5" />
              <line x1="460" y1="370" x2="710" y2="300" stroke="#d0d0d0" strokeWidth="1.5" />
              <line x1="460" y1="370" x2="615" y2="560" stroke="#d0d0d0" strokeWidth="1.5" />
              <line x1="460" y1="370" x2="305" y2="560" stroke="#d0d0d0" strokeWidth="1.5" />
              <line x1="460" y1="370" x2="210" y2="300" stroke="#d0d0d0" strokeWidth="1.5" />
            </svg>

            <div className="absolute left-1/2 top-[290px] -translate-x-1/2 w-[260px] min-h-[170px] border-[3px] border-red-400 bg-red-50 p-4 z-10">
              <h3 className="text-base font-bold text-red-900 text-center mb-2">Industry Rivalry</h3>
              <div className="space-y-2">
                {forces.rivalry.map((item, index) => (
                  <div key={`rivalry-${index}`} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(e) => updateForce('rivalry', index, e.target.value)}
                      onKeyDown={(e) =>
                        deleteEmptyFieldRow(e, item, forces.rivalry.length > 1, () =>
                          removeItem('rivalry', index)
                        )
                      }
                      placeholder="Skriv observation..."
                      rows={2}
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 bg-white resize-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem('rivalry')}
                  className="text-xs uppercase tracking-wider text-red-800 border border-red-300 px-2 py-1"
                >
                  + Tilføj
                </button>
              </div>
            </div>

            {forceConfig
              .filter((force) => force.key !== 'rivalry')
              .map((force) => (
                <section
                  key={force.key}
                  className={`absolute w-[230px] min-h-[150px] border-2 p-3 ${force.colorClass} ${force.positionClass}`}
                >
                  <h4 className="text-sm font-semibold text-neutral-900 mb-2">{force.title}</h4>
                  <div className="space-y-2">
                    {forces[force.key].map((item, index) => (
                      <div key={`${force.key}-${index}`} className="flex gap-2">
                        <textarea
                          value={item}
                          onChange={(e) => updateForce(force.key, index, e.target.value)}
                          onKeyDown={(e) =>
                            deleteEmptyFieldRow(e, item, forces[force.key].length > 1, () =>
                              removeItem(force.key, index)
                            )
                          }
                          placeholder="Skriv observation..."
                          rows={2}
                          className="flex-1 px-2 py-1 text-xs border border-neutral-300 bg-white resize-none"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem(force.key)}
                      className="text-xs uppercase tracking-wider text-neutral-700 border border-neutral-300 px-2 py-1"
                    >
                      + Tilføj
                    </button>
                  </div>
                </section>
              ))}

            <div className="absolute right-6 top-6 text-[11px] uppercase tracking-widest text-neutral-500">
              Five forces model
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
