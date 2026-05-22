'use client'

import { useCallback, useState } from 'react'
import { Crosshair, Info, MapPin, Plus, Quote, Trash2, Users } from 'lucide-react'
import ToolLayout from '@/components/ToolLayout'
import SmukModelContent from '@/components/tools/SmukModelContent'
import { useProjectToolData } from '@/lib/useProjectToolData'
import styles from './smp-model.module.css'

type SmpTab = 'segmentation' | 'targeting' | 'positioning'

type SmpSegment = {
  id: number
  name: string
  demography: string
  geography: string
  behavior: string
  psychography: string
}

type SmpPositioning = {
  brand: string
  category: string
  value: string
  alternative: string
  reasonToBelieve: string
}

type SmpData = {
  activeTab: SmpTab
  segments: SmpSegment[]
  selectedSegmentId: number | null
  showSmuk: boolean
  /** Målgruppe valgt via SMUK — bruges i positionering */
  targetingViaSmuk: boolean
  targetReason: string
  targetDoubt: string
  positioning: SmpPositioning
}

const INITIAL_SEGMENTS: SmpSegment[] = [
  {
    id: 1,
    name: 'Segment A',
    demography: 'Studerende på digitale uddannelser, typisk 20-30 år.',
    geography: 'Primært større studiebyer som København, Aarhus og Odense.',
    behavior:
      'Arbejder projektbaseret, bruger digitale værktøjer og skal hurtigt omsætte teori til praksis.',
    psychography: 'Vil gerne virke fagligt skarp, men gider ikke drukne i tunge modeller.',
  },
]

const DEFAULT_DATA: SmpData = {
  activeTab: 'segmentation',
  segments: INITIAL_SEGMENTS,
  selectedSegmentId: 1,
  showSmuk: false,
  targetingViaSmuk: false,
  targetReason:
    'Segmentet har et tydeligt behov, er relevant for løsningen og kan realistisk nås gennem de valgte kanaler.',
  targetDoubt:
    'Valget skal valideres med konkrete brugerdata, så målgruppen ikke kun bygger på antagelser.',
  positioning: {
    brand: 'ForgeLab',
    category: 'et digitalt metodeværktøj',
    value: 'gør SMP-modellen hurtig at udfylde og nem at bruge i opgaver',
    alternative: 'tunge skabeloner og løse noter',
    reasonToBelieve:
      'brugeren bliver guidet fra segmentering til målgruppevalg og videre til en klar positionering',
  },
}

function normalizeSmpData(raw: Partial<SmpData> | undefined): SmpData {
  if (!raw?.segments?.length) return DEFAULT_DATA
  return {
    activeTab: raw.activeTab ?? DEFAULT_DATA.activeTab,
    segments: raw.segments,
    selectedSegmentId:
      raw.selectedSegmentId != null &&
      raw.segments.some((s) => s.id === raw.selectedSegmentId)
        ? raw.selectedSegmentId
        : raw.segments[0]?.id ?? null,
    showSmuk: raw.showSmuk ?? false,
    targetingViaSmuk: raw.targetingViaSmuk ?? false,
    targetReason: raw.targetReason ?? DEFAULT_DATA.targetReason,
    targetDoubt: raw.targetDoubt ?? DEFAULT_DATA.targetDoubt,
    positioning: { ...DEFAULT_DATA.positioning, ...raw.positioning },
  }
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  height = 'h-20',
  focus = 'blue',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  height?: string
  focus?: 'blue' | 'emerald' | 'violet'
}) {
  const focusClass =
    focus === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500'
      : focus === 'violet'
        ? 'focus:border-violet-500 focus:ring-2 focus:ring-violet-500'
        : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500'

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none transition-all ${focusClass} ${height}`}
      />
    </div>
  )
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
      />
    </div>
  )
}

function SmpContent() {
  const [data, setDataState] = useState<SmpData>(DEFAULT_DATA)
  const setData = useCallback((next: SmpData) => setDataState(normalizeSmpData(next)), [])

  useProjectToolData<SmpData>('smp-model', data, setData)

  const {
    activeTab,
    segments,
    selectedSegmentId,
    showSmuk,
    targetingViaSmuk,
    targetReason,
    targetDoubt,
    positioning,
  } = data

  const linkedSelectedIndex =
    selectedSegmentId != null ? segments.findIndex((s) => s.id === selectedSegmentId) : -1
  const smukSelectedIndex = linkedSelectedIndex >= 0 ? linkedSelectedIndex : null

  const setActiveTab = (tab: SmpTab) => setData({ ...data, activeTab: tab })
  const setShowSmuk = (value: boolean) =>
    setData({
      ...data,
      showSmuk: value,
      targetingViaSmuk: value ? targetingViaSmuk : false,
    })
  const setTargetReason = (value: string) => setData({ ...data, targetReason: value })
  const setTargetDoubt = (value: string) => setData({ ...data, targetDoubt: value })

  const selectedSegment =
    segments.find((segment) => segment.id === selectedSegmentId) || segments[0]

  const statement = selectedSegment
    ? `Til ${selectedSegment.name.toLowerCase()}, tilbyder ${positioning.brand} ${positioning.category}, der ${positioning.value}. I modsætning til ${positioning.alternative}, fordi ${positioning.reasonToBelieve}.`
    : 'Vælg en målgruppe for at bygge dit positioneringsstatement.'

  function addSegment() {
    const newId = segments.length > 0 ? Math.max(...segments.map((s) => s.id)) + 1 : 1
    const newSegment: SmpSegment = {
      id: newId,
      name: `Nyt Segment ${newId}`,
      demography: '',
      geography: '',
      behavior: '',
      psychography: '',
    }
    setData({
      ...data,
      segments: [...segments, newSegment],
      selectedSegmentId: newId,
    })
  }

  function removeSegment(id: number) {
    if (segments.length <= 1) return
    const nextSegments = segments.filter((segment) => segment.id !== id)
    setData({
      ...data,
      segments: nextSegments,
      selectedSegmentId:
        selectedSegmentId === id ? nextSegments[0]?.id ?? null : selectedSegmentId,
    })
  }

  function updateSegment(id: number, field: keyof Omit<SmpSegment, 'id'>, value: string) {
    setData({
      ...data,
      segments: segments.map((segment) =>
        segment.id === id ? { ...segment, [field]: value } : segment,
      ),
    })
  }

  function updatePositioning(field: keyof SmpPositioning, value: string) {
    setData({
      ...data,
      positioning: { ...positioning, [field]: value },
    })
  }

  function handleSmukSelectionChange(index: number | null) {
    const segment = index != null ? segments[index] : undefined
    setData({
      ...data,
      selectedSegmentId: segment?.id ?? segments[0]?.id ?? null,
      targetingViaSmuk: true,
    })
  }

  function handleSmukSegmentNameChange(index: number, name: string) {
    const segment = segments[index]
    if (segment) updateSegment(segment.id, 'name', name)
  }

  function renderEmbeddedSmuk() {
    return (
      <div className="w-full overflow-hidden">
        <SmukModelContent
          embedded
          linkedSegments={{
            names: segments.map((s) => s.name),
            selectedIndex: smukSelectedIndex,
          }}
          onLinkedSelectionChange={handleSmukSelectionChange}
          onLinkedSegmentNameChange={handleSmukSegmentNameChange}
        />
      </div>
    )
  }

  function renderSegmentation() {
    return (
      <div className={`${styles.fadeIn} space-y-6 pb-10`}>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Users className="h-6 w-6 text-blue-500" />
              1. Segmentering (S)
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Opdel markedet i håndterbare grupper med ensartede behov, adfærd eller situationer.
            </p>
          </div>
          <button
            type="button"
            onClick={addSegment}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            Tilføj Segment
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                <input
                  type="text"
                  value={segment.name}
                  onChange={(event) => updateSegment(segment.id, 'name', event.target.value)}
                  className="w-3/4 rounded bg-transparent px-1 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => removeSegment(segment.id)}
                  className="p-1 text-slate-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={segments.length <= 1}
                  title="Slet segment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-grow space-y-4 p-4">
                <TextAreaField
                  label="Demografi (Hvem?)"
                  placeholder="Alder, køn, indkomst, uddannelse..."
                  value={segment.demography}
                  onChange={(value) => updateSegment(segment.id, 'demography', value)}
                />
                <TextAreaField
                  label="Geografi (Hvor?)"
                  placeholder="Land, region, by, land/by..."
                  value={segment.geography}
                  onChange={(value) => updateSegment(segment.id, 'geography', value)}
                  height="h-16"
                />
                <TextAreaField
                  label="Adfærd (Hvad gør de?)"
                  placeholder="Købsvaner, loyalitet, brugssituation..."
                  value={segment.behavior}
                  onChange={(value) => updateSegment(segment.id, 'behavior', value)}
                />
                <TextAreaField
                  label="Psykografi (Hvorfor?)"
                  placeholder="Livsstil, værdier, holdninger, interesser..."
                  value={segment.psychography}
                  onChange={(value) => updateSegment(segment.id, 'psychography', value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderTargeting() {
    return (
      <div className={`${styles.fadeIn} ${styles.targetingPanel} space-y-6 pb-10`}>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Crosshair className="h-6 w-6 text-emerald-500" />
              2. Målgruppevalg (M/T)
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {showSmuk
                ? 'Vurder segmenter med SMUK og vælg den mest attraktive målgruppe.'
                : 'Vælg målgruppen frit med argumentation — eller skift til SMUK for en systematisk scoring.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSmuk(!showSmuk)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              showSmuk
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {showSmuk ? 'Tilbage til fri målgruppevalg' : 'Tilføj SMUK-vurdering'}
          </button>
        </div>

        {showSmuk ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              <Info className="h-5 w-5 shrink-0 text-emerald-500" />
              <p>
                SMUK erstatter fri målgruppevalg her. Score segmenterne og vælg dit endelige segment
                i tabellen.
              </p>
            </div>
            {renderEmbeddedSmuk()}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 border-b border-slate-200 pb-2 font-semibold text-slate-800">
                Vælg målgruppe
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                {segments.map((segment) => {
                  const selected = selectedSegmentId === segment.id
                  return (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() =>
                        setData({
                          ...data,
                          selectedSegmentId: segment.id,
                          targetingViaSmuk: false,
                        })
                      }
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800">{segment.name}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            selected ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500'
                          }`}
                        >
                          {selected ? 'Valgt' : 'Vælg'}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm leading-6 text-slate-500 ${styles.lineClamp2}`}>
                        {segment.behavior ||
                          segment.psychography ||
                          segment.demography ||
                          'Udfyld segmentet i S-fanen først.'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                <span className="font-bold">Valgt målgruppe:</span>{' '}
                {selectedSegment?.name || 'Ingen valgt'}
              </div>

              <TextAreaField
                label="Hvorfor vælger vi denne målgruppe?"
                placeholder="Skriv den vigtigste argumentation for målgruppevalget..."
                value={targetReason}
                onChange={setTargetReason}
                height="h-28"
                focus="emerald"
              />

              <TextAreaField
                label="Hvad er den største usikkerhed?"
                placeholder="Hvilken antagelse skal valideres?"
                value={targetDoubt}
                onChange={setTargetDoubt}
                height="h-24"
                focus="emerald"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Output til opgave
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                  Vi vælger {selectedSegment?.name || '[målgruppe]'}, fordi{' '}
                  {targetReason || '[argumentation]'}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    )
  }

  function renderPositioning() {
    return (
      <div className={`${styles.fadeIn} space-y-6 pb-10`}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <MapPin className="h-6 w-6 text-violet-500" />
            3. Positionering (P)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Brug den valgte målgruppe fra M/T og byg et klart statement med værdi, alternativ og
            belæg.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 border-b border-slate-200 pb-2 font-semibold text-slate-800">
              Byggeklodser til positionering
            </h3>

            <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-violet-800">
              <span className="font-bold">Valgt målgruppe:</span>{' '}
              {selectedSegment?.name || 'Ingen valgt'}
              {targetingViaSmuk && selectedSegment && (
                <span className="mt-1 block text-xs font-medium text-emerald-700">
                  Valgt via SMUK-vurdering i målgruppevalg
                </span>
              )}
            </div>

            <InputField
              label="Brand / løsning"
              placeholder="F.eks. ForgeLab"
              value={positioning.brand}
              onChange={(value) => updatePositioning('brand', value)}
            />
            <InputField
              label="Kategori"
              placeholder="F.eks. et digitalt metodeværktøj"
              value={positioning.category}
              onChange={(value) => updatePositioning('category', value)}
            />
            <InputField
              label="Værdi / benefit"
              placeholder="F.eks. gør analysemodeller hurtige at bruge"
              value={positioning.value}
              onChange={(value) => updatePositioning('value', value)}
            />
            <InputField
              label="I modsætning til"
              placeholder="F.eks. tunge skabeloner og løse noter"
              value={positioning.alternative}
              onChange={(value) => updatePositioning('alternative', value)}
            />
            <InputField
              label="Fordi / reason to believe"
              placeholder="F.eks. værktøjet guider brugeren trin for trin"
              value={positioning.reasonToBelieve}
              onChange={(value) => updatePositioning('reasonToBelieve', value)}
            />
          </div>

          <div className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 shadow-sm">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Quote className="h-24 w-24 text-violet-500" />
            </div>

            <h3 className="relative z-10 mb-6 border-b border-violet-200 pb-2 text-sm font-semibold uppercase tracking-wider text-violet-500">
              Dit positioneringsstatement
            </h3>

            <div className="relative z-10 space-y-4 text-lg">
              <p className="leading-relaxed">
                <span className="font-medium text-slate-500">Til </span>
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {selectedSegment?.name || '[Målgruppe]'}
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-medium text-slate-500">tilbyder </span>
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {positioning.brand || '[Brand]'}
                </span>{' '}
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {positioning.category || '[Kategori]'}
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-medium text-slate-500">der </span>
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {positioning.value || '[Værdi]'}
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-medium text-slate-500">i modsætning til </span>
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {positioning.alternative || '[Alternativ]'}
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-medium text-slate-500">fordi </span>
                <span className="border-b-2 border-violet-300 font-bold text-slate-800">
                  {positioning.reasonToBelieve || '[Belæg]'}
                </span>
                .
              </p>
            </div>

            <div className="relative z-10 mt-8 rounded-xl border border-violet-100 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Samlet output
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{statement}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className={`${styles.smpShell} space-y-6`}>
      <div className="flex space-x-1 rounded-t-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('segmentation')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === 'segmentation'
              ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-500'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span className="mr-1 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold shadow-sm">
            S
          </span>
          Segmentering
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('targeting')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === 'targeting'
              ? 'border-b-2 border-emerald-500 bg-emerald-50 text-emerald-500'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span className="mr-1 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold shadow-sm">
            M
          </span>
          Målgruppevalg
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positioning')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === 'positioning'
              ? 'border-b-2 border-violet-500 bg-violet-50 text-violet-500'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <span className="mr-1 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold shadow-sm">
            P
          </span>
          Positionering
        </button>
      </div>

      {activeTab === 'segmentation' && renderSegmentation()}
      {activeTab === 'targeting' && renderTargeting()}
      {activeTab === 'positioning' && renderPositioning()}
      </div>
    </div>
  )
}

export default function SmpModelPage() {
  return (
    <ToolLayout
      title="SM/T/P Strategi Værktøj"
      description="Strukturer din markedsføring: fra segmenter til målgruppevalg og skarp positionering."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <SmpContent />
    </ToolLayout>
  )
}
