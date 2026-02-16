'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Question {
  id: string
  type: string
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
  imageOptions?: { label: string; url: string }[]
  hiddenValue?: string
  conditionalLogic?: any
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
    backgroundColor: string
    textColor: string
    fontFamily: string
    fontSize: string
    borderRadius: string
    showProgress: boolean
    progressType: 'percentage' | 'fraction' | 'dots'
    allowBack: boolean
    showQuestionNumbers: boolean
    theme: 'light' | 'dark' | 'custom'
    customCSS?: string
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
    randomizeQuestions: boolean
    randomizeOptions: boolean
    allowSaveProgress: boolean
  }
}

export default function SurveyPage() {
  const params = useParams()
  const magicLink = params.magicLink as string
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null)
  const signatureRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const savedSurveys = localStorage.getItem('forgelab_surveys')
    if (savedSurveys) {
      const surveys = JSON.parse(savedSurveys)
      const foundSurvey = surveys.find((s: any) => s.magicLink === magicLink)
      if (foundSurvey) {
        // Migrate old format to new format if needed
        if (!foundSurvey.groups && foundSurvey.questions) {
          foundSurvey.groups = [{
            id: 'default_group',
            title: 'Spørgsmål',
            questions: foundSurvey.questions
          }]
        }
        setSurvey(foundSurvey)
      }
    }
    setLoading(false)
  }, [magicLink])

  useEffect(() => {
    if (signatureRef.current) {
      const canvas = signatureRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
      setSignatureCanvas(canvas)
    }
  }, [])

  const allQuestions = survey?.groups.flatMap(g => {
    let questions = [...g.questions]
    if (survey.settings.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }
    if (survey.settings.randomizeOptions) {
      questions = questions.map(q => {
        if (q.options && (q.type === 'multiple-choice' || q.type === 'checkbox' || q.type === 'dropdown')) {
          return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) }
        }
        return q
      })
    }
    return questions
  }) || []

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
    if (survey?.design.allowBack && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (survey?.settings.requireEmail && !email) {
      alert('Email er påkrævet')
      return
    }
    if (survey?.settings.requireName && !name) {
      alert('Navn er påkrævet')
      return
    }

    const response = {
      surveyId: survey?.id,
      magicLink,
      email: survey?.settings.requireEmail ? email : undefined,
      name: survey?.settings.requireName ? name : undefined,
      answers,
      submittedAt: new Date().toISOString()
    }

    const existingResponses = localStorage.getItem(`forgelab_responses_${magicLink}`)
    const responses = existingResponses ? JSON.parse(existingResponses) : []
    responses.push(response)
    localStorage.setItem(`forgelab_responses_${magicLink}`, JSON.stringify(responses))

    setSubmitted(true)

    if (survey?.settings.redirectUrl) {
      setTimeout(() => {
        window.location.href = survey.settings.redirectUrl!
      }, 3000)
    }
  }

  const handlePasswordSubmit = () => {
    if (survey?.settings.password && password === survey.settings.password) {
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureCanvas) return
    setIsDrawing(true)
    const ctx = signatureCanvas.getContext('2d')
    if (!ctx) return
    
    const rect = signatureCanvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureCanvas) return
    const ctx = signatureCanvas.getContext('2d')
    if (!ctx) return
    
    const rect = signatureCanvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleSignatureEnd = () => {
    setIsDrawing(false)
    if (signatureCanvas && currentQuestion) {
      const dataURL = signatureCanvas.toDataURL()
      handleAnswer(currentQuestion.id, dataURL)
    }
  }

  const clearSignature = () => {
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height)
      }
      if (currentQuestion) {
        handleAnswer(currentQuestion.id, '')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundColor: survey?.design.backgroundColor || '#FFFFFF',
        fontFamily: survey?.design.fontFamily || 'Inter'
      }}>
        <div className="text-gray-600">Indlæser spørgeskema...</div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Spørgeskema ikke fundet</h1>
          <p className="text-gray-600">Dette magic link eksisterer ikke.</p>
        </div>
      </div>
    )
  }

  if (survey.settings.password && !password && !passwordError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        backgroundColor: survey.design.backgroundColor,
        fontFamily: survey.design.fontFamily
      }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4" style={{ color: survey.design.primaryColor }}>
              Password Beskyttet
            </h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Indtast password..."
              className="w-full px-4 py-3 border-2 rounded-lg mb-4 focus:outline-none"
              style={{
                borderColor: survey.design.primaryColor,
                borderRadius: survey.design.borderRadius
              }}
            />
            {passwordError && (
              <p className="text-red-600 text-sm mb-4">Forkert password</p>
            )}
            <button
              onClick={handlePasswordSubmit}
              className="w-full px-6 py-3 rounded-lg font-medium text-white"
              style={{
                backgroundColor: survey.design.primaryColor,
                borderRadius: survey.design.borderRadius
              }}
            >
              Fortsæt
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        backgroundColor: survey.design.backgroundColor,
        fontFamily: survey.design.fontFamily
      }}>
        <div className="max-w-2xl w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: survey.design.primaryColor }}>
            {survey.settings.thankYouMessage || 'Tak for din besvarelse!'}
          </h1>
          {survey.settings.redirectUrl && (
            <p className="text-gray-600">Du bliver omdirigeret om et øjeblik...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{
      backgroundColor: survey.design.backgroundColor,
      fontFamily: survey.design.fontFamily,
      color: survey.design.textColor,
      fontSize: survey.design.fontSize
    }}>
      {survey.design.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: survey.design.customCSS }} />
      )}
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: survey.design.primaryColor }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-gray-600 text-lg">{survey.description}</p>
          )}
        </div>

        {(survey.settings.requireEmail || survey.settings.requireName) && currentQuestionIndex === 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg border-2" style={{
            borderColor: survey.design.primaryColor,
            borderRadius: survey.design.borderRadius
          }}>
            {survey.settings.requireName && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Navn *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dit navn..."
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
                  placeholder="din@email.dk"
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
            {survey.design.progressType === 'fraction' && (
              <div className="text-sm text-gray-600">
                Spørgsmål {currentQuestionIndex + 1} af {allQuestions.length}
              </div>
            )}
            {survey.design.progressType === 'dots' && (
              <div className="flex gap-2 justify-center">
                {allQuestions.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i <= currentQuestionIndex ? survey.design.primaryColor : '#E5E7EB'
                    }}
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {Math.round(progress)}% færdig
            </p>
          </div>
        )}

        {currentQuestion && (
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg mb-6" style={{
            borderRadius: survey.design.borderRadius
          }}>
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              {survey.design.showQuestionNumbers && `#${currentQuestionIndex + 1} `}
              {currentQuestion.title || 'Untitled Question'}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {currentQuestion.description && (
              <p className="text-gray-600 mb-6">{currentQuestion.description}</p>
            )}

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
                rows={typeof currentQuestion.rows === 'number' ? currentQuestion.rows : 4}
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
                  <label key={index} className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{
                    borderColor: answers[currentQuestion.id] === option ? survey.design.primaryColor : '#E5E7EB',
                    borderRadius: survey.design.borderRadius
                  }}>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="w-5 h-5"
                      style={{ accentColor: survey.design.primaryColor }}
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'checkbox' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <label key={index} className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{
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
                      className="w-5 h-5"
                      style={{ accentColor: survey.design.primaryColor }}
                    />
                    <span className="flex-1">{option}</span>
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

            {currentQuestion.type === 'yes-no' && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 'Ja')}
                  className={`px-8 py-4 rounded-lg border-2 font-medium transition-all ${
                    answers[currentQuestion.id] === 'Ja' ? 'text-white shadow-lg' : ''
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
                  className={`px-8 py-4 rounded-lg border-2 font-medium transition-all ${
                    answers[currentQuestion.id] === 'Nej' ? 'text-white shadow-lg' : ''
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

            {currentQuestion.type === 'rating' && (
              <div className="flex gap-2 justify-center">
                {Array.from({ length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 }, (_, i) => {
                  const value = (currentQuestion.min || 1) + i
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(currentQuestion.id, value)}
                      className={`text-4xl transition-transform ${answers[currentQuestion.id] === value ? 'scale-125' : ''}`}
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
                <div className="flex justify-between mb-4 text-sm text-gray-600">
                  <span>{currentQuestion.scaleLabels?.min || 'Min'}</span>
                  <span>{currentQuestion.scaleLabels?.max || 'Max'}</span>
                </div>
                <div className="flex gap-2 justify-between flex-wrap">
                  {Array.from({ length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 }, (_, i) => {
                    const value = (currentQuestion.min || 1) + i
                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(currentQuestion.id, value)}
                        className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                          answers[currentQuestion.id] === value ? 'text-white shadow-lg' : ''
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
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{currentQuestion.min || 1}</span>
                  <span className="font-bold text-lg" style={{ color: survey.design.primaryColor }}>
                    {answers[currentQuestion.id] || currentQuestion.min || 1}
                  </span>
                  <span>{currentQuestion.max || 5}</span>
                </div>
              </div>
            )}

            {currentQuestion.type === 'nps' && (
              <div>
                <div className="flex justify-between mb-4 text-sm text-gray-600">
                  <span>Ikke sandsynligt</span>
                  <span>Meget sandsynligt</span>
                </div>
                <div className="flex gap-2 justify-between flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion.id, i)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        answers[currentQuestion.id] === i ? 'text-white shadow-lg scale-110' : ''
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

            {currentQuestion.type === 'phone' && (
              <input
                type="tel"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="+45 12 34 56 78"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                style={{
                  borderColor: survey.design.primaryColor,
                  borderRadius: survey.design.borderRadius
                }}
              />
            )}

            {currentQuestion.type === 'url' && (
              <input
                type="url"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="https://eksempel.dk"
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
                min={currentQuestion.min}
                max={currentQuestion.max}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                style={{
                  borderColor: survey.design.primaryColor,
                  borderRadius: survey.design.borderRadius
                }}
              />
            )}

            {currentQuestion.type === 'address' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={answers[`${currentQuestion.id}_street`] || ''}
                  onChange={(e) => handleAnswer(`${currentQuestion.id}_street`, e.target.value)}
                  placeholder="Gadenavn og nummer"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={answers[`${currentQuestion.id}_postal`] || ''}
                    onChange={(e) => handleAnswer(`${currentQuestion.id}_postal`, e.target.value)}
                    placeholder="Postnummer"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                    style={{
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  />
                  <input
                    type="text"
                    value={answers[`${currentQuestion.id}_city`] || ''}
                    onChange={(e) => handleAnswer(`${currentQuestion.id}_city`, e.target.value)}
                    placeholder="By"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none"
                    style={{
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}
                  />
                </div>
              </div>
            )}

            {currentQuestion.type === 'matrix' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-2 p-3 text-left bg-gray-50"></th>
                      {currentQuestion.columns?.map((col, index) => (
                        <th key={index} className="border-2 p-3 text-center bg-gray-50">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(currentQuestion.rows) ? currentQuestion.rows : []).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border-2 p-3 font-medium">{row}</td>
                        {currentQuestion.columns?.map((col, colIndex) => (
                          <td key={colIndex} className="border-2 p-3 text-center">
                            <input
                              type="radio"
                              name={`${currentQuestion.id}-${rowIndex}`}
                              checked={answers[`${currentQuestion.id}-${rowIndex}`] === col}
                              onChange={() => handleAnswer(`${currentQuestion.id}-${rowIndex}`, col)}
                              className="w-5 h-5"
                              style={{ accentColor: survey.design.primaryColor }}
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
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => {
                  const rank = (answers[currentQuestion.id] as Record<string, number> || {})[option]
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 border-2 rounded-lg" style={{
                      borderColor: survey.design.primaryColor,
                      borderRadius: survey.design.borderRadius
                    }}>
                      <span className="font-bold text-lg w-8 text-center" style={{ color: survey.design.primaryColor }}>
                        {rank || '?'}
                      </span>
                      <span className="flex-1">{option}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const current = answers[currentQuestion.id] as Record<string, number> || {}
                            const newRank = rank ? rank - 1 : (currentQuestion.options?.length || 1)
                            handleAnswer(currentQuestion.id, { ...current, [option]: Math.max(1, newRank) })
                          }}
                          className="px-3 py-1 rounded-lg font-medium text-white"
                          style={{ backgroundColor: survey.design.primaryColor }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            const current = answers[currentQuestion.id] as Record<string, number> || {}
                            const newRank = rank ? rank + 1 : 1
                            handleAnswer(currentQuestion.id, { ...current, [option]: Math.min(currentQuestion.options?.length || 1, newRank) })
                          }}
                          className="px-3 py-1 rounded-lg font-medium text-white"
                          style={{ backgroundColor: survey.design.primaryColor }}
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
              <div className="border-2 border-dashed p-12 text-center rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" style={{
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
                  <div className="text-4xl mb-2">📎</div>
                  <div className="font-medium">Klik for at uploade fil</div>
                  <div className="text-sm text-gray-500 mt-1">eller træk og slip</div>
                </label>
              </div>
            )}

            {currentQuestion.type === 'signature' && (
              <div>
                <canvas
                  ref={signatureRef}
                  width={600}
                  height={200}
                  className="border-2 rounded-lg cursor-crosshair"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius
                  }}
                  onMouseDown={handleSignatureStart}
                  onMouseMove={handleSignatureMove}
                  onMouseUp={handleSignatureEnd}
                  onMouseLeave={handleSignatureEnd}
                  onTouchStart={handleSignatureStart}
                  onTouchMove={handleSignatureMove}
                  onTouchEnd={handleSignatureEnd}
                />
                <button
                  onClick={clearSignature}
                  className="mt-2 px-4 py-2 text-sm rounded-lg border-2"
                  style={{
                    borderColor: survey.design.primaryColor,
                    borderRadius: survey.design.borderRadius,
                    color: survey.design.primaryColor
                  }}
                >
                  Ryd signatur
                </button>
              </div>
            )}

            {currentQuestion.type === 'image-choice' && (
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.imageOptions?.map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, opt.label)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      answers[currentQuestion.id] === opt.label ? 'ring-4' : ''
                    }`}
                    style={{
                      borderColor: answers[currentQuestion.id] === opt.label ? survey.design.primaryColor : '#E5E7EB',
                      borderRadius: survey.design.borderRadius,
                      ringColor: survey.design.primaryColor
                    }}
                  >
                    {opt.url ? (
                      <img src={opt.url} alt={opt.label} className="w-full h-32 object-cover rounded mb-2" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                        <span className="text-gray-400">Ingen billede</span>
                      </div>
                    )}
                    <div className="font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'consent' && (
              <div className="flex items-start gap-3 p-4 border-2 rounded-lg" style={{
                borderColor: survey.design.primaryColor,
                borderRadius: survey.design.borderRadius
              }}>
                <input
                  type="checkbox"
                  checked={answers[currentQuestion.id] === true}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.checked)}
                  className="w-5 h-5 mt-1"
                  style={{ accentColor: survey.design.primaryColor }}
                />
                <label className="flex-1 text-sm">
                  {currentQuestion.description || 'Jeg accepterer betingelserne'}
                </label>
              </div>
            )}

            {currentQuestion.type === 'hidden' && (
              <input
                type="hidden"
                value={currentQuestion.hiddenValue || ''}
              />
            )}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={!survey.design.allowBack || currentQuestionIndex === 0}
            className="px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              className="px-8 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transition-all"
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
              className="px-8 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transition-all"
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
  )
}
