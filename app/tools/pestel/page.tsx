'use client'

import { useCallback, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'

type PestelData = {
  political: string[]
  economic: string[]
  social: string[]
  technological: string[]
  legal: string[]
  environmental: string[]
}

const CELLS = 9

const DEFAULT_DATA: PestelData = {
  political: Array(CELLS).fill(''),
  economic: Array(CELLS).fill(''),
  social: Array(CELLS).fill(''),
  technological: Array(CELLS).fill(''),
  legal: Array(CELLS).fill(''),
  environmental: Array(CELLS).fill(''),
}

function normalizePestel(raw: Partial<PestelData> | null | undefined): PestelData {
  const keys: (keyof PestelData)[] = [
    'political',
    'economic',
    'social',
    'technological',
    'legal',
    'environmental',
  ]
  const merged = { ...DEFAULT_DATA, ...raw }
  const out = { ...merged }
  for (const k of keys) {
    const arr = Array.isArray(out[k]) ? out[k] : ['']
    const next = arr.slice(0, CELLS).map(String)
    while (next.length < CELLS) next.push('')
    out[k] = next
  }
  return out
}

type ColumnTheme = {
  key: keyof PestelData
  letter: string
  label: string
  blurb: string
  headerBg: string
  contentBg: string
  headerText: string
  cardText: string
  labelBg: string
  labelText: string
  darkCards: boolean
}

const COLUMNS: ColumnTheme[] = [
  {
    key: 'political',
    letter: 'P',
    label: 'Political',
    blurb:
      'Lovgivning, skattepolitik, handelsrestriktioner og politisk stabilitet påvirker, hvordan virksomheder opererer og tjener penge.',
    headerBg: '#5EB6E8',
    contentBg: '#E4F2FA',
    headerText: '#0c1722',
    cardText: '#0c1722',
    labelBg: '#5EB6E8',
    labelText: '#0c1722',
    darkCards: false,
  },
  {
    key: 'economic',
    letter: 'E',
    label: 'Economic',
    blurb:
      'Økonomiske faktorer som inflation, renter, vækst og arbejdsløshed påvirker efterspørgsel, omkostninger og investeringsvilje.',
    headerBg: '#B9A3E8',
    contentBg: '#F0EBFA',
    headerText: '#1a1530',
    cardText: '#1a1530',
    labelBg: '#B9A3E8',
    labelText: '#1a1530',
    darkCards: false,
  },
  {
    key: 'social',
    letter: 'S',
    label: 'Social',
    blurb:
      'Demografi, kultur, sundhed, uddannelse og livsstilstrends former kunders behov, holdninger og adfærd.',
    headerBg: '#F0A080',
    contentBg: '#FCEEE8',
    headerText: '#2c1810',
    cardText: '#2c1810',
    labelBg: '#F0A080',
    labelText: '#2c1810',
    darkCards: false,
  },
  {
    key: 'technological',
    letter: 'T',
    label: 'Technological',
    blurb:
      'Innovation, automatisering, R&D og digital infrastruktur skaber muligheder og udfordrer eksisterende forretningsmodeller.',
    headerBg: '#1E2A3A',
    contentBg: '#E9ECF0',
    headerText: '#ffffff',
    cardText: '#ffffff',
    labelBg: '#2d3d52',
    labelText: '#ffffff',
    darkCards: true,
  },
  {
    key: 'legal',
    letter: 'L',
    label: 'Legal',
    blurb:
      'Kontrakter, forbrugerbeskyttelse, arbejdsret og branchekrav sætter rammer for produkter, markedsføring og drift.',
    headerBg: '#D4C4A8',
    contentBg: '#F5EFE6',
    headerText: '#2a2418',
    cardText: '#2a2418',
    labelBg: '#C9B896',
    labelText: '#2a2418',
    darkCards: false,
  },
  {
    key: 'environmental',
    letter: 'E',
    label: 'Environmental',
    blurb:
      'Klima, vejr, bæredygtighed og miljøregler påvirker råvarer, logistik, omdømme og omkostninger.',
    headerBg: '#3CBF88',
    contentBg: '#E6F5ED',
    headerText: '#0c2218',
    cardText: '#0c2218',
    labelBg: '#3CBF88',
    labelText: '#0c2218',
    darkCards: false,
  },
]

export default function PestelPage() {
  const [data, setData] = useState<PestelData>(() => normalizePestel(DEFAULT_DATA))

  const persistPestel = useCallback((next: PestelData) => {
    setData(normalizePestel(next))
  }, [])

  useProjectToolData<PestelData>('pestel', data, persistPestel)

  const updateItem = (key: keyof PestelData, index: number, value: string) => {
    setData((prev) => {
      const next = { ...prev, [key]: [...prev[key]] }
      next[key][index] = value
      return normalizePestel(next)
    })
  }

  const clearCell = (key: keyof PestelData, index: number) => {
    setData((prev) => {
      const next = { ...prev, [key]: [...prev[key]] }
      next[key][index] = ''
      return normalizePestel(next)
    })
  }

  return (
    <ToolLayout
      title="PESTEL"
      description="Analysér eksterne forhold med seks dimensioner — ét overblik som på klassiske PESTEL-plancher."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div
        className="rounded-2xl p-4 md:p-6 shadow-sm border border-black/[0.06]"
        style={{ background: '#F2EDE4' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 md:gap-3">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex flex-col min-w-0 rounded-xl overflow-hidden shadow-md ring-1 ring-black/[0.06]"
            >
              <header
                className="px-3 pt-5 pb-4 text-center shrink-0"
                style={{ backgroundColor: col.headerBg, color: col.headerText }}
              >
                <div className="text-5xl md:text-[2.75rem] font-black leading-none tracking-tight mb-3">
                  {col.letter}
                </div>
                <p className="text-[11px] md:text-xs leading-snug px-1 opacity-[0.92] max-w-[20rem] mx-auto">
                  {col.blurb}
                </p>
              </header>

              <div className="flex-1 flex flex-col px-2.5 pb-3 pt-2.5" style={{ backgroundColor: col.contentBg }}>
                <span
                  className="inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2.5"
                  style={{ backgroundColor: col.labelBg, color: col.labelText }}
                >
                  {col.label}
                </span>

                <div className="grid grid-cols-3 gap-1.5 flex-1 auto-rows-fr">
                  {data[col.key].map((item, index) => (
                    <textarea
                      key={`${col.key}-${index}`}
                      value={item}
                      onChange={(e) => updateItem(col.key, index, e.target.value)}
                      onKeyDown={(e) =>
                        deleteEmptyFieldRow(e, item, true, () => clearCell(col.key, index))
                      }
                      placeholder="…"
                      rows={2}
                      className={[
                        'w-full min-h-[52px] resize-none rounded-lg border-0 text-[11px] leading-tight p-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:opacity-60',
                        col.darkCards
                          ? 'focus:ring-cyan-400/50 placeholder:text-white/50'
                          : 'focus:ring-black/15 placeholder:text-black/40',
                      ].join(' ')}
                      style={{
                        backgroundColor: col.headerBg,
                        color: col.cardText,
                        caretColor: col.cardText,
                      }}
                      spellCheck={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
