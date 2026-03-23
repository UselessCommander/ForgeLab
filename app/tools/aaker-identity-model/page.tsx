'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Save, Type } from 'lucide-react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'

type AakerPillarKey = 'product' | 'organization' | 'person' | 'symbol'

type AakerPillar = {
  title: string
  content: string
}

type AakerModelData = {
  essence: string
  core: string
  extended: string
  pillars: Record<AakerPillarKey, AakerPillar>
}

const DEFAULT_DATA: AakerModelData = {
  essence: 'Brand Essence\n(Hjertet af brandet)',
  core: 'Core Identity\n(Den tidløse kerne)',
  extended: 'Extended Identity\n(Tekstur og komplethed)',
  pillars: {
    product: {
      title: 'Brand as Product',
      content:
        '1. Product scope\n2. Product attributes\n3. Quality/value\n4. Uses\n5. Users\n6. Country of origin',
    },
    organization: {
      title: 'Brand as Organization',
      content:
        '7. Organization attributes (e.g. Innovation, consumer concern, trustworthiness)\n8. Local vs Global',
    },
    person: {
      title: 'Brand as Person',
      content:
        '9. Personality (e.g., genuine, energetic, rugged)\n10. Brand-customer relationships (e.g., friends, adviser)',
    },
    symbol: {
      title: 'Brand as Symbol',
      content: '11. Visual imagery and metaphors\n12. Brand heritage',
    },
  },
}

type EditableAreaProps = {
  value: string
  onSave: (value: string) => void
  isTitle?: boolean
  isCenter?: boolean
  className?: string
}

function EditableArea({ value, onSave, isTitle = false, isCenter = false, className = '' }: EditableAreaProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (!isEditing || !textareaRef.current) return
    textareaRef.current.focus()
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [isEditing])

  const commit = () => {
    setIsEditing(false)
    onSave(tempValue)
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={tempValue}
        onChange={(e) => {
          setTempValue(e.target.value)
          if (!textareaRef.current) return
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && isTitle) {
            e.preventDefault()
            commit()
          }
        }}
        className={`w-full border-b-2 border-amber-500 bg-white/95 px-2 py-1 resize-none overflow-hidden focus:outline-none text-gray-900 ${
          isTitle ? 'text-center font-semibold' : 'text-sm'
        } ${className}`}
        rows={isTitle ? 1 : 3}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`group relative w-full cursor-pointer whitespace-pre-wrap rounded p-2 transition-colors hover:bg-black/5 ${
        isTitle ? 'text-center font-semibold text-gray-900' : 'text-left text-sm text-gray-600'
      } ${isCenter ? 'h-full flex items-center justify-center text-center' : ''} ${className}`}
    >
      {value}
      <Type className="absolute right-1 top-1 h-4 w-4 opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
    </div>
  )
}

export default function AakerIdentityModelPage() {
  const [data, setData] = useState<AakerModelData>(DEFAULT_DATA)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  useProjectToolData<AakerModelData>('aaker-identity-model', data, setData)

  const updateCenter = (field: 'essence' | 'core' | 'extended', value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updatePillar = (pillar: AakerPillarKey, field: keyof AakerPillar, value: string) => {
    setData((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        [pillar]: {
          ...prev.pillars[pillar],
          [field]: value,
        },
      },
    }))
  }

  return (
    <ToolLayout
      title="David Aaker Identitetsmodel"
      description="Definér brandets essens, kerne og udvidede identitet i én samlet model."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-8 lg:p-12 font-sans flex flex-col items-center selection:bg-black selection:text-white">
        <div className="max-w-7xl w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-gray-200 pb-8 relative z-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">ForgeLab Strategy</p>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight leading-none mb-2">
              David Aaker&apos;s
              <br />
              <span className="font-medium">Brand Identity Model</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 mt-8 md:mt-0">
            <div className="flex items-center text-xs text-gray-400 uppercase tracking-widest font-bold">
              <Save className="w-4 h-4 mr-2" /> Auto-Saved
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 hover:border-amber-500 text-gray-900 rounded-full transition-all text-xs font-bold uppercase tracking-widest"
              >
                <RotateCcw className="w-4 h-4" /> Reset Model
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Er du sikker?</span>
                <button
                  onClick={() => {
                    setData(DEFAULT_DATA)
                    setShowResetConfirm(false)
                  }}
                  className="text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-colors"
                >
                  Ja
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
                >
                  Annuller
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl w-full relative">
          <div className="relative flex justify-center items-center mb-16 w-full h-[380px] md:h-[480px]">
            <div className="absolute top-[50%] left-[50%] w-px h-[100%] bg-gradient-to-b from-amber-100 via-amber-300 to-transparent -translate-x-1/2 -z-10" />

            <div className="w-[340px] h-[340px] md:w-[460px] md:h-[460px] rounded-full border border-amber-200 bg-amber-50/40 shadow-sm flex items-start justify-center p-6 relative group transition-all duration-500 hover:border-amber-300">
              <div className="absolute top-8 w-full text-center text-xs font-bold text-amber-700 uppercase tracking-[0.2em] pointer-events-none">
                Extended Identity
              </div>
              <div className="absolute bottom-12 w-2/3 flex justify-center">
                <EditableArea value={data.extended} onSave={(val) => updateCenter('extended', val)} isCenter className="text-amber-900" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full border border-amber-100 bg-amber-50 shadow-inner flex items-start justify-center p-6 group transition-all duration-500 hover:bg-amber-100/60">
                <div className="absolute top-6 w-full text-center text-xs font-bold text-amber-800 uppercase tracking-[0.2em] pointer-events-none">
                  Core Identity
                </div>
                <div className="absolute bottom-8 w-3/4 flex justify-center">
                  <EditableArea value={data.core} onSave={(val) => updateCenter('core', val)} isCenter className="text-amber-900" />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-full bg-amber-600 shadow-2xl flex items-center justify-center p-4 group transition-transform duration-500 hover:scale-105">
                  <EditableArea
                    value={data.essence}
                    onSave={(val) => updateCenter('essence', val)}
                    isCenter
                    className="text-white font-light text-sm md:text-base leading-tight drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full relative z-10">
            {(['product', 'organization', 'person', 'symbol'] as AakerPillarKey[]).map((pillarKey) => (
              <div
                key={pillarKey}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
              >
                <div className="bg-amber-100 border-b border-amber-200 p-4 transition-colors group-hover:bg-amber-200/70">
                  <EditableArea
                    value={data.pillars[pillarKey].title}
                    onSave={(val) => updatePillar(pillarKey, 'title', val)}
                    isTitle
                    className="text-amber-900 uppercase tracking-wider text-xs"
                  />
                </div>
                <div className="p-6 flex-1 bg-white">
                  <EditableArea
                    value={data.pillars[pillarKey].content}
                    onSave={(val) => updatePillar(pillarKey, 'content', val)}
                    className="text-sm text-gray-600 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
