'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type QuestionType = 
  | 'text' 
  | 'textarea' 
  | 'multiple-choice' 
  | 'checkbox' 
  | 'dropdown' 
  | 'rating' 
  | 'date' 
  | 'time' 
  | 'email' 
  | 'number' 
  | 'scale' 
  | 'matrix' 
  | 'file-upload' 
  | 'ranking' 
  | 'nps'

interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
  rows?: number
  columns?: string[]
  scaleLabels?: { min: string; max: string }
}

interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  design: {
    primaryColor: string
    backgroundColor: string
    fontFamily: string
    borderRadius: string
    showProgress: boolean
    allowBack: boolean
  }
  settings: {
    allowMultipleResponses: boolean
    requireEmail: boolean
    showThankYouPage: boolean
    thankYouMessage: string
    redirectUrl?: string
  }
  createdAt: string
  magicLink: string
}

export default function SurveyBuilder() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showResponses, setShowResponses] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const createNewSurvey = () => {
    const newSurvey: Survey = {
      id: Date.now().toString(),
      title: 'Nyt Spørgeskema',
      description: '',
      questions: [],
      design: {
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter',
        borderRadius: '8px',
        showProgress: true,
        allowBack: true
      },
      settings: {
        allowMultipleResponses: true,
        requireEmail: false,
        showThankYouPage: true,
        thankYouMessage: 'Tak for din besvarelse!',
        redirectUrl: ''
      },
      createdAt: new Date().toISOString(),
      magicLink: generateMagicLink()
    }
    setCurrentSurvey(newSurvey)
    setSurveys([...surveys, newSurvey])
    setShowBuilder(true)
  }

  const generateMagicLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let link = ''
    for (let i = 0; i < 16; i++) {
      link += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return link
  }

  const updateSurvey = (updates: Partial<Survey>) => {
    if (!currentSurvey) return
    const updated = { ...currentSurvey, ...updates }
    setCurrentSurvey(updated)
    setSurveys(surveys.map(s => s.id === updated.id ? updated : s))
  }

  const addQuestion = (type: QuestionType) => {
    if (!currentSurvey) return
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      required: false,
      ...(type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown' || type === 'ranking' ? {
        options: ['Option 1', 'Option 2']
      } : {}),
      ...(type === 'rating' || type === 'scale' ? {
        min: 1,
        max: 5
      } : {}),
      ...(type === 'matrix' ? {
        rows: ['Row 1', 'Row 2'],
        columns: ['Column 1', 'Column 2']
      } : {}),
      ...(type === 'scale' ? {
        scaleLabels: { min: 'Meget dårlig', max: 'Meget god' }
      } : {}),
      ...(type === 'textarea' ? {
        rows: 4
      } : {})
    }
    
    updateSurvey({
      questions: [...currentSurvey.questions, newQuestion]
    })
    setActiveQuestionId(newQuestion.id)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!currentSurvey) return
    updateSurvey({
      questions: currentSurvey.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    })
  }

  const deleteQuestion = (questionId: string) => {
    if (!currentSurvey) return
    updateSurvey({
      questions: currentSurvey.questions.filter(q => q.id !== questionId)
    })
    if (activeQuestionId === questionId) {
      setActiveQuestionId(null)
    }
  }

  const duplicateQuestion = (questionId: string) => {
    if (!currentSurvey) return
    const question = currentSurvey.questions.find(q => q.id === questionId)
    if (!question) return
    
    const duplicated: Question = {
      ...question,
      id: Date.now().toString(),
      title: question.title + ' (kopi)'
    }
    
    const index = currentSurvey.questions.findIndex(q => q.id === questionId)
    const newQuestions = [...currentSurvey.questions]
    newQuestions.splice(index + 1, 0, duplicated)
    
    updateSurvey({ questions: newQuestions })
  }

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    if (!currentSurvey) return
    const newQuestions = [...currentSurvey.questions]
    const [removed] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, removed)
    updateSurvey({ questions: newQuestions })
  }

  const copyMagicLink = () => {
    if (!currentSurvey) return
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${currentSurvey.magicLink}`
    navigator.clipboard.writeText(url)
    alert('Magic link kopieret!')
  }

  // Save surveys to localStorage
  useEffect(() => {
    if (surveys.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('forgelab_surveys', JSON.stringify(surveys))
    }
  }, [surveys])

  // Load surveys from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forgelab_surveys')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSurveys(parsed)
        } catch (err) {
          console.error('Fejl ved indlæsning af spørgeskemaer:', err)
        }
      }
    }
  }, [])

  const questionTypes = [
    { type: 'text' as QuestionType, label: 'Tekst', icon: '📝' },
    { type: 'textarea' as QuestionType, label: 'Lang tekst', icon: '📄' },
    { type: 'multiple-choice' as QuestionType, label: 'Flervalg', icon: '🔘' },
    { type: 'checkbox' as QuestionType, label: 'Checkbox', icon: '☑️' },
    { type: 'dropdown' as QuestionType, label: 'Dropdown', icon: '📋' },
    { type: 'rating' as QuestionType, label: 'Rating', icon: '⭐' },
    { type: 'scale' as QuestionType, label: 'Skala', icon: '📊' },
    { type: 'nps' as QuestionType, label: 'NPS', icon: '💯' },
    { type: 'date' as QuestionType, label: 'Dato', icon: '📅' },
    { type: 'time' as QuestionType, label: 'Tid', icon: '⏰' },
    { type: 'email' as QuestionType, label: 'Email', icon: '📧' },
    { type: 'number' as QuestionType, label: 'Nummer', icon: '🔢' },
    { type: 'matrix' as QuestionType, label: 'Matrix', icon: '📊' },
    { type: 'ranking' as QuestionType, label: 'Rangering', icon: '🔢' },
    { type: 'file-upload' as QuestionType, label: 'Fil upload', icon: '📎' }
  ]

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
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              Survey Builder
            </h1>
            <p className="text-gray-600">
              Byg avancerede spørgeskemaer med fuld design kontrol
            </p>
          </div>
        </header>

        {!showBuilder ? (
          /* Survey List */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Mine Spørgeskemaer</h2>
              <button
                onClick={createNewSurvey}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                + Opret Nyt Spørgeskema
              </button>
            </div>
            {surveys.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">Ingen spørgeskemaer endnu</p>
                <button
                  onClick={createNewSurvey}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Opret dit første spørgeskema
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentSurvey(survey)
                      setShowBuilder(true)
                    }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{survey.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{survey.questions.length} spørgsmål</p>
                    <div className="text-xs text-gray-500">
                      Magic Link: <code className="bg-gray-100 px-1 rounded">{survey.magicLink}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentSurvey ? (
          /* Builder View */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Question Types */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tilføj Spørgsmål</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {questionTypes.map((qt) => (
                    <button
                      key={qt.type}
                      onClick={() => addQuestion(qt.type)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <span>{qt.icon}</span>
                      <span className="text-sm">{qt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Questions List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                {/* Survey Settings */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <input
                    type="text"
                    value={currentSurvey.title}
                    onChange={(e) => updateSurvey({ title: e.target.value })}
                    placeholder="Spørgeskema titel..."
                    className="w-full text-2xl font-bold text-gray-900 mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                  />
                  <textarea
                    value={currentSurvey.description}
                    onChange={(e) => updateSurvey({ description: e.target.value })}
                    placeholder="Beskrivelse (valgfrit)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                  />
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {currentSurvey.questions.map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      index={index}
                      isActive={activeQuestionId === question.id}
                      onSelect={() => setActiveQuestionId(question.id)}
                      onUpdate={(updates) => updateQuestion(question.id, updates)}
                      onDelete={() => deleteQuestion(question.id)}
                      onDuplicate={() => duplicateQuestion(question.id)}
                      onMoveUp={index > 0 ? () => reorderQuestions(index, index - 1) : undefined}
                      onMoveDown={index < currentSurvey.questions.length - 1 ? () => reorderQuestions(index, index + 1) : undefined}
                    />
                  ))}
                  {currentSurvey.questions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>Ingen spørgsmål endnu. Tilføj dit første spørgsmål fra venstre sidebar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Settings & Actions */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Design Settings */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Design</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Primær farve</label>
                      <input
                        type="color"
                        value={currentSurvey.design.primaryColor}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, primaryColor: e.target.value }
                        })}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Baggrund</label>
                      <input
                        type="color"
                        value={currentSurvey.design.backgroundColor}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, backgroundColor: e.target.value }
                        })}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Skrifttype</label>
                      <select
                        value={currentSurvey.design.fontFamily}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, fontFamily: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm rounded border border-gray-300"
                      >
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Lato</option>
                        <option>Montserrat</option>
                        <option>Playfair Display</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Border radius</label>
                      <select
                        value={currentSurvey.design.borderRadius}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, borderRadius: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm rounded border border-gray-300"
                      >
                        <option value="0px">Ingen</option>
                        <option value="4px">Lille</option>
                        <option value="8px">Medium</option>
                        <option value="12px">Stor</option>
                        <option value="999px">Rund</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSurvey.design.showProgress}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, showProgress: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-700">Vis fremgang</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSurvey.design.allowBack}
                        onChange={(e) => updateSurvey({
                          design: { ...currentSurvey.design, allowBack: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-700">Tillad tilbage</label>
                    </div>
                  </div>
                </div>

                {/* Survey Settings */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Indstillinger</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSurvey.settings.allowMultipleResponses}
                        onChange={(e) => updateSurvey({
                          settings: { ...currentSurvey.settings, allowMultipleResponses: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-700">Tillad flere svar</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSurvey.settings.requireEmail}
                        onChange={(e) => updateSurvey({
                          settings: { ...currentSurvey.settings, requireEmail: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-700">Kræv email</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSurvey.settings.showThankYouPage}
                        onChange={(e) => updateSurvey({
                          settings: { ...currentSurvey.settings, showThankYouPage: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label className="text-xs text-gray-700">Vis tak side</label>
                    </div>
                    {currentSurvey.settings.showThankYouPage && (
                      <textarea
                        value={currentSurvey.settings.thankYouMessage}
                        onChange={(e) => updateSurvey({
                          settings: { ...currentSurvey.settings, thankYouMessage: e.target.value }
                        })}
                        placeholder="Tak besked..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded border border-gray-300 resize-none"
                      />
                    )}
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Redirect URL (valgfrit)</label>
                      <input
                        type="url"
                        value={currentSurvey.settings.redirectUrl || ''}
                        onChange={(e) => updateSurvey({
                          settings: { ...currentSurvey.settings, redirectUrl: e.target.value }
                        })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm rounded border border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Handlinger</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      👁️ Forhåndsvisning
                    </button>
                    <button
                      onClick={copyMagicLink}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                    >
                      🔗 Kopier Magic Link
                    </button>
                    <button
                      onClick={() => {
                        setShowBuilder(false)
                        setCurrentSurvey(null)
                        setShowPreview(false)
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      ← Tilbage til liste
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Preview Modal */}
        {showPreview && currentSurvey && (
          <SurveyPreview
            survey={currentSurvey}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  )
}

// Question Editor Component
function QuestionEditor({
  question,
  index,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown
}: {
  question: Question
  index: number
  isActive: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Question>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
            className="text-sm px-2 py-1 rounded border border-gray-300 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="text">Tekst</option>
            <option value="textarea">Lang tekst</option>
            <option value="multiple-choice">Flervalg</option>
            <option value="checkbox">Checkbox</option>
            <option value="dropdown">Dropdown</option>
            <option value="rating">Rating</option>
            <option value="scale">Skala</option>
            <option value="nps">NPS</option>
            <option value="date">Dato</option>
            <option value="time">Tid</option>
            <option value="email">Email</option>
            <option value="number">Nummer</option>
            <option value="matrix">Matrix</option>
            <option value="ranking">Rangering</option>
            <option value="file-upload">Fil upload</option>
          </select>
        </div>
        <div className="flex gap-1">
          {onMoveUp && (
            <button onClick={(e) => { e.stopPropagation(); onMoveUp() }} className="p-1 text-gray-500 hover:text-gray-700">↑</button>
          )}
          {onMoveDown && (
            <button onClick={(e) => { e.stopPropagation(); onMoveDown() }} className="p-1 text-gray-500 hover:text-gray-700">↓</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} className="p-1 text-gray-500 hover:text-gray-700">📋</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 text-red-500 hover:text-red-700">×</button>
        </div>
      </div>

      <input
        type="text"
        value={question.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Spørgsmål..."
        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Question-specific options */}
      {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown' || question.type === 'ranking') && (
        <div className="space-y-2 mb-3">
          {question.options?.map((option, optIndex) => (
            <div key={optIndex} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])]
                  newOptions[optIndex] = e.target.value
                  onUpdate({ options: newOptions })
                }}
                placeholder={`Option ${optIndex + 1}`}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newOptions = question.options?.filter((_, i) => i !== optIndex) || []
                  onUpdate({ options: newOptions.length > 0 ? newOptions : ['Option 1'] })
                }}
                className="text-red-500 text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ options: [...(question.options || []), ''] })
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Tilføj option
          </button>
        </div>
      )}

      {question.type === 'matrix' && (
        <div className="space-y-3 mb-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Rækker</label>
            {question.rows?.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={row}
                  onChange={(e) => {
                    const newRows = [...(question.rows || [])]
                    newRows[rowIndex] = e.target.value
                    onUpdate({ rows: newRows })
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newRows = question.rows?.filter((_, i) => i !== rowIndex) || []
                    onUpdate({ rows: newRows.length > 0 ? newRows : ['Row 1'] })
                  }}
                  className="text-red-500 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUpdate({ rows: [...(question.rows || []), ''] })
              }}
              className="text-xs text-blue-600"
            >
              + Tilføj række
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Kolonner</label>
            {question.columns?.map((col, colIndex) => (
              <div key={colIndex} className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={col}
                  onChange={(e) => {
                    const newCols = [...(question.columns || [])]
                    newCols[colIndex] = e.target.value
                    onUpdate({ columns: newCols })
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newCols = question.columns?.filter((_, i) => i !== colIndex) || []
                    onUpdate({ columns: newCols.length > 0 ? newCols : ['Column 1'] })
                  }}
                  className="text-red-500 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUpdate({ columns: [...(question.columns || []), ''] })
              }}
              className="text-xs text-blue-600"
            >
              + Tilføj kolonne
            </button>
          </div>
        </div>
      )}

      {(question.type === 'rating' || question.type === 'scale' || question.type === 'nps') && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Min</label>
            <input
              type="number"
              value={question.min || 1}
              onChange={(e) => onUpdate({ min: parseInt(e.target.value) || 1 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Max</label>
            <input
              type="number"
              value={question.max || 5}
              onChange={(e) => onUpdate({ max: parseInt(e.target.value) || 5 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {question.type === 'scale' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Min label</label>
            <input
              type="text"
              value={question.scaleLabels?.min || ''}
              onChange={(e) => onUpdate({
                scaleLabels: { ...question.scaleLabels, min: e.target.value, max: question.scaleLabels?.max || '' }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Max label</label>
            <input
              type="text"
              value={question.scaleLabels?.max || ''}
              onChange={(e) => onUpdate({
                scaleLabels: { ...question.scaleLabels, min: question.scaleLabels?.min || '', max: e.target.value }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {question.type === 'textarea' && (
        <div className="mb-3">
          <label className="block text-xs text-gray-700 mb-1">Antal rækker</label>
          <input
            type="number"
            value={question.rows || 4}
            onChange={(e) => onUpdate({ rows: parseInt(e.target.value) || 4 })}
            min="1"
            max="20"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="rounded"
          onClick={(e) => e.stopPropagation()}
        />
        <label className="text-sm text-gray-700">Påkrævet</label>
      </div>
    </div>
  )
}

// Preview Component
function SurveyPreview({
  survey,
  onClose
}: {
  survey: Survey
  onClose: () => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})

  const currentQuestion = survey.questions[currentQuestionIndex]
  const progress = survey.questions.length > 0 ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleNext = () => {
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    alert('Spørgeskema indsendt! (Preview mode)')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: survey.design.backgroundColor,
        fontFamily: survey.design.fontFamily,
        borderRadius: survey.design.borderRadius
      }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: survey.design.primaryColor }}>
              {survey.title}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          {survey.description && (
            <p className="text-gray-600 mb-6">{survey.description}</p>
          )}

          {survey.design.showProgress && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: survey.design.primaryColor
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Spørgsmål {currentQuestionIndex + 1} af {survey.questions.length}
              </p>
            </div>
          )}

          {currentQuestion && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {currentQuestion.title || 'Untitled Question'}
                {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
              </h3>

              {/* Render question based on type */}
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder || 'Dit svar...'}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder || 'Dit svar...'}
                  rows={currentQuestion.rows || 4}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none resize-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <label key={index} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{
                      borderColor: answers[currentQuestion.id] === option ? survey.design.primaryColor : '#E5E7EB',
                      borderRadius: survey.design.borderRadius
                    }}>
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'checkbox' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <label key={index} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{
                      borderColor: (answers[currentQuestion.id] as string[] || []).includes(option) ? survey.design.primaryColor : '#E5E7EB',
                      borderRadius: survey.design.borderRadius
                    }}>
                      <input
                        type="checkbox"
                        checked={(answers[currentQuestion.id] as string[] || []).includes(option)}
                        onChange={(e) => {
                          const current = (answers[currentQuestion.id] as string[] || [])
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter(o => o !== option)
                          handleAnswer(currentQuestion.id, updated)
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'dropdown' && (
                <select
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                >
                  <option value="">Vælg...</option>
                  {currentQuestion.options?.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {currentQuestion.type === 'rating' && (
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 }, (_, i) => {
                    const value = (currentQuestion.min || 1) + i
                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(currentQuestion.id, value)}
                        className={`text-3xl ${answers[currentQuestion.id] === value ? 'scale-125' : ''}`}
                        style={{
                          color: answers[currentQuestion.id] === value ? survey.design.primaryColor : '#D1D5DB'
                        }}
                      >
                        ⭐
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'scale' && (
                <div>
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>{currentQuestion.scaleLabels?.min || 'Min'}</span>
                    <span>{currentQuestion.scaleLabels?.max || 'Max'}</span>
                  </div>
                  <div className="flex gap-2 justify-between">
                    {Array.from({ length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 }, (_, i) => {
                      const value = (currentQuestion.min || 1) + i
                      return (
                        <button
                          key={value}
                          onClick={() => handleAnswer(currentQuestion.id, value)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium ${
                            answers[currentQuestion.id] === value ? 'text-white' : ''
                          }`}
                          style={{
                            backgroundColor: answers[currentQuestion.id] === value ? survey.design.primaryColor : 'transparent',
                            borderColor: survey.design.primaryColor,
                            borderRadius: survey.design.borderRadius
                          }}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentQuestion.type === 'nps' && (
                <div>
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Ikke sandsynligt</span>
                    <span>Meget sandsynligt</span>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(currentQuestion.id, i)}
                        className={`px-3 py-2 rounded-lg border-2 font-medium text-sm ${
                          answers[currentQuestion.id] === i ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: answers[currentQuestion.id] === i ? survey.design.primaryColor : 'transparent',
                          borderColor: survey.design.primaryColor,
                          borderRadius: survey.design.borderRadius
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === 'date' && (
                <input
                  type="date"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'time' && (
                <input
                  type="time"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'email' && (
                <input
                  type="email"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder="email@eksempel.dk"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'number' && (
                <input
                  type="number"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Nummer..."
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'matrix' && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border-2 p-2 text-left"></th>
                        {currentQuestion.columns?.map((col, index) => (
                          <th key={index} className="border-2 p-2 text-center">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentQuestion.rows?.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="border-2 p-2 font-medium">{row}</td>
                          {currentQuestion.columns?.map((col, colIndex) => (
                            <td key={colIndex} className="border-2 p-2 text-center">
                              <input
                                type="radio"
                                name={`${currentQuestion.id}-${rowIndex}`}
                                checked={answers[`${currentQuestion.id}-${rowIndex}`] === col}
                                onChange={() => handleAnswer(`${currentQuestion.id}-${rowIndex}`, col)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentQuestion.type === 'ranking' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => {
                    const rank = (answers[currentQuestion.id] as Record<string, number> || {})[option]
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 border-2 rounded-lg" style={{
                        borderColor: survey.design.primaryColor,
                        borderRadius: survey.design.borderRadius
                      }}>
                        <span className="font-medium w-8">{rank || '?'}</span>
                        <span className="flex-1">{option}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const current = answers[currentQuestion.id] as Record<string, number> || {}
                              const newRank = rank ? rank - 1 : (currentQuestion.options?.length || 1)
                              handleAnswer(currentQuestion.id, { ...current, [option]: Math.max(1, newRank) })
                            }}
                            className="px-2 py-1 text-sm rounded"
                            style={{ backgroundColor: survey.design.primaryColor, color: 'white' }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              const current = answers[currentQuestion.id] as Record<string, number> || {}
                              const newRank = rank ? rank + 1 : 1
                              handleAnswer(currentQuestion.id, { ...current, [option]: Math.min(currentQuestion.options?.length || 1, newRank) })
                            }}
                            className="px-2 py-1 text-sm rounded"
                            style={{ backgroundColor: survey.design.primaryColor, color: 'white' }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'file-upload' && (
                <div className="border-2 border-dashed p-8 text-center rounded-lg" style={{
                  borderColor: survey.design.primaryColor,
                  borderRadius: survey.design.borderRadius
                }}>
                  <input
                    type="file"
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.files?.[0]?.name || '')}
                    className="hidden"
                    id={`file-${currentQuestion.id}`}
                  />
                  <label
                    htmlFor={`file-${currentQuestion.id}`}
                    className="cursor-pointer"
                    style={{ color: survey.design.primaryColor }}
                  >
                    📎 Klik for at uploade fil
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={!survey.design.allowBack || currentQuestionIndex === 0}
              className="px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: survey.design.allowBack && currentQuestionIndex > 0 ? survey.design.primaryColor : '#E5E7EB',
                color: survey.design.allowBack && currentQuestionIndex > 0 ? 'white' : '#9CA3AF',
                borderRadius: survey.design.borderRadius
              }}
            >
              ← Tilbage
            </button>
            {currentQuestionIndex < survey.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-lg font-medium text-white"
                style={{
                  backgroundColor: survey.design.primaryColor,
                  borderRadius: survey.design.borderRadius
                }}
              >
                Næste →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-lg font-medium text-white"
                style={{
                  backgroundColor: survey.design.primaryColor,
                  borderRadius: survey.design.borderRadius
                }}
              >
                Indsend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
