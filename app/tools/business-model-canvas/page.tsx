'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'
import {
  Link2,
  CheckSquare,
  Building2,
  Gift,
  Heart,
  Truck,
  Users,
  Tag,
  CircleDollarSign,
} from 'lucide-react'

type BmcCanvas = {
  designedFor: string
  designedBy: string
  documentDate: string
  docVersion: string
  keyPartners: string[]
  keyActivities: string[]
  keyResources: string[]
  valuePropositions: string[]
  customerRelationships: string[]
  channels: string[]
  customerSegments: string[]
  costStructure: string[]
  revenueStreams: string[]
}

const defaultCanvas = (): BmcCanvas => ({
  designedFor: '',
  designedBy: '',
  documentDate: '',
  docVersion: '',
  keyPartners: [''],
  keyActivities: [''],
  keyResources: [''],
  valuePropositions: [''],
  customerRelationships: [''],
  channels: [''],
  customerSegments: [''],
  costStructure: [''],
  revenueStreams: [''],
})

function normalizeLoaded(data: Partial<BmcCanvas> | null | undefined): BmcCanvas {
  const d = defaultCanvas()
  if (!data || typeof data !== 'object') return d
  return {
    ...d,
    ...data,
    keyPartners: Array.isArray(data.keyPartners) && data.keyPartners.length ? data.keyPartners : d.keyPartners,
    keyActivities: Array.isArray(data.keyActivities) && data.keyActivities.length ? data.keyActivities : d.keyActivities,
    keyResources: Array.isArray(data.keyResources) && data.keyResources.length ? data.keyResources : d.keyResources,
    valuePropositions:
      Array.isArray(data.valuePropositions) && data.valuePropositions.length ? data.valuePropositions : d.valuePropositions,
    customerRelationships:
      Array.isArray(data.customerRelationships) && data.customerRelationships.length
        ? data.customerRelationships
        : d.customerRelationships,
    channels: Array.isArray(data.channels) && data.channels.length ? data.channels : d.channels,
    customerSegments:
      Array.isArray(data.customerSegments) && data.customerSegments.length ? data.customerSegments : d.customerSegments,
    costStructure: Array.isArray(data.costStructure) && data.costStructure.length ? data.costStructure : d.costStructure,
    revenueStreams:
      Array.isArray(data.revenueStreams) && data.revenueStreams.length ? data.revenueStreams : d.revenueStreams,
  }
}

type BlockKey = Exclude<keyof BmcCanvas, 'designedFor' | 'designedBy' | 'documentDate' | 'docVersion'>

function BmcBlock({
  title,
  hint,
  icon: Icon,
  category,
  canvas,
  updateField,
  addItem,
  removeItem,
  onContextMenu,
}: {
  title: string
  hint: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  category: BlockKey
  canvas: BmcCanvas
  updateField: (category: BlockKey, index: number, value: string) => void
  addItem: (category: BlockKey) => void
  removeItem: (category: BlockKey, index: number) => void
  onContextMenu: (e: React.MouseEvent, category: BlockKey) => void
}) {
  const items = canvas[category]

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-white p-2.5 sm:p-3"
      onContextMenu={e => onContextMenu(e, category)}
    >
      <div className="mb-1.5 flex shrink-0 items-start justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-black sm:text-xs">{title}</h3>
        <Icon className="h-4 w-4 shrink-0 text-black sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="mb-2 shrink-0 text-[10px] leading-snug text-neutral-500 sm:text-[11px]">{hint}</p>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item, index) => (
          <div key={`${category}-${index}`} className="flex gap-1">
            <textarea
              value={item}
              onChange={e => updateField(category, index, e.target.value)}
              onKeyDown={e =>
                deleteEmptyFieldRow(e, item, items.length > 1, () => removeItem(category, index))
              }
              placeholder="·"
              rows={1}
              className="min-h-[1.5rem] w-full resize-none border-0 bg-transparent px-0 py-0.5 text-[11px] leading-snug text-black placeholder:text-neutral-400 focus:outline-none focus:ring-0 sm:text-xs"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addItem(category)}
        className="mt-1.5 shrink-0 self-start text-[10px] font-medium text-neutral-600 underline decoration-neutral-400 underline-offset-2 hover:text-black"
      >
        + tilføj
      </button>
    </div>
  )
}

export default function BusinessModelCanvas() {
  const { isEmbed } = useToolEmbed()
  const [canvas, setCanvas] = useState<BmcCanvas>(() => defaultCanvas())
  const [menu, setMenu] = useState<{ x: number; y: number; category: BlockKey } | null>(null)
  const wrapSetCanvas = useCallback((data: BmcCanvas | Partial<BmcCanvas>) => {
    setCanvas(normalizeLoaded(data as Partial<BmcCanvas>))
  }, [])

  useProjectToolData<BmcCanvas>('business-model-canvas', canvas, wrapSetCanvas)

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
    }
    window.addEventListener('keydown', onKey)
    let removePointer: (() => void) | undefined
    const t = window.setTimeout(() => {
      const onDown = () => setMenu(null)
      window.addEventListener('mousedown', onDown)
      removePointer = () => window.removeEventListener('mousedown', onDown)
    }, 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      removePointer?.()
    }
  }, [menu])

  const updateField = (category: BlockKey, index: number, value: string) => {
    setCanvas(prev => {
      const next = { ...prev }
      next[category] = [...next[category]]
      next[category][index] = value
      return next
    })
  }

  const updateMeta = (key: keyof Pick<BmcCanvas, 'designedFor' | 'designedBy' | 'documentDate' | 'docVersion'>, value: string) => {
    setCanvas(prev => ({ ...prev, [key]: value }))
  }

  const addItem = (category: BlockKey) => {
    setCanvas(prev => ({
      ...prev,
      [category]: [...prev[category], ''],
    }))
  }

  const removeItem = (category: BlockKey, index: number) => {
    setCanvas(prev => {
      const next = { ...prev }
      const filtered = next[category].filter((_, i) => i !== index)
      next[category] = filtered.length === 0 ? [''] : filtered
      return next
    })
  }

  const clearSection = (category: BlockKey) => {
    setCanvas(prev => ({ ...prev, [category]: [''] }))
    setMenu(null)
  }

  const onBlockContextMenu = (e: React.MouseEvent, category: BlockKey) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, category })
  }

  const hints: Record<BlockKey, string> = {
    keyPartners: 'Who helps you deliver? Suppliers, alliances, partners.',
    keyActivities: 'What must you do? Production, problem-solving, platform.',
    keyResources: 'What do you need? Physical, intellectual, human, financial.',
    valuePropositions: 'What value do you offer? Which customer problems are you solving?',
    customerRelationships: 'How do you interact? Personal assistance, self-service, community.',
    channels: 'How do you reach customers? Sales, distribution, communication.',
    customerSegments: 'Who do you serve? Mass market, niche, segmented, diversified.',
    costStructure: 'What drives cost? Fixed, variable, economies of scale.',
    revenueStreams: 'How do you earn? Asset sale, subscription, licensing, brokerage.',
  }

  return (
    <div
      className={
        isEmbed
          ? 'min-h-0 bg-neutral-100 px-2 py-2 sm:px-3'
          : 'min-h-screen bg-neutral-100 px-3 py-6 sm:px-4 md:py-10'
      }
    >
      <div className="mx-auto max-w-6xl">
        {!isEmbed && (
          <header className="mb-6 sm:mb-8">
            <div className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm sm:p-6">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-black"
              >
                <span aria-hidden>←</span>
                <span>Tilbage til dashboard</span>
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <ForgeLabLogo size={40} />
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">Business Model Canvas</h1>
                  <p className="text-sm text-neutral-600">Klassisk layout — ét overblik over din forretningsmodel</p>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Strategyzer-style sheet */}
        <div className="overflow-x-auto rounded-sm border-2 border-black bg-white shadow-md">
          {/* Meta row */}
          <div className="grid gap-2 border-b-2 border-black p-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] sm:items-end sm:gap-3 sm:p-4">
            <h2 className="text-sm font-bold text-black sm:text-base md:text-lg">The Business Model Canvas</h2>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-neutral-600 sm:text-[11px]">
              Designed for:
              <input
                value={canvas.designedFor}
                onChange={e => updateMeta('designedFor', e.target.value)}
                className="border border-black px-1.5 py-1 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-black sm:text-xs"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-neutral-600 sm:text-[11px]">
              Designed by:
              <input
                value={canvas.designedBy}
                onChange={e => updateMeta('designedBy', e.target.value)}
                className="border border-black px-1.5 py-1 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-black sm:text-xs"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-neutral-600 sm:text-[11px]">
              Date:
              <input
                value={canvas.documentDate}
                onChange={e => updateMeta('documentDate', e.target.value)}
                placeholder="dd/mm/yyyy"
                className="border border-black px-1.5 py-1 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-black sm:text-xs"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium text-neutral-600 sm:text-[11px]">
              Version:
              <input
                value={canvas.docVersion}
                onChange={e => updateMeta('docVersion', e.target.value)}
                className="border border-black px-1.5 py-1 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-black sm:text-xs"
              />
            </label>
          </div>

          {/* Main 5×2 logical grid as 10 columns */}
          <div
            className="grid grid-cols-10 grid-rows-2 border-b-2 border-black"
            style={{ minHeight: 'clamp(280px, 45vh, 480px)' }}
          >
            <div className="col-span-2 col-start-1 row-span-2 row-start-1 border-r-2 border-black">
              <BmcBlock
                title="Key partners"
                hint={hints.keyPartners}
                icon={Link2}
                category="keyPartners"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-3 row-start-1 border-b-2 border-r-2 border-black">
              <BmcBlock
                title="Key activities"
                hint={hints.keyActivities}
                icon={CheckSquare}
                category="keyActivities"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-5 row-span-2 row-start-1 border-r-2 border-black">
              <BmcBlock
                title="Value propositions"
                hint={hints.valuePropositions}
                icon={Gift}
                category="valuePropositions"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-7 row-start-1 border-b-2 border-r-2 border-black">
              <BmcBlock
                title="Customer relationships"
                hint={hints.customerRelationships}
                icon={Heart}
                category="customerRelationships"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-9 row-span-2 row-start-1 border-black">
              <BmcBlock
                title="Customer segments"
                hint={hints.customerSegments}
                icon={Users}
                category="customerSegments"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-3 row-start-2 border-r-2 border-black">
              <BmcBlock
                title="Key resources"
                hint={hints.keyResources}
                icon={Building2}
                category="keyResources"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div className="col-span-2 col-start-7 row-start-2 border-r-2 border-black">
              <BmcBlock
                title="Channels"
                hint={hints.channels}
                icon={Truck}
                category="channels"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid min-h-[clamp(120px,22vh,200px)] grid-cols-2">
            <div className="border-r-2 border-black">
              <BmcBlock
                title="Cost structure"
                hint={hints.costStructure}
                icon={Tag}
                category="costStructure"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
            <div>
              <BmcBlock
                title="Revenue streams"
                hint={hints.revenueStreams}
                icon={CircleDollarSign}
                category="revenueStreams"
                canvas={canvas}
                updateField={updateField}
                addItem={addItem}
                removeItem={removeItem}
                onContextMenu={onBlockContextMenu}
              />
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-neutral-500">
          Højreklik i et felt for at rydde hele sektionen · Punkt-linjer tilføjes med <strong>+ tilføj</strong>
        </p>
      </div>

      {menu && (
        <div
          className="fixed z-[100] min-w-[180px] rounded-lg border border-neutral-300 bg-white py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100"
            onClick={() => {
              addItem(menu.category)
              setMenu(null)
            }}
          >
            Tilføj punkt
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            onClick={() => clearSection(menu.category)}
          >
            Ryd sektion
          </button>
        </div>
      )}
    </div>
  )
}
