'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'
import type { CardSortResponseRecord, CardSortResponseSessionMeta } from '@/lib/card-sorting-analytics'

type SortingMode = 'open' | 'closed' | 'hybrid'

interface Card {
  id: string
  text: string
}

interface Category {
  id: string
  name: string
  cards: string[]
}

type CardSortMeta = {
  createdAt?: string
  launchedAt?: string
}

type CardSortResponse = CardSortResponseRecord

function captureSessionMeta(): CardSortResponseSessionMeta {
  if (typeof window === 'undefined') {
    return { instructionsSeen: 0, commentCount: 0 }
  }
  const ua = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = ''
  const ff = ua.match(/Firefox\/(\d+(\.\d+)?)/)
  const ch = ua.match(/Chrome\/(\d+(\.\d+)?)/)
  const sa = ua.match(/Version\/(\d+(\.\d+)?).*Safari/)
  if (ff) {
    browserName = 'Firefox'
    browserVersion = ff[1] ?? ''
  } else if (ch && !ua.includes('Edg')) {
    browserName = 'Chrome'
    browserVersion = ch[1] ?? ''
  } else if (sa && ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari'
    browserVersion = sa[1] ?? ''
  }
  const isMac = /Mac OS X|Macintosh/.test(ua)
  const isWin = /Windows/.test(ua)
  const deviceType = /Mobile|Android.*Mobile/i.test(ua) ? 'Mobile' : 'Desktop'
  const vendor = isMac ? 'Apple' : isWin ? 'Microsoft' : '—'
  const model = isMac ? 'Macintosh' : isWin ? 'PC' : '—'
  const osName = isMac ? 'OS X' : isWin ? 'Windows' : '—'
  return {
    instructionsSeen: 0,
    commentCount: 0,
    device: { type: deviceType, vendor, model },
    os: { name: osName, version: '', codename: '' },
    browser: { name: browserName, version: browserVersion },
    screen: { width: window.screen.width, height: window.screen.height },
  }
}

export default function CardSorting() {
  const [mode, setMode] = useState<SortingMode>('open')
  const [cards, setCards] = useState<Card[]>([{ id: '1', text: '' }])
  const [categories, setCategories] = useState<Category[]>([{ id: '1', name: '', cards: [] }])
  const [meta, setMeta] = useState<CardSortMeta>({})
  const [responses, setResponses] = useState<CardSortResponse[]>([])
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [participantStartedAt, setParticipantStartedAt] = useState<number | null>(null)

  const cardSortingData = { mode, cards, categories, meta, responses }
  const setCardSortingData = (data: typeof cardSortingData) => {
    setMode(data.mode)
    setCards(data.cards)
    setCategories(data.categories)
    setMeta(data.meta && typeof data.meta === 'object' ? data.meta : {})
    setResponses(Array.isArray(data.responses) ? data.responses : [])
  }

  // Automatically save/load data when in a project
  useProjectToolData('card-sorting', cardSortingData, setCardSortingData)

  const addCard = () => {
    setCards([...cards, { id: Date.now().toString(), text: '' }])
  }

  const updateCard = (id: string, text: string) => {
    setCards(cards.map(card => card.id === id ? { ...card, text } : card))
  }

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id))
    // Remove from all categories
    setCategories(categories.map(cat => ({
      ...cat,
      cards: cat.cards.filter(cardId => cardId !== id)
    })))
  }

  const addCategory = () => {
    setCategories([...categories, { id: Date.now().toString(), name: '', cards: [] }])
  }

  const updateCategoryName = (id: string, name: string) => {
    setCategories(categories.map(cat => cat.id === id ? { ...cat, name } : cat))
  }

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id))
  }

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (categoryId: string) => {
    if (!draggedCard) return
    
    // Remove card from all categories first
    const updatedCategories = categories.map(cat => ({
      ...cat,
      cards: cat.cards.filter(cardId => cardId !== draggedCard)
    }))
    
    // Add to target category
    const finalCategories = updatedCategories.map(cat =>
      cat.id === categoryId
        ? { ...cat, cards: [...cat.cards, draggedCard] }
        : cat
    )
    
    setCategories(finalCategories)
    setDraggedCard(null)
  }

  const removeCardFromCategory = (categoryId: string, cardId: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, cards: cat.cards.filter(id => id !== cardId) }
        : cat
    ))
  }

  const resetSorting = () => {
    setCategories(categories.map(cat => ({ ...cat, cards: [] })))
  }

  const countActiveCategories = () =>
    categories.filter((cat) => {
      if (cat.cards.length === 0) return false
      if (mode === 'closed') return true
      return String(cat.name).trim().length > 0
    }).length

  const publishTest = () => {
    setMeta((m) => ({
      ...m,
      createdAt: m.createdAt || new Date().toISOString(),
      launchedAt: m.launchedAt || new Date().toISOString(),
    }))
  }

  const startParticipantSession = () => {
    setParticipantStartedAt(Date.now())
  }

  const finishParticipantSession = (abandoned: boolean) => {
    const end = Date.now()
    const start = participantStartedAt ?? end
    const durationSec = Math.max(0, Math.round((end - start) / 1000))
    const categoryCount = countActiveCategories()
    const sortSnapshot = abandoned
      ? undefined
      : {
          mode,
          categories: categories
            .filter((cat) => cat.cards.length > 0)
            .map((cat) => ({
              id: cat.id,
              name: cat.name.trim() || 'Untitled',
              cards: cat.cards.map((cid) => {
                const c = cards.find((x) => x.id === cid)
                return { id: cid, text: (c?.text ?? '').trim() || '(empty)' }
              }),
            })),
        }
    const session = captureSessionMeta()
    setResponses((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        startedAt: new Date(start).toISOString(),
        completedAt: new Date(end).toISOString(),
        durationSec: abandoned ? 0 : durationSec,
        abandoned,
        categoryCount,
        sortSnapshot,
        session,
      },
    ])
    setParticipantStartedAt(null)
  }

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
            <div className="flex items-center gap-4 mb-2">
              <ForgeLabLogo size={48} />
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Card Sorting Test
              </h1>
            </div>
            <p className="text-gray-600">
              Test informationsarkitektur med kort sortering
            </p>
          </div>
        </header>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Test &amp; analytics</h2>
          <p className="text-sm text-gray-600 mb-4">
            Udgiv testen for at sætte lanceringsdato. Brug deltagerflowet for at registrere svar med varighed — de
            vises under Analytics → Kortsortering.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={publishTest}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              {meta.launchedAt ? 'Test allerede udgivet' : 'Udgiv test (sæt lanceret)'}
            </button>
            {meta.launchedAt && (
              <span className="text-xs text-gray-500">
                Lanceret {new Date(meta.launchedAt).toLocaleString('da-DK')}
              </span>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Simuler deltager / registrér svar</h3>
            <p className="text-xs text-gray-600 mb-3">
              Start en session, udfør sorteringen, og afslut for at gemme ét svar (varighed + antal kategorier med kort).
            </p>
            <div className="flex flex-wrap gap-2">
              {!participantStartedAt ? (
                <button
                  type="button"
                  onClick={startParticipantSession}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                >
                  Start deltagersession
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => finishParticipantSession(false)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    Afslut og registrer svar
                  </button>
                  <button
                    type="button"
                    onClick={() => finishParticipantSession(true)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Forlad (forladt svar)
                  </button>
                </>
              )}
            </div>
            {responses.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">{responses.length} svar gemt i dette projekt.</p>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vælg Sorteringstype</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setMode('open')
                setCategories([{ id: '1', name: '', cards: [] }])
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'open'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-2">Open Card Sorting</div>
              <div className="text-sm text-gray-600">
                Deltagerne opretter og navngiver deres egne grupper
              </div>
            </button>
            <button
              onClick={() => {
                setMode('closed')
                setCategories([
                  { id: '1', name: 'Kategori 1', cards: [] },
                  { id: '2', name: 'Kategori 2', cards: [] },
                  { id: '3', name: 'Kategori 3', cards: [] }
                ])
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'closed'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-2">Closed Card Sorting</div>
              <div className="text-sm text-gray-600">
                Sorter kort i foruddefinerede kategorier
              </div>
            </button>
            <button
              onClick={() => {
                setMode('hybrid')
                setCategories([
                  { id: '1', name: 'Kategori 1', cards: [] },
                  { id: '2', name: 'Kategori 2', cards: [] }
                ])
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'hybrid'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-2">Hybrid Card Sorting</div>
              <div className="text-sm text-gray-600">
                Brug eksisterende kategorier eller opret nye
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kort</h2>
                <button
                  onClick={addCard}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  + Tilføj
                </button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg cursor-move hover:border-gray-400 transition-colors"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={card.text}
                        onChange={(e) => updateCard(card.id, e.target.value)}
                        onKeyDown={(e) =>
                          deleteEmptyFieldRow(e, card.text, cards.length > 1, () => deleteCard(card.id))
                        }
                        placeholder="Kort tekst..."
                        className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 bg-white focus:outline-none focus:border-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Træk til kategori
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kategorier</h2>
                <div className="flex gap-2">
                  {(mode === 'open' || mode === 'hybrid') && (
                    <button
                      onClick={addCategory}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                    >
                      + Tilføj Kategori
                    </button>
                  )}
                  <button
                    onClick={resetSorting}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Nulstil
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const categoryCards = cards.filter(card => category.cards.includes(card.id))
                  
                  return (
                    <div
                      key={category.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(category.id)}
                      className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                        draggedCard ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="mb-3">
                        {mode === 'closed' ? (
                          <div className="font-semibold text-gray-900 mb-1">{category.name}</div>
                        ) : (
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateCategoryName(category.id, e.target.value)}
                            onKeyDown={(e) =>
                              deleteEmptyFieldRow(e, category.name, categories.length > 1, () =>
                                deleteCategory(category.id)
                              )
                            }
                            placeholder="Kategori navn..."
                            className="w-full px-3 py-2 text-sm font-semibold rounded border border-gray-300 bg-white focus:outline-none focus:border-gray-900"
                          />
                        )}
                      </div>
                      
                      <div className="space-y-2 min-h-[100px]">
                        {categoryCards.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center py-4">
                            Træk kort her
                          </div>
                        ) : (
                          categoryCards.map((card) => (
                            <div
                              key={card.id}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key !== 'Delete' && e.key !== 'Backspace') return
                                e.preventDefault()
                                removeCardFromCategory(category.id, card.id)
                              }}
                              className="p-2 bg-white border border-gray-300 rounded flex items-center outline-none focus:ring-2 focus:ring-gray-400"
                            >
                              <span className="text-sm text-gray-900">{card.text || 'Unavngiven kort'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
