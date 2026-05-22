'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MethodAccentTheme, MethodTocItem } from '@/lib/method-page-ui'

type MethodTableOfContentsProps = {
  items: MethodTocItem[]
  accent: MethodAccentTheme
}

export default function MethodTableOfContents({ items, accent }: MethodTableOfContentsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }, [])

  useEffect(() => {
    const sectionIds = items.map((i) => i.id)
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (elements.length === 0) return

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: 0 }
    )

    elements.forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [items])

  if (items.length === 0) return null

  const linkClass = (id: string) =>
    `block rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      activeId === id
        ? `font-semibold text-gray-900 ${accent.stepActive} border`
        : 'font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`

  return (
    <>
      {/* Mobil: horisontal scroll */}
      <nav
        className="mb-6 lg:hidden"
        aria-label="Indhold på siden"
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeId === item.id
                  ? `${accent.badge} border-current`
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: sticky sidebar */}
      <nav
        className="hidden lg:block lg:sticky lg:top-24 lg:self-start"
        aria-label="Indhold på siden"
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          På denne side
        </p>
        <ul className="space-y-0.5 border-l border-gray-200/80 pl-0">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`${linkClass(item.id)} w-full border-l-2 -ml-px pl-3 ${
                  activeId === item.id ? 'border-current' : 'border-transparent'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
