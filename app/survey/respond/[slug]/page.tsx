'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'scale'

interface SurveyQuestion {
  id: string
  type: QuestionType
  title: string
  options: string[]
  required: boolean
  scaleMax: number
  image?: string
}

interface SurveyDesign {
  primaryColor: string
  backgroundColor: string
  cardStyle: string
  titleSize?: string
}

interface Survey {
  slug: string
  title: string
  description: string
  header_image: string | null
  design: SurveyDesign
  questions: SurveyQuestion[]
}

const PRIMARY_CLASSES: Record<string, { btn: string; ring: string }> = {
  lime: { btn: 'bg-lime-500 hover:bg-lime-600', ring: 'ring-lime-500 focus:ring-lime-500' },
  violet: { btn: 'bg-violet-500 hover:bg-violet-600', ring: 'ring-violet-500 focus:ring-violet-500' },
  blue: { btn: 'bg-blue-500 hover:bg-blue-600', ring: 'ring-blue-500 focus:ring-blue-500' },
  rose: { btn: 'bg-rose-500 hover:bg-rose-600', ring: 'ring-rose-500 focus:ring-rose-500' },
  amber: { btn: 'bg-amber-500 hover:bg-amber-600', ring: 'ring-amber-500 focus:ring-amber-500' },
  emerald: { btn: 'bg-emerald-500 hover:bg-emerald-600', ring: 'ring-emerald-500 focus:ring-emerald-500' },
}

const DEFAULT_DESIGN: SurveyDesign = {
  primaryColor: 'lime',
  backgroundColor: 'gray',
  cardStyle: 'shadow',
  titleSize: 'normal',
}

export default function SurveyRespondPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/surveys/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Undersøgelse ikke fundet')
        return res.json()
      })
      .then((data) => {
        setSurvey(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Undersøgelsen kunne ikke hentes.')
        setLoading(false)
      })
  }, [slug])

  const design = survey?.design ?? DEFAULT_DESIGN
  const primary = PRIMARY_CLASSES[design.primaryColor] ?? PRIMARY_CLASSES.lime
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

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!survey) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/surveys/${slug}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kunne ikke indsende')
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Der opstod en fejl')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Henter undersøgelse...</p>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <p className="text-gray-700 mb-4">{error ?? 'Undersøgelse ikke fundet'}</p>
        <Link href="/" className="text-violet-600 hover:underline">
          Til forsiden
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-6`}>
        <div className={`${cardClass} rounded-2xl p-8 max-w-md w-full text-center`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tak for din besvarelse</h2>
          <p className="text-gray-600">Dine svar er gemt.</p>
          <Link href="/" className="inline-block mt-6 text-violet-600 hover:underline">
            Til forsiden
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass} py-8 px-4`}>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`${cardClass} rounded-2xl p-6 md:p-8 space-y-4`}>
            {survey.header_image && (
              <img
                src={survey.header_image}
                alt=""
                className="w-full max-h-64 object-contain rounded-lg bg-gray-50 mb-4"
              />
            )}
            <h1 className="text-2xl font-semibold text-gray-900">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
          </div>

          {survey.questions.map((q, index) => (
            <div key={q.id} className={`${cardClass} rounded-2xl p-6 md:p-8 space-y-3`}>
              {q.image && (
                <img
                  src={q.image}
                  alt=""
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
              )}
              <label className="block font-medium text-gray-900">
                {index + 1}. {q.title}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {q.type === 'short_text' && (
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${primary.ring} focus:border-transparent`}
                />
              )}

              {q.type === 'long_text' && (
                <textarea
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  rows={4}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${primary.ring} focus:border-transparent resize-none`}
                />
              )}

              {q.type === 'single_choice' && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={(answers[q.id] as string) === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        required={q.required}
                        className={`rounded-full ${primary.ring}`}
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const arr = (answers[q.id] as string[]) ?? []
                    const checked = arr.includes(opt)
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? arr.filter((x) => x !== opt)
                              : [...arr, opt]
                            setAnswer(q.id, next)
                          }}
                          className={`rounded ${primary.ring}`}
                        />
                        <span className="text-gray-700">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'scale' && (
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: q.scaleMax }, (_, i) => {
                    const val = String(i + 1)
                    return (
                      <label key={i} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          value={val}
                          checked={(answers[q.id] as string) === val}
                          onChange={() => setAnswer(q.id, val)}
                          required={q.required}
                          className={`rounded-full ${primary.ring}`}
                        />
                        <span className="text-gray-600">{i + 1}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {submitError && (
            <p className="text-red-600 text-sm">{submitError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 text-white rounded-xl font-medium ${primary.btn} disabled:opacity-50`}
            >
              {submitting ? 'Sender...' : 'Send svar'}
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-2xl mx-auto mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ForgeLabLogo size={20} />
          ForgeLab
        </Link>
      </div>
    </div>
  )
}
