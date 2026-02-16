'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

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

export default function CardSorting() {
  const [mode, setMode] = useState<SortingMode>('open')
  const [cards, setCards] = useState<Card[]>([
    { id: '1', text: '' }
  ])
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: '', cards: [] }
  ])
  const [draggedCard, setDraggedCard] = useState<string | null>(null)

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
                        placeholder="Kort tekst..."
                        className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 bg-white focus:outline-none focus:border-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {cards.length > 1 && (
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        >
                          ×
                        </button>
                      )}
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
                            placeholder="Kategori navn..."
                            className="w-full px-3 py-2 text-sm font-semibold rounded border border-gray-300 bg-white focus:outline-none focus:border-gray-900"
                          />
                        )}
                        {(mode === 'open' || mode === 'hybrid') && categories.length > 1 && (
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="mt-1 text-xs text-red-600 hover:text-red-800"
                          >
                            Slet kategori
                          </button>
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
                              className="p-2 bg-white border border-gray-300 rounded flex justify-between items-center"
                            >
                              <span className="text-sm text-gray-900">{card.text || 'Unavngiven kort'}</span>
                              <button
                                onClick={() => removeCardFromCategory(category.id, card.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ×
                              </button>
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
