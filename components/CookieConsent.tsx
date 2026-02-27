'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'forgelab_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY)
      if (stored === 'accepted') return
    } catch {
      // Ignore localStorage errors
    }

    const hasCookie = typeof document !== 'undefined'
      && document.cookie.split('; ').some((c) => c.startsWith(`${CONSENT_KEY}=`))

    if (!hasCookie) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const accept = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONSENT_KEY, 'accepted')
      }
    } catch {
      // Ignore localStorage errors
    }

    if (typeof document !== 'undefined') {
      document.cookie = `${CONSENT_KEY}=accepted; max-age=${60 * 60 * 24 * 365}; path=/`
    }

    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto">
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-lg shadow-gray-300/40 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">Vi bruger cookies</p>
            <p className="text-xs sm:text-sm text-gray-600">
              ForgeLab bruger nødvendige cookies til login og sikkerhed samt anonyme data til statistik. Ved at acceptere fortsætter du med brug af cookies på sitet.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={accept}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

