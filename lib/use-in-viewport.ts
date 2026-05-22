'use client'

import { useEffect, useRef, useState } from 'react'

/** True when the element intersects the viewport (or root). */
export function useInViewport<T extends Element>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: null, rootMargin: '120px', threshold: 0.01, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.root, options?.rootMargin, options?.threshold])

  return [ref, inView]
}
