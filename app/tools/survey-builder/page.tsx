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
  | 'slider'
  | 'yes-no'
  | 'phone'
  | 'url'
  | 'address'
  | 'signature'
  | 'image-choice'
  | 'consent'
  | 'hidden'
  | 'calculation'

interface ConditionalLogic {
  type: 'show' | 'hide' | 'skip'
  conditions: {
    questionId: string
    operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than'
    value: any
  }[]
  logicOperator: 'and' | 'or'
}

interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
  rows?: number | string[]
  columns?: string[]
  scaleLabels?: { min: string; max: string }
  step?: number
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
  }
  conditionalLogic?: ConditionalLogic
  randomizeOptions?: boolean
  allowOther?: boolean
  imageOptions?: { label: string; url: string }[]
  calculation?: string
  hiddenValue?: string
}

interface QuestionGroup {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface Survey {
  id: string
  title: string
  description: string
  groups: QuestionGroup[]
  design: {
    primaryColor: string
    secondaryColor?: string
    backgroundColor: string
    textColor: string
    fontFamily: string
    fontSize: string
    borderRadius: string
    showProgress: boolean
    progressType: 'percentage' | 'fraction' | 'dots'
    allowBack: boolean
    showQuestionNumbers: boolean
    logo?: string
    backgroundImage?: string
    customCSS?: string
    theme: 'light' | 'dark' | 'custom'
  }
  settings: {
    allowMultipleResponses: boolean
    requireEmail: boolean
    requireName: boolean
    showThankYouPage: boolean
    thankYouMessage: string
    redirectUrl?: string
    password?: string
    expirationDate?: string
    responseLimit?: number
    timeLimit?: number
    randomizeQuestions: boolean
    randomizeOptions: boolean
    showProgressBar: boolean
    allowSaveProgress: boolean
    notificationEmail?: string
  }
  createdAt: string
  updatedAt: string
  magicLink: string
}

export default function SurveyBuilder() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showResponses, setShowResponses] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'builder' | 'logic' | 'design' | 'settings'>('builder')

  const createNewSurvey = () => {
    const newSurvey: Survey = {
      id: Date.now().toString(),
      title: 'Nyt Spørgeskema',
      description: '',
      groups: [{
        id: Date.now().toString() + '_group',
        title: 'Sektion 1',
        description: '',
        questions: []
      }],
      design: {
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        fontSize: '16px',
        borderRadius: '8px',
        showProgress: true,
        progressType: 'percentage',
        allowBack: true,
        showQuestionNumbers: true,
        theme: 'light'
      },
      settings: {
        allowMultipleResponses: true,
        requireEmail: false,
        requireName: false,
        showThankYouPage: true,
        thankYouMessage: 'Tak for din besvarelse!',
        redirectUrl: '',
        randomizeQuestions: false,
        randomizeOptions: false,
        showProgressBar: true,
        allowSaveProgress: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      magicLink: generateMagicLink()
    }
    setCurrentSurvey(newSurvey)
    setSurveys([...surveys, newSurvey])
    setShowBuilder(true)
    setActiveGroupId(newSurvey.groups[0].id)
  }

  const generateMagicLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let link = ''
    for (let i = 0; i < 20; i++) {
      link += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return link
  }

  const updateSurvey = (updates: Partial<Survey>) => {
    if (!currentSurvey) return
    const updated = { ...currentSurvey, ...updates, updatedAt: new Date().toISOString() }
    setCurrentSurvey(updated)
    setSurveys(surveys.map(s => s.id === updated.id ? updated : s))
  }

  const addGroup = () => {
    if (!currentSurvey) return
    const newGroup: QuestionGroup = {
      id: Date.now().toString() + '_group',
      title: `Sektion ${currentSurvey.groups.length + 1}`,
      description: '',
      questions: []
    }
    updateSurvey({
      groups: [...currentSurvey.groups, newGroup]
    })
    setActiveGroupId(newGroup.id)
  }

  const updateGroup = (groupId: string, updates: Partial<QuestionGroup>) => {
    if (!currentSurvey) return
    updateSurvey({
      groups: currentSurvey.groups.map(g =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    })
  }

  const deleteGroup = (groupId: string) => {
    if (!currentSurvey || currentSurvey.groups.length <= 1) return
    updateSurvey({
      groups: currentSurvey.groups.filter(g => g.id !== groupId)
    })
    if (activeGroupId === groupId) {
      setActiveGroupId(currentSurvey.groups.find(g => g.id !== groupId)?.id || null)
    }
  }

  const addQuestion = (type: QuestionType, groupId?: string) => {
    if (!currentSurvey) return
    const targetGroupId = groupId || activeGroupId || currentSurvey.groups[0].id
    const group = currentSurvey.groups.find(g => g.id === targetGroupId)
    if (!group) return
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      required: false,
      ...(type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown' || type === 'ranking' || type === 'image-choice' ? {
        options: ['Option 1', 'Option 2']
      } : {}),
      ...(type === 'rating' || type === 'scale' || type === 'slider' ? {
        min: 1,
        max: 5
      } : {}),
      ...(type === 'slider' ? {
        step: 1
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
      } : {}),
      ...(type === 'image-choice' ? {
        imageOptions: [
          { label: 'Option 1', url: '' },
          { label: 'Option 2', url: '' }
        ]
      } : {}),
      ...(type === 'hidden' ? {
        hiddenValue: ''
      } : {}),
      ...(type === 'calculation' ? {
        calculation: ''
      } : {})
    }
    
    const updatedGroups = currentSurvey.groups.map(g =>
      g.id === targetGroupId
        ? { ...g, questions: [...g.questions, newQuestion] }
        : g
    )
    
    updateSurvey({ groups: updatedGroups })
    setActiveQuestionId(newQuestion.id)
  }

  const updateQuestion = (groupId: string, questionId: string, updates: Partial<Question>) => {
    if (!currentSurvey) return
    const updatedGroups = currentSurvey.groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            questions: g.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            )
          }
        : g
    )
    updateSurvey({ groups: updatedGroups })
  }

  const deleteQuestion = (groupId: string, questionId: string) => {
    if (!currentSurvey) return
    const updatedGroups = currentSurvey.groups.map(g =>
      g.id === groupId
        ? { ...g, questions: g.questions.filter(q => q.id !== questionId) }
        : g
    )
    updateSurvey({ groups: updatedGroups })
    if (activeQuestionId === questionId) {
      setActiveQuestionId(null)
    }
  }

  const duplicateQuestion = (groupId: string, questionId: string) => {
    if (!currentSurvey) return
    const group = currentSurvey.groups.find(g => g.id === groupId)
    const question = group?.questions.find(q => q.id === questionId)
    if (!question || !group) return
    
    const duplicated: Question = {
      ...question,
      id: Date.now().toString(),
      title: question.title + ' (kopi)'
    }
    
    const index = group.questions.findIndex(q => q.id === questionId)
    const updatedGroups = currentSurvey.groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            questions: [
              ...g.questions.slice(0, index + 1),
              duplicated,
              ...g.questions.slice(index + 1)
            ]
          }
        : g
    )
    
    updateSurvey({ groups: updatedGroups })
  }

  const reorderQuestions = (groupId: string, fromIndex: number, toIndex: number) => {
    if (!currentSurvey) return
    const group = currentSurvey.groups.find(g => g.id === groupId)
    if (!group) return
    
    const newQuestions = [...group.questions]
    const [removed] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, removed)
    
    const updatedGroups = currentSurvey.groups.map(g =>
      g.id === groupId ? { ...g, questions: newQuestions } : g
    )
    
    updateSurvey({ groups: updatedGroups })
  }

  const copyMagicLink = () => {
    if (!currentSurvey) return
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${currentSurvey.magicLink}`
    navigator.clipboard.writeText(url)
    alert('Magic link kopieret!')
  }

  const exportResponses = () => {
    if (!currentSurvey || responses.length === 0) return
    
    const headers = ['Timestamp', 'Email', ...currentSurvey.groups.flatMap(g => 
      g.questions.map(q => q.title || 'Untitled')
    )]
    
    const rows = responses.map(r => {
      const row = [
        new Date(r.submittedAt).toLocaleString('da-DK'),
        r.email || '',
        ...currentSurvey.groups.flatMap(g =>
          g.questions.map(q => {
            const answer = r.answers[q.id]
            if (Array.isArray(answer)) return answer.join('; ')
            if (typeof answer === 'object' && answer !== null) {
              return JSON.stringify(answer)
            }
            return String(answer || '')
          })
        )
      ]
      return row
    })
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `survey-responses-${currentSurvey.magicLink}-${Date.now()}.csv`
    link.click()
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

  // Load responses when survey is selected
  useEffect(() => {
    if (currentSurvey && typeof window !== 'undefined') {
      const savedResponses = localStorage.getItem(`forgelab_responses_${currentSurvey.magicLink}`)
      if (savedResponses) {
        try {
          setResponses(JSON.parse(savedResponses))
        } catch (err) {
          console.error('Fejl ved indlæsning af svar:', err)
        }
      } else {
        setResponses([])
      }
    }
  }, [currentSurvey])

  const questionTypes = [
    { type: 'text' as QuestionType, label: 'Tekst', icon: '📝', category: 'basic' },
    { type: 'textarea' as QuestionType, label: 'Lang tekst', icon: '📄', category: 'basic' },
    { type: 'multiple-choice' as QuestionType, label: 'Flervalg', icon: '🔘', category: 'choice' },
    { type: 'checkbox' as QuestionType, label: 'Checkbox', icon: '☑️', category: 'choice' },
    { type: 'dropdown' as QuestionType, label: 'Dropdown', icon: '📋', category: 'choice' },
    { type: 'image-choice' as QuestionType, label: 'Billede valg', icon: '🖼️', category: 'choice' },
    { type: 'yes-no' as QuestionType, label: 'Ja/Nej', icon: '✅', category: 'choice' },
    { type: 'rating' as QuestionType, label: 'Rating', icon: '⭐', category: 'rating' },
    { type: 'scale' as QuestionType, label: 'Skala', icon: '📊', category: 'rating' },
    { type: 'slider' as QuestionType, label: 'Slider', icon: '🎚️', category: 'rating' },
    { type: 'nps' as QuestionType, label: 'NPS', icon: '💯', category: 'rating' },
    { type: 'matrix' as QuestionType, label: 'Matrix', icon: '📊', category: 'advanced' },
    { type: 'ranking' as QuestionType, label: 'Rangering', icon: '🔢', category: 'advanced' },
    { type: 'date' as QuestionType, label: 'Dato', icon: '📅', category: 'input' },
    { type: 'time' as QuestionType, label: 'Tid', icon: '⏰', category: 'input' },
    { type: 'email' as QuestionType, label: 'Email', icon: '📧', category: 'input' },
    { type: 'phone' as QuestionType, label: 'Telefon', icon: '📱', category: 'input' },
    { type: 'url' as QuestionType, label: 'URL', icon: '🔗', category: 'input' },
    { type: 'number' as QuestionType, label: 'Nummer', icon: '🔢', category: 'input' },
    { type: 'address' as QuestionType, label: 'Adresse', icon: '📍', category: 'input' },
    { type: 'file-upload' as QuestionType, label: 'Fil upload', icon: '📎', category: 'advanced' },
    { type: 'signature' as QuestionType, label: 'Signatur', icon: '✍️', category: 'advanced' },
    { type: 'consent' as QuestionType, label: 'Samtykke', icon: '📜', category: 'advanced' },
    { type: 'hidden' as QuestionType, label: 'Skjult felt', icon: '👁️‍🗨️', category: 'advanced' },
    { type: 'calculation' as QuestionType, label: 'Beregning', icon: '🧮', category: 'advanced' }
  ]

  const allQuestions = currentSurvey?.groups.flatMap(g => g.questions) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Survey Builder</h1>
              </div>
              {currentSurvey && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={copyMagicLink}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                  >
                    🔗 Magic Link
                  </button>
                  <button
                    onClick={() => setShowResponses(!showResponses)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                  >
                    📊 Svar ({responses.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!showBuilder ? (
          /* Survey List */
          <div className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Mine Spørgeskemaer</h2>
                <button
                  onClick={createNewSurvey}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  + Opret Nyt
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
                        setActiveGroupId(survey.groups[0]?.id || null)
                      }}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{survey.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {survey.groups.reduce((sum, g) => sum + g.questions.length, 0)} spørgsmål
                      </p>
                      <div className="text-xs text-gray-500">
                        Magic Link: <code className="bg-gray-100 px-1 rounded">{survey.magicLink}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : currentSurvey ? (
          /* Builder View */
          <div className="flex h-[calc(100vh-73px)]">
            {/* Left Sidebar - Question Types */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 sticky top-0 bg-white border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Tilføj Spørgsmål</h3>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setViewMode('builder')}
                    className={`flex-1 px-3 py-1 text-xs rounded ${viewMode === 'builder' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Builder
                  </button>
                  <button
                    onClick={() => setViewMode('logic')}
                    className={`flex-1 px-3 py-1 text-xs rounded ${viewMode === 'logic' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Logik
                  </button>
                  <button
                    onClick={() => setViewMode('design')}
                    className={`flex-1 px-3 py-1 text-xs rounded ${viewMode === 'design' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Design
                  </button>
                  <button
                    onClick={() => setViewMode('settings')}
                    className={`flex-1 px-3 py-1 text-xs rounded ${viewMode === 'settings' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Indst.
                  </button>
                </div>
              </div>

              {viewMode === 'builder' && (
                <div className="p-4 space-y-4">
                  {['basic', 'choice', 'rating', 'input', 'advanced'].map(category => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {category === 'basic' && 'Grundlæggende'}
                        {category === 'choice' && 'Valg'}
                        {category === 'rating' && 'Rating'}
                        {category === 'input' && 'Input'}
                        {category === 'advanced' && 'Avanceret'}
                      </h4>
                      <div className="space-y-1">
                        {questionTypes
                          .filter(qt => qt.category === category)
                          .map((qt) => (
                            <button
                              key={qt.type}
                              onClick={() => addQuestion(qt.type)}
                              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                            >
                              <span>{qt.icon}</span>
                              <span>{qt.label}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'design' && (
                <DesignPanel survey={currentSurvey} onUpdate={updateSurvey} />
              )}

              {viewMode === 'settings' && (
                <SettingsPanel survey={currentSurvey} onUpdate={updateSurvey} />
              )}

              {viewMode === 'logic' && (
                <LogicPanel 
                  survey={currentSurvey} 
                  onUpdate={updateSurvey}
                  allQuestions={allQuestions}
                />
              )}
            </div>

            {/* Center - Questions List */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6">
                {/* Survey Header */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
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

                {/* Groups */}
                <div className="space-y-6">
                  {currentSurvey.groups.map((group, groupIndex) => (
                    <div key={group.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={group.title}
                            onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                            placeholder="Sektion titel..."
                            className="text-xl font-semibold text-gray-900 mb-2 px-2 py-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-900 w-full"
                          />
                          <textarea
                            value={group.description || ''}
                            onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                            placeholder="Beskrivelse (valgfrit)..."
                            rows={1}
                            className="w-full px-2 py-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-900 resize-none text-sm text-gray-600"
                          />
                        </div>
                        {currentSurvey.groups.length > 1 && (
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="ml-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            Slet sektion
                          </button>
                        )}
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        {group.questions.map((question, questionIndex) => (
                          <QuestionEditor
                            key={question.id}
                            question={question}
                            index={questionIndex}
                            groupIndex={groupIndex}
                            isActive={activeQuestionId === question.id}
                            onSelect={() => setActiveQuestionId(question.id)}
                            onUpdate={(updates) => updateQuestion(group.id, question.id, updates)}
                            onDelete={() => deleteQuestion(group.id, question.id)}
                            onDuplicate={() => duplicateQuestion(group.id, question.id)}
                            onMoveUp={questionIndex > 0 ? () => reorderQuestions(group.id, questionIndex, questionIndex - 1) : undefined}
                            onMoveDown={questionIndex < group.questions.length - 1 ? () => reorderQuestions(group.id, questionIndex, questionIndex + 1) : undefined}
                            allQuestions={allQuestions}
                          />
                        ))}
                        {group.questions.length === 0 && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Ingen spørgsmål i denne sektion. Tilføj spørgsmål fra venstre sidebar.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addGroup}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    + Tilføj Sektion
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Question Details */}
            {activeQuestionId && (
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <QuestionDetailsPanel
                  question={allQuestions.find(q => q.id === activeQuestionId)!}
                  survey={currentSurvey}
                  onUpdate={(updates) => {
                    const group = currentSurvey.groups.find(g => 
                      g.questions.some(q => q.id === activeQuestionId)
                    )
                    if (group) {
                      updateQuestion(group.id, activeQuestionId, updates)
                    }
                  }}
                  allQuestions={allQuestions}
                />
              </div>
            )}
          </div>
        ) : null}

        {/* Preview Modal */}
        {showPreview && currentSurvey && (
          <SurveyPreview
            survey={currentSurvey}
            onClose={() => setShowPreview(false)}
          />
        )}

        {/* Responses Modal */}
        {showResponses && currentSurvey && (
          <ResponsesView
            survey={currentSurvey}
            responses={responses}
            onClose={() => setShowResponses(false)}
            onExport={exportResponses}
          />
        )}
      </div>
    </div>
  )
}

// Design Panel Component
function DesignPanel({ survey, onUpdate }: { survey: Survey, onUpdate: (updates: Partial<Survey>) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs text-gray-700 mb-1">Primær farve</label>
        <input
          type="color"
          value={survey.design.primaryColor}
          onChange={(e) => onUpdate({
            design: { ...survey.design, primaryColor: e.target.value }
          })}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Baggrund</label>
        <input
          type="color"
          value={survey.design.backgroundColor}
          onChange={(e) => onUpdate({
            design: { ...survey.design, backgroundColor: e.target.value }
          })}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Tekst farve</label>
        <input
          type="color"
          value={survey.design.textColor}
          onChange={(e) => onUpdate({
            design: { ...survey.design, textColor: e.target.value }
          })}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Skrifttype</label>
        <select
          value={survey.design.fontFamily}
          onChange={(e) => onUpdate({
            design: { ...survey.design, fontFamily: e.target.value }
          })}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        >
          <option>Inter</option>
          <option>Roboto</option>
          <option>Open Sans</option>
          <option>Lato</option>
          <option>Montserrat</option>
          <option>Playfair Display</option>
          <option>Poppins</option>
          <option>Nunito</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Font størrelse</label>
        <select
          value={survey.design.fontSize}
          onChange={(e) => onUpdate({
            design: { ...survey.design, fontSize: e.target.value }
          })}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        >
          <option value="14px">Lille</option>
          <option value="16px">Normal</option>
          <option value="18px">Stor</option>
          <option value="20px">Meget stor</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Border radius</label>
        <select
          value={survey.design.borderRadius}
          onChange={(e) => onUpdate({
            design: { ...survey.design, borderRadius: e.target.value }
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
      <div>
        <label className="block text-xs text-gray-700 mb-1">Tema</label>
        <select
          value={survey.design.theme}
          onChange={(e) => onUpdate({
            design: { ...survey.design, theme: e.target.value as 'light' | 'dark' | 'custom' }
          })}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        >
          <option value="light">Lys</option>
          <option value="dark">Mørk</option>
          <option value="custom">Brugerdefineret</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Fremgang type</label>
        <select
          value={survey.design.progressType}
          onChange={(e) => onUpdate({
            design: { ...survey.design, progressType: e.target.value as 'percentage' | 'fraction' | 'dots' }
          })}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        >
          <option value="percentage">Procent</option>
          <option value="fraction">Brøk</option>
          <option value="dots">Prikker</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.design.showProgress}
            onChange={(e) => onUpdate({
              design: { ...survey.design, showProgress: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Vis fremgang</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.design.allowBack}
            onChange={(e) => onUpdate({
              design: { ...survey.design, allowBack: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Tillad tilbage</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.design.showQuestionNumbers}
            onChange={(e) => onUpdate({
              design: { ...survey.design, showQuestionNumbers: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Vis spørgsmål numre</span>
        </label>
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Custom CSS</label>
        <textarea
          value={survey.design.customCSS || ''}
          onChange={(e) => onUpdate({
            design: { ...survey.design, customCSS: e.target.value }
          })}
          placeholder="/* Tilføj custom CSS her */"
          rows={6}
          className="w-full px-3 py-2 text-xs font-mono rounded border border-gray-300 resize-none"
        />
      </div>
    </div>
  )
}

// Settings Panel Component
function SettingsPanel({ survey, onUpdate }: { survey: Survey, onUpdate: (updates: Partial<Survey>) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.allowMultipleResponses}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, allowMultipleResponses: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Tillad flere svar</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.requireEmail}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, requireEmail: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Kræv email</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.requireName}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, requireName: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Kræv navn</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.showThankYouPage}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, showThankYouPage: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Vis tak side</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.randomizeQuestions}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, randomizeQuestions: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Randomiser spørgsmål</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.randomizeOptions}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, randomizeOptions: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Randomiser valg</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={survey.settings.allowSaveProgress}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, allowSaveProgress: e.target.checked }
            })}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Tillad gem forløb</span>
        </label>
      </div>
      {survey.settings.showThankYouPage && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">Tak besked</label>
          <textarea
            value={survey.settings.thankYouMessage}
            onChange={(e) => onUpdate({
              settings: { ...survey.settings, thankYouMessage: e.target.value }
            })}
            placeholder="Tak besked..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 resize-none"
          />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-700 mb-1">Redirect URL</label>
        <input
          type="url"
          value={survey.settings.redirectUrl || ''}
          onChange={(e) => onUpdate({
            settings: { ...survey.settings, redirectUrl: e.target.value }
          })}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Password (valgfrit)</label>
        <input
          type="password"
          value={survey.settings.password || ''}
          onChange={(e) => onUpdate({
            settings: { ...survey.settings, password: e.target.value }
          })}
          placeholder="Password..."
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Udløbsdato</label>
        <input
          type="datetime-local"
          value={survey.settings.expirationDate || ''}
          onChange={(e) => onUpdate({
            settings: { ...survey.settings, expirationDate: e.target.value }
          })}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-700 mb-1">Max svar</label>
        <input
          type="number"
          value={survey.settings.responseLimit || ''}
          onChange={(e) => onUpdate({
            settings: { ...survey.settings, responseLimit: parseInt(e.target.value) || undefined }
          })}
          placeholder="Ubegrænset"
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        />
      </div>
    </div>
  )
}

// Logic Panel Component
function LogicPanel({ survey, onUpdate, allQuestions }: { 
  survey: Survey, 
  onUpdate: (updates: Partial<Survey>) => void,
  allQuestions: Question[]
}) {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-600 mb-4">
        Conditional logic giver dig mulighed for at vise eller skjule spørgsmål baseret på tidligere svar.
      </p>
      <div className="space-y-4">
        {allQuestions.map((question) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">
              {question.title || 'Untitled Question'}
            </div>
            {question.conditionalLogic ? (
              <div className="text-xs text-gray-600">
                Logik konfigureret
              </div>
            ) : (
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // TODO: Open logic editor modal
                  alert('Logic editor kommer snart!')
                }}
              >
                + Tilføj logik
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Question Details Panel Component
function QuestionDetailsPanel({ 
  question, 
  survey, 
  onUpdate,
  allQuestions 
}: { 
  question: Question
  survey: Survey
  onUpdate: (updates: Partial<Question>) => void
  allQuestions: Question[]
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Beskrivelse</label>
        <textarea
          value={question.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Beskrivelse (valgfrit)..."
          rows={2}
          className="w-full px-3 py-2 text-sm rounded border border-gray-300 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Placeholder</label>
        <input
          type="text"
          value={question.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder tekst..."
          className="w-full px-3 py-2 text-sm rounded border border-gray-300"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm text-gray-700">Påkrævet</label>
      </div>
      {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.randomizeOptions || false}
            onChange={(e) => onUpdate({ randomizeOptions: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm text-gray-700">Randomiser valg</label>
        </div>
      )}
      {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.allowOther || false}
            onChange={(e) => onUpdate({ allowOther: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm text-gray-700">Tillad "Andet"</label>
        </div>
      )}
      {question.type === 'text' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Min længde</label>
            <input
              type="number"
              value={question.validation?.minLength || ''}
              onChange={(e) => onUpdate({
                validation: { ...question.validation, minLength: parseInt(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Max længde</label>
            <input
              type="number"
              value={question.validation?.maxLength || ''}
              onChange={(e) => onUpdate({
                validation: { ...question.validation, maxLength: parseInt(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Regex pattern</label>
            <input
              type="text"
              value={question.validation?.pattern || ''}
              onChange={(e) => onUpdate({
                validation: { ...question.validation, pattern: e.target.value || undefined }
              })}
              placeholder="/^[A-Za-z]+$/"
              className="w-full px-3 py-2 text-sm font-mono rounded border border-gray-300"
            />
          </div>
        </div>
      )}
      {question.type === 'number' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Min værdi</label>
            <input
              type="number"
              value={question.validation?.minValue || ''}
              onChange={(e) => onUpdate({
                validation: { ...question.validation, minValue: parseFloat(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Max værdi</label>
            <input
              type="number"
              value={question.validation?.maxValue || ''}
              onChange={(e) => onUpdate({
                validation: { ...question.validation, maxValue: parseFloat(e.target.value) || undefined }
              })}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300"
            />
          </div>
        </div>
      )}
      {question.type === 'slider' && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">Step</label>
          <input
            type="number"
            value={question.step || 1}
            onChange={(e) => onUpdate({ step: parseFloat(e.target.value) || 1 })}
            min="0.1"
            step="0.1"
            className="w-full px-3 py-2 text-sm rounded border border-gray-300"
          />
        </div>
      )}
      {question.type === 'hidden' && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">Værdi</label>
          <input
            type="text"
            value={question.hiddenValue || ''}
            onChange={(e) => onUpdate({ hiddenValue: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300"
          />
        </div>
      )}
      {question.type === 'calculation' && (
        <div>
          <label className="block text-xs text-gray-700 mb-1">Formel</label>
          <input
            type="text"
            value={question.calculation || ''}
            onChange={(e) => onUpdate({ calculation: e.target.value })}
            placeholder="q1 + q2 * 2"
            className="w-full px-3 py-2 text-sm font-mono rounded border border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">
            Brug q1, q2, etc. for at referere til andre spørgsmål
          </p>
        </div>
      )}
    </div>
  )
}

// Question Editor Component (simplified - full version continues...)
function QuestionEditor({
  question,
  index,
  groupIndex,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  allQuestions
}: {
  question: Question
  index: number
  groupIndex: number
  isActive: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Question>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  allQuestions: Question[]
}) {
  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
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
            <option value="slider">Slider</option>
            <option value="nps">NPS</option>
            <option value="yes-no">Ja/Nej</option>
            <option value="phone">Telefon</option>
            <option value="url">URL</option>
            <option value="address">Adresse</option>
            <option value="date">Dato</option>
            <option value="time">Tid</option>
            <option value="email">Email</option>
            <option value="number">Nummer</option>
            <option value="matrix">Matrix</option>
            <option value="ranking">Rangering</option>
            <option value="file-upload">Fil upload</option>
            <option value="signature">Signatur</option>
            <option value="image-choice">Billede valg</option>
            <option value="consent">Samtykke</option>
            <option value="hidden">Skjult</option>
            <option value="calculation">Beregning</option>
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

      {/* Question-specific options - simplified for space */}
      {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown' || question.type === 'ranking' || question.type === 'image-choice') && (
        <div className="space-y-2 mb-3">
          {question.type === 'image-choice' && question.imageOptions ? (
            question.imageOptions.map((opt, optIndex) => (
              <div key={optIndex} className="flex gap-2">
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const newOptions = [...question.imageOptions!]
                    newOptions[optIndex].label = e.target.value
                    onUpdate({ imageOptions: newOptions })
                  }}
                  placeholder="Label"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="url"
                  value={opt.url}
                  onChange={(e) => {
                    const newOptions = [...question.imageOptions!]
                    newOptions[optIndex].url = e.target.value
                    onUpdate({ imageOptions: newOptions })
                  }}
                  placeholder="Billede URL"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newOptions = question.imageOptions?.filter((_, i) => i !== optIndex) || []
                    onUpdate({ imageOptions: newOptions.length > 0 ? newOptions : [{ label: 'Option 1', url: '' }] })
                  }}
                  className="text-red-500 text-sm"
                >
                  ×
                </button>
              </div>
            ))
          ) : question.options ? (
            question.options.map((option, optIndex) => (
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
            ))
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (question.type === 'image-choice') {
                onUpdate({ imageOptions: [...(question.imageOptions || []), { label: '', url: '' }] })
              } else {
                onUpdate({ options: [...(question.options || []), ''] })
              }
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
            {(Array.isArray(question.rows) ? question.rows : []).map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={row}
                  onChange={(e) => {
                    const currentRows = Array.isArray(question.rows) ? question.rows : []
                    const newRows = [...currentRows]
                    newRows[rowIndex] = e.target.value
                    onUpdate({ rows: newRows })
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentRows = Array.isArray(question.rows) ? question.rows : []
                    const newRows = currentRows.filter((_, i) => i !== rowIndex)
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
                const currentRows = Array.isArray(question.rows) ? question.rows : []
                onUpdate({ rows: [...currentRows, ''] })
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

      {(question.type === 'rating' || question.type === 'scale' || question.type === 'slider' || question.type === 'nps') && (
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
            value={typeof question.rows === 'number' ? question.rows : 4}
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

// Responses View Component (simplified - full version continues...)
function ResponsesView({
  survey,
  responses,
  onClose,
  onExport
}: {
  survey: Survey
  responses: any[]
  onClose: () => void
  onExport: () => void
}) {
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const getAnswerText = (questionId: string, answer: any): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }
    if (typeof answer === 'object' && answer !== null) {
      return Object.entries(answer)
        .sort(([, a], [, b]) => (a as number) - (b as number))
        .map(([key, value]) => `${value}: ${key}`)
        .join(', ')
    }
    return String(answer || 'Ingen svar')
  }

  const filteredResponses = responses.filter(r => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      r.email?.toLowerCase().includes(searchLower) ||
      JSON.stringify(r.answers).toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Svar & Statistikker</h2>
            <p className="text-sm text-gray-600 mt-1">{responses.length} besvarelser</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søg..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
            >
              📥 Export CSV
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {responses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Ingen besvarelser endnu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{responses.length}</div>
                  <div className="text-sm text-blue-700">Total Besvarelser</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {survey.groups.reduce((sum, g) => sum + g.questions.length, 0)}
                  </div>
                  <div className="text-sm text-green-700">Spørgsmål</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">
                    {responses.filter(r => r.email).length}
                  </div>
                  <div className="text-sm text-purple-700">Med Email</div>
                </div>
              </div>

              {/* Individual Responses */}
              <div className="space-y-4">
                {filteredResponses.map((response, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Besvarelse #{index + 1}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(response.submittedAt).toLocaleString('da-DK')}
                        </div>
                        {response.email && (
                          <div className="text-sm text-gray-600 mt-1">
                            📧 {response.email}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedResponse(selectedResponse === index ? null : index)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                      >
                        {selectedResponse === index ? 'Skjul' : 'Vis'}
                      </button>
                    </div>

                    {selectedResponse === index && (
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        {survey.groups.flatMap(g => g.questions).map((question) => {
                          const answer = response.answers[question.id]
                          return (
                            <div key={question.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="font-medium text-gray-900 mb-1">
                                {question.title}
                              </div>
                              <div className="text-gray-700">
                                {getAnswerText(question.id, answer)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Preview Component (simplified - needs full implementation with all question types)
function SurveyPreview({
  survey,
  onClose
}: {
  survey: Survey
  onClose: () => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const allQuestions = survey.groups.flatMap(g => g.questions)
  const currentQuestion = allQuestions[currentQuestionIndex]
  const progress = allQuestions.length > 0 ? ((currentQuestionIndex + 1) / allQuestions.length) * 100 : 0

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleNext = () => {
    if (currentQuestion && currentQuestion.required && !answers[currentQuestion.id]) {
      alert('Dette spørgsmål er påkrævet')
      return
    }
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (survey.design.allowBack && currentQuestionIndex > 0) {
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
        borderRadius: survey.design.borderRadius,
        color: survey.design.textColor
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

          {(survey.settings.requireEmail || survey.settings.requireName) && currentQuestionIndex === 0 && (
            <div className="mb-6 space-y-3">
              {survey.settings.requireName && (
                <div>
                  <label className="block text-sm font-medium mb-2">Navn *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                    style={{
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  />
                </div>
              )}
              {survey.settings.requireEmail && (
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                    style={{
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {survey.design.showProgress && (
            <div className="mb-6">
              {survey.design.progressType === 'percentage' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: survey.design.primaryColor
                    }}
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Spørgsmål {currentQuestionIndex + 1} af {allQuestions.length}
              </p>
            </div>
          )}

          {currentQuestion && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {survey.design.showQuestionNumbers && `#${currentQuestionIndex + 1} `}
                {currentQuestion.title || 'Untitled Question'}
                {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              {currentQuestion.description && (
                <p className="text-gray-600 mb-4 text-sm">{currentQuestion.description}</p>
              )}

              {/* Render question based on type - simplified for space */}
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
                  rows={typeof currentQuestion.rows === 'number' ? currentQuestion.rows : 4}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none resize-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
              )}

              {currentQuestion.type === 'yes-no' && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAnswer(currentQuestion.id, 'Ja')}
                    className={`px-6 py-3 rounded-lg border-2 font-medium ${
                      answers[currentQuestion.id] === 'Ja' ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: answers[currentQuestion.id] === 'Ja' ? survey.design.primaryColor : 'transparent',
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => handleAnswer(currentQuestion.id, 'Nej')}
                    className={`px-6 py-3 rounded-lg border-2 font-medium ${
                      answers[currentQuestion.id] === 'Nej' ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: answers[currentQuestion.id] === 'Nej' ? survey.design.primaryColor : 'transparent',
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  >
                    Nej
                  </button>
                </div>
              )}

              {currentQuestion.type === 'slider' && (
                <div>
                  <input
                    type="range"
                    min={currentQuestion.min || 1}
                    max={currentQuestion.max || 5}
                    step={currentQuestion.step || 1}
                    value={answers[currentQuestion.id] || currentQuestion.min || 1}
                    onChange={(e) => handleAnswer(currentQuestion.id, parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: survey.design.primaryColor }}
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{currentQuestion.min || 1}</span>
                    <span className="font-bold" style={{ color: survey.design.primaryColor }}>
                      {answers[currentQuestion.id] || currentQuestion.min || 1}
                    </span>
                    <span>{currentQuestion.max || 5}</span>
                  </div>
                </div>
              )}

              {/* Add more question type renderings here... */}
              {/* For brevity, I'm showing a few key ones. The full implementation would include all types */}
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
            {currentQuestionIndex < allQuestions.length - 1 ? (
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
