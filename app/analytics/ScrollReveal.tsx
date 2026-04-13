'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  /** Lavere threshold = tidligere “reveal” */
  threshold?: number
}

export default function ScrollReveal({ children, className = '', threshold = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-[opacity,transform] duration-700 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`.trim()}
    >
      {children}
    </div>
  )
}
