'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export type VaerktoejOversigtItem = {
  slug: string
  title: string
  shortDescription: string
}

export type VaerktoejOversigtGroup = {
  letter: string
  items: VaerktoejOversigtItem[]
}

function sectionId(letter: string) {
  return letter === '#' ? 'letter-hash' : `letter-${letter}`
}

export default function VaerktoejerOversigtClient({ groups }: { groups: VaerktoejOversigtGroup[] }) {
  const [query, setQuery] = useState('')
  const [activeLetter, setActiveLetter] = useState<string | null>(groups[0]?.letter ?? null)
  const navRef = useRef<HTMLElement>(null)
  const activeBtnRef = useRef<HTMLButtonElement | null>(null)

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({
        letter: g.letter,
        items: g.items.filter(
          (t) =>
            t.title.toLowerCase().includes(q) || t.shortDescription.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query])

  useEffect(() => {
    const first = filteredGroups[0]?.letter
    if (!first) {
      setActiveLetter(null)
      return
    }
    if (!activeLetter || !filteredGroups.some((g) => g.letter === activeLetter)) {
      setActiveLetter(first)
    }
  }, [filteredGroups, activeLetter])

  const scrollToLetter = useCallback((letter: string) => {
    const id = sectionId(letter)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveLetter(letter)
  }, [])

  useEffect(() => {
    const letters = filteredGroups.map((g) => g.letter)
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]
        if (top?.target?.id) {
          const id = top.target.id
          const letter = id === 'letter-hash' ? '#' : id.replace(/^letter-/, '')
          if (letters.includes(letter)) setActiveLetter(letter)
        }
      },
      { root: null, rootMargin: '-100px 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    )

    for (const g of filteredGroups) {
      const el = document.getElementById(sectionId(g.letter))
      if (el) obs.observe(el)
    }

    return () => obs.disconnect()
  }, [filteredGroups])

  useLayoutEffect(() => {
    if (!activeLetter || !activeBtnRef.current) return
    activeBtnRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeLetter, filteredGroups])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg efter værktøj eller beskrivelse…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/80"
          aria-label="Søg i værktøjer"
        />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="z-10 self-start lg:sticky lg:top-28 lg:w-44 lg:shrink-0">
          <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wide text-gray-500 lg:block">
            Hop til bogstav
          </p>
          <nav
            ref={navRef}
            className="flex max-h-none flex-row flex-wrap gap-1 overflow-x-auto pb-1 lg:max-h-[min(70vh,calc(100vh-12rem))] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:rounded-xl lg:border lg:border-gray-200/80 lg:bg-gray-50/80 lg:p-2 lg:pb-2"
            aria-label="Bogstav-navigation"
          >
            {filteredGroups.map(({ letter }) => {
              const isActive = activeLetter === letter
              return (
                <button
                  key={letter}
                  type="button"
                  ref={isActive ? activeBtnRef : undefined}
                  onClick={() => scrollToLetter(letter)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:w-full lg:text-left ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 ring-1 ring-gray-200/80 hover:bg-amber-50 hover:text-amber-900 lg:bg-transparent lg:ring-0'
                  }`}
                >
                  {letter === '#' ? '0–9' : letter}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm md:p-10">
          {filteredGroups.length === 0 ? (
            <p className="text-center text-gray-600">
              Ingen værktøjer matcher <span className="font-medium text-gray-900">«{query.trim()}»</span>. Prøv et andet søgeord.
            </p>
          ) : (
            <div className="space-y-10">
              {filteredGroups.map(({ letter, items }) => (
                <div key={letter} id={sectionId(letter)} className="scroll-mt-28">
                  <h2 className="mb-4 border-b border-amber-200/80 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                    {letter === '#' ? '0–9' : letter}
                  </h2>
                  <dl className="space-y-5">
                    {items.map((t) => (
                      <div key={t.slug}>
                        <dt>
                          <Link
                            href={`/tools/${t.slug}`}
                            className="font-semibold text-gray-900 transition-colors hover:text-amber-700"
                          >
                            {t.title}
                          </Link>
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-gray-600">{t.shortDescription}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
