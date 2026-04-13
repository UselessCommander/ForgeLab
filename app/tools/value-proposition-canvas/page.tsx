'use client'

import { useState, type ComponentType } from 'react'
import Link from 'next/link'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

function IconGift({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="10" y="18" width="28" height="24" rx="2" />
      <path d="M10 22h28M24 18v24" />
      <path d="M24 18c-4-6-12-5-12 2s8 7 12 2m0-4c4-6 12-5 12 2s-8 7-12 2" />
    </svg>
  )
}

function IconHead({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <ellipse cx="24" cy="20" rx="11" ry="13" />
      <path d="M13 38c2-8 8-12 11-12s9 4 11 12" />
    </svg>
  )
}

function IconHandBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 28c0-4 3-6 6-6h4l2-8h8v20H12c-3 0-6-2-6-6z" />
      <rect x="18" y="10" width="14" height="10" rx="1" />
    </svg>
  )
}

function IconChartUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 32V8M8 32h24" />
      <rect x="12" y="22" width="5" height="10" />
      <rect x="20" y="16" width="5" height="16" />
      <rect x="28" y="10" width="5" height="22" />
      <path d="M14 12l6-4 6 5 6-8" />
    </svg>
  )
}

function IconPill({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="8" y="14" width="24" height="12" rx="6" transform="rotate(-25 20 20)" />
      <line x1="14" y1="20" x2="26" y2="20" transform="rotate(-25 20 20)" />
    </svg>
  )
}

function IconSmile({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="20" cy="20" r="14" />
      <circle cx="14" cy="16" r="1.5" fill="currentColor" />
      <circle cx="26" cy="16" r="1.5" fill="currentColor" />
      <path d="M12 24c2 5 14 5 16 0" />
    </svg>
  )
}

function IconFrown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="20" cy="20" r="14" />
      <circle cx="14" cy="16" r="1.5" fill="currentColor" />
      <circle cx="26" cy="16" r="1.5" fill="currentColor" />
      <path d="M12 28c3-4 13-4 16 0" />
    </svg>
  )
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="8" cy="10" r="2" fill="currentColor" />
      <circle cx="8" cy="20" r="2" fill="currentColor" />
      <circle cx="8" cy="30" r="2" fill="currentColor" />
      <line x1="14" y1="10" x2="32" y2="10" />
      <line x1="14" y1="20" x2="32" y2="20" />
      <line x1="14" y1="30" x2="32" y2="30" />
    </svg>
  )
}

function MiniCanvasGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="8" width="11" height="11" />
      <circle cx="23" cy="19.5" r="5.5" />
      <line x1="15" y1="13.5" x2="17.5" y2="19.5" strokeLinecap="round" />
    </svg>
  )
}

type CustomerProfile = { jobs: string[]; pains: string[]; gains: string[] }
type ValueMap = { products: string[]; painRelievers: string[]; gainCreators: string[] }

const defaultCustomer: CustomerProfile = { jobs: [''], pains: [''], gains: [''] }
const defaultValueMap: ValueMap = { products: [''], painRelievers: [''], gainCreators: [''] }

export default function ValuePropositionCanvas() {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(defaultCustomer)
  const [valueMap, setValueMap] = useState<ValueMap>(defaultValueMap)
  const [valueProposition, setValueProposition] = useState('')
  const [customerSegment, setCustomerSegment] = useState('')

  const valuePropositionData = {
    customerProfile,
    valueMap,
    valueProposition,
    customerSegment,
  }

  const normalizeProfile = (raw: unknown): CustomerProfile => {
    if (!raw || typeof raw !== 'object') return defaultCustomer
    const o = raw as Partial<CustomerProfile>
    const arr = (a: unknown): string[] =>
      Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === 'string') ? (a as string[]) : ['']
    return {
      jobs: arr(o.jobs),
      pains: arr(o.pains),
      gains: arr(o.gains),
    }
  }

  const normalizeValueMap = (raw: unknown): ValueMap => {
    if (!raw || typeof raw !== 'object') return defaultValueMap
    const o = raw as Partial<ValueMap>
    const arr = (a: unknown): string[] =>
      Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === 'string') ? (a as string[]) : ['']
    return {
      products: arr(o.products),
      painRelievers: arr(o.painRelievers),
      gainCreators: arr(o.gainCreators),
    }
  }

  const setValuePropositionData = (data: Partial<typeof valuePropositionData> & Record<string, unknown>) => {
    setCustomerProfile(normalizeProfile(data.customerProfile))
    setValueMap(normalizeValueMap(data.valueMap))
    setValueProposition(typeof data.valueProposition === 'string' ? data.valueProposition : '')
    setCustomerSegment(typeof data.customerSegment === 'string' ? data.customerSegment : '')
  }

  useProjectToolData('value-proposition-canvas', valuePropositionData, setValuePropositionData)

  const updateCustomerField = (category: keyof CustomerProfile, index: number, value: string) => {
    const next = { ...customerProfile }
    next[category] = [...next[category]]
    next[category][index] = value
    setCustomerProfile(next)
  }

  const updateValueField = (category: keyof ValueMap, index: number, value: string) => {
    const next = { ...valueMap }
    next[category] = [...next[category]]
    next[category][index] = value
    setValueMap(next)
  }

  const addCustomerItem = (category: keyof CustomerProfile) => {
    setCustomerProfile({ ...customerProfile, [category]: [...customerProfile[category], ''] })
  }

  const addValueItem = (category: keyof ValueMap) => {
    setValueMap({ ...valueMap, [category]: [...valueMap[category], ''] })
  }

  const removeCustomerItem = (category: keyof CustomerProfile, index: number) => {
    const next = customerProfile[category].filter((_, i) => i !== index)
    setCustomerProfile({ ...customerProfile, [category]: next.length ? next : [''] })
  }

  const removeValueItem = (category: keyof ValueMap, index: number) => {
    const next = valueMap[category].filter((_, i) => i !== index)
    setValueMap({ ...valueMap, [category]: next.length ? next : [''] })
  }

  const fieldClass =
    'w-full min-h-[2.25rem] resize-none border-0 bg-transparent px-0 py-0.5 text-[11px] leading-snug text-black placeholder:text-neutral-400 focus:outline-none focus:ring-0'

  const SectionLabel = ({
    icon: Icon,
    label,
  }: {
    icon: ComponentType<{ className?: string }>
    label: string
  }) => (
    <div className="mb-1 flex shrink-0 items-center gap-1 border-b border-black/15 pb-0.5">
      <Icon className="h-5 w-5 shrink-0 text-black" />
      <span className="text-[10px] font-bold uppercase tracking-wide text-black">{label}</span>
    </div>
  )

  const ListBlock = ({
    items,
    onChange,
    onAdd,
    onRemove,
    placeholder,
  }: {
    items: string[]
    onChange: (i: number, v: string) => void
    onAdd: () => void
    onRemove: (i: number) => void
    placeholder: string
  }) => (
    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
      {items.map((item, index) => (
        <div key={index} className="group flex gap-0.5">
          <textarea
            value={item}
            onChange={(e) => onChange(index, e.target.value)}
            onKeyDown={(e) =>
              deleteEmptyFieldRow(e, item, items.length > 1, () => onRemove(index))
            }
            placeholder={placeholder}
            rows={2}
            className={fieldClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="mt-0.5 self-start text-[10px] text-black/60 underline decoration-black/30 hover:text-black"
      >
        + Tilføj
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-black">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-black"
        >
          ← Tilbage til dashboard
        </Link>

        <h1 className="mb-4 text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
          The Value Proposition Canvas
        </h1>

        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-black">Value Proposition:</span>
            <input
              type="text"
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              className="border border-black/20 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Kort beskrivelse af dit tilbud"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-black">Customer Segment:</span>
            <div className="relative">
              <input
                type="text"
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value)}
                className="w-full border border-black/20 bg-white py-2 pl-3 pr-11 text-sm text-black shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Hvem er kunden?"
              />
              <MiniCanvasGlyph className="pointer-events-none absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 text-black/70" />
            </div>
          </label>
        </div>

        {/* Reference layout (SVG style) */}
        <div className="mb-8 overflow-x-auto rounded-xl border-[3px] border-black bg-[#eeedf0] p-2">
          <svg
            viewBox="0 0 2094 1177"
            className="mx-auto h-auto min-w-[900px] w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Value Proposition Canvas reference"
          >
            <rect width="2094" height="1177" fill="#EEEDF0" />
            <rect x="140" y="266" width="788" height="820" fill="white" stroke="black" strokeWidth="8" />
            <circle cx="1546" cy="674" r="408" fill="white" stroke="black" strokeWidth="8" />
            <path d="M138 263L533 677H968M138 1089L533 677H927" stroke="black" strokeWidth="4" />
            <path d="M1090 676H1544L1806 358M1544 676L1806 996" stroke="black" strokeWidth="4" />
            <circle cx="1030" cy="678" r="39" fill="white" stroke="black" strokeWidth="3" />
            <text x="1010" y="686" fill="black" fontSize="28" fontWeight="700">
              FIT
            </text>
            <text x="322" y="220" fill="black" fontSize="54" fontWeight="700">
              VALUE MAP
            </text>
            <text x="1370" y="220" fill="black" fontSize="54" fontWeight="700">
              CUSTOMER PROFILE
            </text>
            <text x="220" y="470" fill="black" fontSize="34" fontWeight="700">
              GAIN CREATORS
            </text>
            <text x="190" y="690" fill="black" fontSize="34" fontWeight="700">
              PRODUCTS & SERVICES
            </text>
            <text x="600" y="900" fill="black" fontSize="34" fontWeight="700">
              PAIN RELIEVERS
            </text>
            <text x="1440" y="500" fill="black" fontSize="34" fontWeight="700">
              GAINS
            </text>
            <text x="1765" y="690" fill="black" fontSize="34" fontWeight="700">
              CUSTOMER JOBS
            </text>
            <text x="1410" y="905" fill="black" fontSize="34" fontWeight="700">
              PAINS
            </text>
          </svg>
        </div>

        {/* Main canvas: square — connector — circle */}
        <div className="flex flex-col items-center justify-center gap-2 lg:flex-row lg:items-center lg:gap-0">
          {/* Value map (square) */}
          <div
            className="relative aspect-square w-full max-w-[min(92vw,22rem)] shrink-0 border-[3px] border-black bg-white sm:max-w-[min(88vw,26rem)] md:max-w-[min(42vw,28rem)]"
            style={{ aspectRatio: '1' }}
          >
            <div
              className="absolute inset-0 z-[1] flex min-h-0 flex-col p-2 pr-[30%] sm:p-2.5"
              style={{ clipPath: 'polygon(0 0, 0 100%, 72% 50%)' }}
            >
              <SectionLabel icon={IconHandBox} label="Products and Services" />
              <ListBlock
                items={valueMap.products}
                onChange={(i, v) => updateValueField('products', i, v)}
                onAdd={() => addValueItem('products')}
                onRemove={(i) => removeValueItem('products', i)}
                placeholder="Hvad tilbyder du?"
              />
            </div>
            <div
              className="absolute inset-0 z-[2] flex min-h-0 flex-col p-2 pb-[28%] pl-[18%] sm:p-2.5"
              style={{ clipPath: 'polygon(0 0, 100% 0, 72% 50%)' }}
            >
              <SectionLabel icon={IconChartUp} label="Gain Creators" />
              <ListBlock
                items={valueMap.gainCreators}
                onChange={(i, v) => updateValueField('gainCreators', i, v)}
                onAdd={() => addValueItem('gainCreators')}
                onRemove={(i) => removeValueItem('gainCreators', i)}
                placeholder="Hvordan skaber du gevinster?"
              />
            </div>
            <div
              className="absolute inset-0 z-[3] flex min-h-0 flex-col p-2 pt-[30%] pl-[18%] sm:p-2.5"
              style={{ clipPath: 'polygon(100% 100%, 0 100%, 72% 50%)' }}
            >
              <SectionLabel icon={IconPill} label="Pain Relievers" />
              <ListBlock
                items={valueMap.painRelievers}
                onChange={(i, v) => updateValueField('painRelievers', i, v)}
                onAdd={() => addValueItem('painRelievers')}
                onRemove={(i) => removeValueItem('painRelievers', i)}
                placeholder="Hvordan lindrer du smertepunkter?"
              />
            </div>
            <div
              className="pointer-events-none absolute left-[calc(72%-1.125rem)] top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 text-black"
              aria-hidden
            >
              <IconGift className="h-10 w-10 sm:h-11 sm:w-11" />
            </div>
          </div>

          {/* Connector: linje med pile mod hinanden (lodret på mobil, vandret på desktop) */}
          <div className="flex w-full max-w-[min(92vw,22rem)] shrink-0 items-center justify-center py-2 lg:w-auto lg:max-w-[4.5rem] lg:px-1 lg:py-0" aria-hidden>
            {/* Mobil: lodret */}
            <svg className="h-14 w-8 text-black lg:hidden" viewBox="0 0 32 80" fill="none">
              <line x1="16" y1="4" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 30l-4-8h8l-4 8z" fill="currentColor" />
              <path d="M16 50l-4 8h8l-4-8z" fill="currentColor" />
              <line x1="16" y1="50" x2="16" y2="76" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {/* Desktop: vandret */}
            <svg className="hidden h-8 w-[4.25rem] text-black lg:block" viewBox="0 0 68 32" fill="none">
              <line x1="2" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <path d="M24 16l8-4v8l-8-4z" fill="currentColor" />
              <path d="M44 16l-8-4v8l8-4z" fill="currentColor" />
              <line x1="44" y1="16" x2="66" y2="16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Customer profile (circle) */}
          <div
            className="relative aspect-square w-full max-w-[min(92vw,22rem)] shrink-0 sm:max-w-[min(88vw,26rem)] md:max-w-[min(42vw,28rem)]"
            style={{ aspectRatio: '1' }}
          >
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full text-black"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle cx="50" cy="50" r="48" fill="#fff" stroke="currentColor" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="50" y2="4" stroke="currentColor" strokeWidth="0.45" />
              <line x1="50" y1="50" x2="91" y2="73" stroke="currentColor" strokeWidth="0.45" />
              <line x1="50" y1="50" x2="9" y2="73" stroke="currentColor" strokeWidth="0.45" />
            </svg>

            <div
              className="absolute inset-[2.5%] z-[1] flex min-h-0 flex-col px-2 pt-1 sm:px-2.5"
              style={{ clipPath: 'polygon(50% 52%, 6% 4%, 94% 4%, 78% 42%, 50% 48%, 22% 42%)' }}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0.5">
                <SectionLabel icon={IconSmile} label="Gains" />
                <ListBlock
                  items={customerProfile.gains}
                  onChange={(i, v) => updateCustomerField('gains', i, v)}
                  onAdd={() => addCustomerItem('gains')}
                  onRemove={(i) => removeCustomerItem('gains', i)}
                  placeholder="Hvad ønsker kunden?"
                />
              </div>
            </div>

            <div
              className="absolute inset-[2.5%] z-[2] flex min-h-0 flex-col px-2 sm:px-2.5"
              style={{ clipPath: 'polygon(50% 52%, 78% 42%, 97% 50%, 97% 88%, 62% 98%, 50% 96%)' }}
            >
              <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden pb-[18%] pl-[22%]">
                <SectionLabel icon={IconList} label="Customer Jobs" />
                <ListBlock
                  items={customerProfile.jobs}
                  onChange={(i, v) => updateCustomerField('jobs', i, v)}
                  onAdd={() => addCustomerItem('jobs')}
                  onRemove={(i) => removeCustomerItem('jobs', i)}
                  placeholder="Hvad skal kunden klare?"
                />
              </div>
            </div>

            <div
              className="absolute inset-[2.5%] z-[3] flex min-h-0 flex-col px-2 pb-1 sm:px-2.5"
              style={{ clipPath: 'polygon(50% 52%, 22% 42%, 6% 88%, 38% 98%, 50% 96%, 62% 98%, 3% 88%)' }}
            >
              <div className="mt-auto flex min-h-0 flex-1 flex-col justify-end overflow-hidden pb-0.5">
                <SectionLabel icon={IconFrown} label="Pains" />
                <ListBlock
                  items={customerProfile.pains}
                  onChange={(i, v) => updateCustomerField('pains', i, v)}
                  onAdd={() => addCustomerItem('pains')}
                  onRemove={(i) => removeCustomerItem('pains', i)}
                  placeholder="Hvad frustrerer kunden?"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 text-black">
              <IconHead className="h-9 w-9 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-6 text-xs text-neutral-600 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xs leading-relaxed">
            Bedre strategisk arbejde: værktøjer der samler holdet og skaber resultater.
          </p>
          <p className="text-center text-[11px] text-neutral-500 sm:order-none">
            Inspireret af Value Proposition Design. ForgeLab — dit strategiværksted.
          </p>
          <div className="text-right">
            <Link href="/dashboard" className="text-sm font-bold text-black hover:underline">
              ForgeLab
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
