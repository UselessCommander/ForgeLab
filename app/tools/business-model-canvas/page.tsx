'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link2, Zap, Factory, Gift, Heart, Truck, User, Tag, Banknote } from 'lucide-react'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { useToolEmbed } from '@/components/ToolEmbedContext'

type BmcMeta = {
  designedFor: string
  designedBy: string
  date: string
  version: string
}

type BmcCanvas = {
  partnerships: string
  activities: string
  resources: string
  valuePropositions: string
  relationships: string
  channels: string
  segments: string
  cost: string
  revenue: string
}

type BmcState = {
  meta: BmcMeta
  canvas: BmcCanvas
}

const defaultState = (): BmcState => ({
  meta: {
    designedFor: '',
    designedBy: '',
    date: '',
    version: '',
  },
  canvas: {
    partnerships: '',
    activities: '',
    resources: '',
    valuePropositions: '',
    relationships: '',
    channels: '',
    segments: '',
    cost: '',
    revenue: '',
  },
})

function normalizeLoaded(data: Partial<BmcState> | null | undefined): BmcState {
  const d = defaultState()
  if (!data || typeof data !== 'object') return d
  return {
    meta: {
      ...d.meta,
      ...(data.meta || {}),
    },
    canvas: {
      ...d.canvas,
      ...(data.canvas || {}),
    },
  }
}

function CanvasBlock({
  title,
  icon,
  value,
  onChange,
  className = '',
}: {
  title: string
  icon: React.ReactNode
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={`flex flex-col p-3 ${className}`}>
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-sm font-bold text-gray-800 sm:text-base">{title}</h3>
        <div className="h-6 w-6 text-gray-500">{icon}</div>
      </div>
      <textarea
        className="w-full flex-grow resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-300"
        placeholder={`Skriv under ${title}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function BusinessModelCanvasPage() {
  const { isEmbed } = useToolEmbed()
  const [state, setState] = useState<BmcState>(() => defaultState())
  const wrapSetState = (data: BmcState | Partial<BmcState>) => {
    setState(normalizeLoaded(data as Partial<BmcState>))
  }
  useProjectToolData<BmcState>('business-model-canvas', state, wrapSetState)

  const { meta, canvas } = state

  const setMetaField = (key: keyof BmcMeta, value: string) => {
    setState((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }))
  }

  const setCanvasField = (key: keyof BmcCanvas, value: string) => {
    setState((prev) => ({ ...prev, canvas: { ...prev.canvas, [key]: value } }))
  }

  return (
    <div
      className={
        isEmbed
          ? 'min-h-0 bg-gray-100 p-2 font-sans sm:p-3'
          : 'min-h-screen bg-gray-100 p-4 font-sans sm:p-8'
      }
    >
      {!isEmbed ? (
        <div className="mx-auto mb-4 max-w-7xl">
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
            <span aria-hidden>←</span>
            <span>Tilbage til dashboard</span>
          </Link>
          <div className="mb-2 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500 text-white text-sm font-extrabold shadow-sm shadow-amber-500/30 select-none">F</span>
            <p className="text-sm text-gray-600">Business Model Canvas</p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <div className="mb-4 flex w-full flex-col justify-between lg:flex-row lg:items-end print:mb-6">
          <div className="mb-4 flex items-center gap-4 lg:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">The Business Model Canvas</h1>
          </div>

          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <div className="flex border-b border-gray-400 pb-1">
              <span className="mr-2 font-semibold">Designed for:</span>
              <input
                type="text"
                className="w-32 bg-transparent text-gray-700 outline-none sm:w-48"
                value={meta.designedFor}
                onChange={(e) => setMetaField('designedFor', e.target.value)}
              />
            </div>
            <div className="flex border-b border-gray-400 pb-1">
              <span className="mr-2 font-semibold">Designed by:</span>
              <input
                type="text"
                className="w-32 bg-transparent text-gray-700 outline-none sm:w-48"
                value={meta.designedBy}
                onChange={(e) => setMetaField('designedBy', e.target.value)}
              />
            </div>
            <div className="flex border-b border-gray-400 pb-1">
              <span className="mr-2 font-semibold">Date:</span>
              <input
                type="text"
                className="w-24 bg-transparent text-gray-700 outline-none"
                value={meta.date}
                onChange={(e) => setMetaField('date', e.target.value)}
              />
            </div>
            <div className="flex border-b border-gray-400 pb-1">
              <span className="mr-2 font-semibold">Version:</span>
              <input
                type="text"
                className="w-16 bg-transparent text-gray-700 outline-none"
                value={meta.version}
                onChange={(e) => setMetaField('version', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-grow flex-col border-[3px] border-black bg-white shadow-xl print:h-[18cm] print:shadow-none">
          <div className="h-[65vh] flex-grow border-b-[3px] border-black md:flex">
            <CanvasBlock
              title="Key Partnerships"
              icon={<Link2 strokeWidth={1.5} />}
              value={canvas.partnerships}
              onChange={(value) => setCanvasField('partnerships', value)}
              className="h-64 border-b-[3px] border-black md:h-full md:w-1/5 md:border-b-0 md:border-r-[3px]"
            />

            <div className="h-auto border-b-[3px] border-black md:flex md:h-full md:w-1/5 md:flex-col md:border-b-0 md:border-r-[3px]">
              <CanvasBlock
                title="Key Activities"
                icon={<Zap strokeWidth={1.5} />}
                value={canvas.activities}
                onChange={(value) => setCanvasField('activities', value)}
                className="h-48 border-b-[3px] border-black md:h-1/2"
              />
              <CanvasBlock
                title="Key Resources"
                icon={<Factory strokeWidth={1.5} />}
                value={canvas.resources}
                onChange={(value) => setCanvasField('resources', value)}
                className="h-48 md:h-1/2"
              />
            </div>

            <CanvasBlock
              title="Value Propositions"
              icon={<Gift strokeWidth={1.5} />}
              value={canvas.valuePropositions}
              onChange={(value) => setCanvasField('valuePropositions', value)}
              className="h-64 border-b-[3px] border-black md:h-full md:w-1/5 md:border-b-0 md:border-r-[3px]"
            />

            <div className="h-auto border-b-[3px] border-black md:flex md:h-full md:w-1/5 md:flex-col md:border-b-0 md:border-r-[3px]">
              <CanvasBlock
                title="Customer Relationships"
                icon={<Heart strokeWidth={1.5} />}
                value={canvas.relationships}
                onChange={(value) => setCanvasField('relationships', value)}
                className="h-48 border-b-[3px] border-black md:h-1/2"
              />
              <CanvasBlock
                title="Channels"
                icon={<Truck strokeWidth={1.5} />}
                value={canvas.channels}
                onChange={(value) => setCanvasField('channels', value)}
                className="h-48 md:h-1/2"
              />
            </div>

            <CanvasBlock
              title="Customer Segments"
              icon={<User strokeWidth={1.5} />}
              value={canvas.segments}
              onChange={(value) => setCanvasField('segments', value)}
              className="h-64 md:h-full md:w-1/5"
            />
          </div>

          <div className="h-auto md:flex md:h-[30vh] print:h-[35%]">
            <CanvasBlock
              title="Cost Structure"
              icon={<Tag strokeWidth={1.5} />}
              value={canvas.cost}
              onChange={(value) => setCanvasField('cost', value)}
              className="h-48 border-b-[3px] border-black md:h-full md:w-1/2 md:border-b-0 md:border-r-[3px]"
            />

            <CanvasBlock
              title="Revenue Streams"
              icon={<Banknote strokeWidth={1.5} />}
              value={canvas.revenue}
              onChange={(value) => setCanvasField('revenue', value)}
              className="h-48 md:h-full md:w-1/2"
            />
          </div>
        </div>

        <div className="mt-4 w-full text-center text-xs text-gray-500 print:hidden">
          Udfyld felterne direkte. Tryk på print-ikonet for at gemme som PDF eller printe den ud.
        </div>
      </div>
    </div>
  )
}
