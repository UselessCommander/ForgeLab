'use client'

import { useState, useRef, Suspense } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  ListChecks,
  MessageSquare,
  Hash,
  ImagePlus,
  X,
  Palette,
  Link2,
  Copy,
  Check,
} from 'lucide-react'

export type SurveyDesign = {
  primaryColor: string
  backgroundColor: string
  cardStyle: string
  titleSize: string
}

const DESIGN_PRIMARY: { value: string; label: string; btn: string; ring: string; bg: string }[] = [
  { value: 'lime', label: 'Lime', btn: 'bg-lime-500 hover:bg-lime-600', ring: 'ring-lime-500', bg: 'bg-lime-50' },
  { value: 'violet', label: 'Violet', btn: 'bg-violet-500 hover:bg-violet-600', ring: 'ring-violet-500', bg: 'bg-violet-50' },
  { value: 'blue', label: 'Blå', btn: 'bg-blue-500 hover:bg-blue-600', ring: 'ring-blue-500', bg: 'bg-blue-50' },
  { value: 'rose', label: 'Rose', btn: 'bg-rose-500 hover:bg-rose-600', ring: 'ring-rose-500', bg: 'bg-rose-50' },
  { value: 'amber', label: 'Amber', btn: 'bg-amber-500 hover:bg-amber-600', ring: 'ring-amber-500', bg: 'bg-amber-50' },
  { value: 'emerald', label: 'Grøn', btn: 'bg-emerald-500 hover:bg-emerald-600', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
]

const DESIGN_BG = [
  { value: 'white', label: 'Hvid' },
  { value: 'gray', label: 'Lysegrå' },
  { value: 'gradient', label: 'Gradient' },
]

const DESIGN_CARD = [
  { value: 'flat', label: 'Flad' },
  { value: 'shadow', label: 'Skygge' },
  { value: 'bordered', label: 'Kant' },
]

const DEFAULT_DESIGN: SurveyDesign = {
  primaryColor: 'lime',
  backgroundColor: 'gray',
  cardStyle: 'shadow',
  titleSize: 'normal',
}

function getPrimaryClasses(primaryColor: string) {
  const c = DESIGN_PRIMARY.find((x) => x.value === primaryColor) ?? DESIGN_PRIMARY[0]
  return { btn: c.btn, ring: c.ring, bg: c.bg }
}

type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'scale'

interface SurveyQuestion {
  id: string
  type: QuestionType
  title: string
  options: string[]
  required: boolean
  scaleMax: number
  /** Billede til spørgsmålet (URL eller data URL) */
  image?: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isValidImageUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'short_text', label: 'Kort tekst', icon: <FileText className="w-4 h-4" /> },
  { value: 'long_text', label: 'Lang tekst (afsnit)', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'single_choice', label: 'Ét valg (radio)', icon: <ListChecks className="w-4 h-4" /> },
  { value: 'multiple_choice', label: 'Flere valg (checkbox)', icon: <ListChecks className="w-4 h-4" /> },
  { value: 'scale', label: 'Skala (1–N)', icon: <Hash className="w-4 h-4" /> },
]

const defaultQuestion = (): SurveyQuestion => ({
  id: crypto.randomUUID(),
  type: 'short_text',
  title: '',
  options: ['Valg 1', 'Valg 2'],
  required: false,
  scaleMax: 5,
})

function SurveyTemplateContent() {
  const [surveyTitle, setSurveyTitle] = useState('Min undersøgelse')
  const [surveyDescription, setSurveyDescription] = useState('')
  const [surveyImage, setSurveyImage] = useState<string>('')
  const [surveyImageUrlInput, setSurveyImageUrlInput] = useState('')
  const surveyFileInputRef = useRef<HTMLInputElement>(null)
  const [design, setDesign] = useState<SurveyDesign>(DEFAULT_DESIGN)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [questionImageUploadId, setQuestionImageUploadId] = useState<string | null>(null)
  const [questionImageUrlInputs, setQuestionImageUrlInputs] = useState<Record<string, string>>({})
  const questionFileInputRef = useRef<HTMLInputElement>(null)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)

  // Combine survey data into one state object for saving (exclude UI-only states)
  const surveyData = { surveyTitle, surveyDescription, surveyImage, design, questions }
  const setSurveyData = (data: typeof surveyData) => {
    setSurveyTitle(data.surveyTitle)
    setSurveyDescription(data.surveyDescription)
    setSurveyImage(data.surveyImage)
    setDesign(data.design)
    setQuestions(data.questions)
  }

  // Automatically save/load data when in a project
  useProjectToolData('survey-template', surveyData, setSurveyData)

  const handleQuestionImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = questionImageUploadId
    setQuestionImageUploadId(null)
    if (!id || !file?.type.startsWith('image/')) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      updateQuestion(id, { image: dataUrl })
    } catch {
      // ignore
    }
    e.target.value = ''
  }

  const handleSurveyImageUrl = () => {
    const url = surveyImageUrlInput.trim()
    if (url && isValidImageUrl(url)) {
      setSurveyImage(url)
      setSurveyImageUrlInput('')
    }
  }

  const handleSurveyImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file?.type.startsWith('image/')) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setSurveyImage(dataUrl)
    } catch {
      // ignore
    }
    e.target.value = ''
  }

  const generateMagicLink = async () => {
    setLinkError(null)
    setLinkLoading(true)
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: surveyTitle,
          description: surveyDescription,
          header_image: surveyImage || null,
          design,
          questions,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLinkError(data.error || 'Kunne ikke oprette link')
        return
      }
      setMagicLink(data.magicLink)
      try {
        await navigator.clipboard.writeText(data.magicLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch {
        // ignore
      }
    } catch {
      setLinkError('Netværksfejl. Tjek at Supabase er konfigureret.')
    } finally {
      setLinkLoading(false)
    }
  }

  const copyMagicLink = () => {
    if (!magicLink) return
    navigator.clipboard.writeText(magicLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const addQuestion = () => {
    setQuestions((q) => [...q, defaultQuestion()])
  }

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setQuestions((q) =>
      q.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const removeQuestion = (id: string) => {
    setQuestions((q) => q.filter((item) => item.id !== id))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return
    setQuestions((q) => {
      const copy = [...q]
      ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
      return copy
    })
  }

  const addOption = (questionId: string) => {
    setQuestions((q) =>
      q.map((item) =>
        item.id === questionId
          ? { ...item, options: [...item.options, `Valg ${item.options.length + 1}`] }
          : item
      )
    )
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((q) =>
      q.map((item) => {
        if (item.id !== questionId) return item
        const opts = [...item.options]
        opts[optionIndex] = value
        return { ...item, options: opts }
      })
    )
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions((q) =>
      q.map((item) => {
        if (item.id !== questionId) return item
        const opts = item.options.filter((_, i) => i !== optionIndex)
        return { ...item, options: opts.length >= 1 ? opts : ['Valg 1'] }
      })
    )
  }

  return (
    <ToolLayout
      title="Survey Template"
      description="Byg undersøgelser med forskellige spørgsmålstyper: tekst, flervalgs- og skala-spørgsmål."
    >
      <div className="space-y-6">
        {/* Survey header */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Undersøgelsens titel</label>
          <input
            type="text"
            value={surveyTitle}
            onChange={(e) => setSurveyTitle(e.target.value)}
            placeholder="Fx. Kundetilfredshed 2025"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent mb-4"
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse (valgfri)</label>
          <textarea
            value={surveyDescription}
            onChange={(e) => setSurveyDescription(e.target.value)}
            placeholder="Kort intro til respondenten..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none mb-4"
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">Billede (valgfri)</label>
          <div className="flex flex-wrap gap-2 items-start">
            <input
              type="url"
              value={surveyImageUrlInput}
              onChange={(e) => setSurveyImageUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSurveyImageUrl())}
              placeholder="Indsæt billede-URL"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
            <button
              type="button"
              onClick={handleSurveyImageUrl}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Tilføj URL
            </button>
            <input
              ref={surveyFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSurveyImageFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => surveyFileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <ImagePlus className="w-4 h-4" /> Upload billede
            </button>
          </div>
          {surveyImage && (
            <div className="mt-3 relative inline-block">
              <img
                src={surveyImage}
                alt="Undersøgelsens billede"
                className="max-h-48 rounded-lg border border-gray-200 object-contain"
              />
              <button
                type="button"
                onClick={() => setSurveyImage('')}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                aria-label="Fjern billede"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Design */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setDesignOpen((o) => !o)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Palette className="w-4 h-4" />
              Design
              <span className="text-gray-400">{designOpen ? '▼' : '▶'}</span>
            </button>
            {designOpen && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Accentfarve</p>
                  <div className="flex flex-wrap gap-2">
                    {DESIGN_PRIMARY.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setDesign((d) => ({ ...d, primaryColor: c.value }))}
                        className={`px-2 py-1 text-xs rounded border ${
                          design.primaryColor === c.value
                            ? 'border-gray-900 bg-gray-100 font-medium'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Baggrund</p>
                  <div className="flex flex-wrap gap-2">
                    {DESIGN_BG.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => setDesign((d) => ({ ...d, backgroundColor: b.value }))}
                        className={`px-3 py-1.5 text-xs rounded-lg border ${
                          design.backgroundColor === b.value
                            ? 'border-gray-900 bg-gray-100'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Kortstil</p>
                  <div className="flex flex-wrap gap-2">
                    {DESIGN_CARD.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setDesign((d) => ({ ...d, cardStyle: c.value }))}
                        className={`px-3 py-1.5 text-xs rounded-lg border ${
                          design.cardStyle === c.value
                            ? 'border-gray-900 bg-gray-100'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Magic link */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Delingslink til svarpersoner
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Generer et link som andre kan åbne for at besvare undersøgelsen. Linket gemmes på serveren.
          </p>
          {linkError && (
            <p className="text-sm text-red-600 mb-3">{linkError}</p>
          )}
          {magicLink ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={magicLink}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                type="button"
                onClick={copyMagicLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Kopieret' : 'Kopier'}
              </button>
              <button
                type="button"
                onClick={generateMagicLink}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Nyt link
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={generateMagicLink}
              disabled={linkLoading || questions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500 text-white rounded-lg font-medium hover:bg-lime-600 disabled:opacity-50 disabled:pointer-events-none"
            >
              {linkLoading ? 'Opretter...' : 'Generer magic link'}
            </button>
          )}
        </div>

        <input
          ref={questionFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleQuestionImageFile}
          className="hidden"
          aria-hidden
        />

        {/* Toggle preview */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Spørgsmål</h2>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            {showPreview ? 'Rediger skabelon' : 'Forhåndsvis'}
          </button>
        </div>

        {showPreview ? (
          /* Preview: how the survey looks for respondents */
          (() => {
            const bgClass =
              design.backgroundColor === 'white'
                ? 'bg-white'
                : design.backgroundColor === 'gradient'
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100'
                  : 'bg-gray-50'
            const cardClass =
              design.cardStyle === 'flat'
                ? 'bg-white'
                : design.cardStyle === 'bordered'
                  ? 'bg-white border-2 border-gray-200'
                  : 'bg-white shadow-lg border border-gray-200'
            const primary = getPrimaryClasses(design.primaryColor)
            return (
          <div className={`${bgClass} rounded-xl p-6 space-y-6`}>
            <div className={`${cardClass} rounded-xl p-6 space-y-6`}>
            <div className="border-b border-gray-200 pb-4">
              {surveyImage && (
                <img
                  src={surveyImage}
                  alt=""
                  className="w-full max-h-64 object-contain rounded-lg mb-4 bg-gray-50"
                />
              )}
              <h3 className="text-xl font-semibold text-gray-900">{surveyTitle || 'Untitled survey'}</h3>
              {surveyDescription && (
                <p className="text-gray-600 mt-1 text-sm">{surveyDescription}</p>
              )}
            </div>
            {questions.length === 0 ? (
              <p className="text-gray-500 text-sm">Ingen spørgsmål endnu. Tilføj spørgsmål i redigeringstilstand.</p>
            ) : (
              questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  {q.image && (
                    <img
                      src={q.image}
                      alt=""
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                  )}
                  <p className="font-medium text-gray-900">
                    {index + 1}. {q.title || 'Spørgsmål uden titel'}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {q.type === 'short_text' && (
                    <input
                      type="text"
                      placeholder="Kort svar..."
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                    />
                  )}
                  {q.type === 'long_text' && (
                    <textarea
                      placeholder="Langt svar..."
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm resize-none"
                    />
                  )}
                  {q.type === 'single_choice' && (
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="radio" name={`preview-${q.id}`} disabled className="rounded-full" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" disabled className="rounded" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'scale' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.from({ length: q.scaleMax }, (_, i) => (
                        <label key={i} className="flex items-center gap-1 text-sm text-gray-600">
                          <input type="radio" name={`preview-scale-${q.id}`} disabled className="rounded-full" />
                          {i + 1}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            </div>
            </div>
            )
          })()
        ) : (
          /* Builder: edit questions */
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-white rounded-xl p-4 shadow border border-gray-200 space-y-4"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col text-gray-400 pt-1">
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                      aria-label="Flyt op"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                      aria-label="Flyt ned"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(q.id, { type: e.target.value as QuestionType })
                        }
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            updateQuestion(q.id, { required: e.target.checked })
                          }
                          className="rounded"
                        />
                        Påkrævet
                      </label>
                    </div>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                      placeholder="Spørgsmålstekst"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Billede til spørgsmål (valgfri)</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="url"
                          value={questionImageUrlInputs[q.id] ?? ''}
                          onChange={(e) =>
                            setQuestionImageUrlInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Billede-URL"
                          className="flex-1 min-w-[140px] px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return
                            e.preventDefault()
                            const url = (questionImageUrlInputs[q.id] ?? '').trim()
                            if (url && isValidImageUrl(url)) {
                              updateQuestion(q.id, { image: url })
                              setQuestionImageUrlInputs((prev) => ({ ...prev, [q.id]: '' }))
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = (questionImageUrlInputs[q.id] ?? '').trim()
                            if (url && isValidImageUrl(url)) {
                              updateQuestion(q.id, { image: url })
                              setQuestionImageUrlInputs((prev) => ({ ...prev, [q.id]: '' }))
                            }
                          }}
                          className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          Tilføj URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionImageUploadId(q.id)
                            questionFileInputRef.current?.click()
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          <ImagePlus className="w-3.5 h-3.5" /> Upload
                        </button>
                        {q.image && (
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { image: undefined })}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Fjern billede
                          </button>
                        )}
                      </div>
                      {q.image && (
                        <div className="relative inline-block mt-1">
                          <img
                            src={q.image}
                            alt=""
                            className="max-h-24 rounded border border-gray-200 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                      <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                        <p className="text-xs font-medium text-gray-500">Valgmuligheder</p>
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(q.id, i, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, i)}
                              disabled={q.options.length <= 1}
                              className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30"
                              aria-label="Fjern valg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="text-sm text-lime-600 hover:text-lime-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Tilføj valg
                        </button>
                      </div>
                    )}
                    {q.type === 'scale' && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Skala 1 –</label>
                        <select
                          value={q.scaleMax}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              scaleMax: Number(e.target.value),
                            })
                          }
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                        >
                          {[3, 5, 7, 10].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Slet spørgsmål"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50/50 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Tilføj spørgsmål
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

export default function SurveyTemplatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">Indlæser...</div>}>
      <SurveyTemplateContent />
    </Suspense>
  )
}
