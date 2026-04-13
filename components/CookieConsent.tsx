'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  CONSENT_COOKIE_V1,
  CONSENT_STORAGE_KEY_LEGACY,
  CONSENT_STORAGE_KEY_V1,
  defaultConsentPreferences,
  parseConsentV1,
  persistConsentV1,
  type ConsentPreferencesV1,
} from '@/lib/cookie-consent'

function readLegacyAccepted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem(CONSENT_STORAGE_KEY_LEGACY) === 'accepted') return true
  } catch {
    return false
  }
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${CONSENT_STORAGE_KEY_LEGACY}=`))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsToggle, setAnalyticsToggle] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const v1raw = window.localStorage.getItem(CONSENT_STORAGE_KEY_V1)
    const parsed = parseConsentV1(v1raw)
    if (parsed) {
      setVisible(false)
      return
    }

    if (readLegacyAccepted()) {
      const migrated: ConsentPreferencesV1 = {
        ...defaultConsentPreferences(),
        analytics: true,
      }
      persistConsentV1(migrated)
      setVisible(false)
      return
    }

    const hasV1Cookie = document.cookie.split('; ').some((c) => c.startsWith(`${CONSENT_COOKIE_V1}=`))
    if (hasV1Cookie) {
      try {
        const part = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE_V1}=`))
        if (part) {
          const value = decodeURIComponent(part.split('=').slice(1).join('='))
          if (parseConsentV1(value)) {
            window.localStorage.setItem(CONSENT_STORAGE_KEY_V1, value)
            setVisible(false)
            return
          }
        }
      } catch {
        // ignore
      }
    }

    setVisible(true)
  }, [])

  const save = useCallback((prefs: ConsentPreferencesV1) => {
    persistConsentV1(prefs)
    setVisible(false)
    setShowDetails(false)
  }, [])

  const acceptNecessaryOnly = () => {
    save({ ...defaultConsentPreferences(), analytics: false })
  }

  const acceptAll = () => {
    save({ ...defaultConsentPreferences(), analytics: true })
  }

  const saveCustomFromPanel = () => {
    save({ ...defaultConsentPreferences(), analytics: analyticsToggle })
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto">
        <div
          className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-lg shadow-gray-300/40 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
        >
          <div>
            <p id="cookie-consent-title" className="text-sm font-semibold text-gray-900 mb-1">
              Cookies og samtykke
            </p>
            <p id="cookie-consent-desc" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Vi bruger <strong>strengt nødvendige</strong> cookies til login, sikkerhed og at huske dit valg her.
              Hvis du vælger &quot;Accepter alle&quot;, må vi også sætte <strong>valgfrie førsteparts-cookies</strong> til
              aggregeret statistik og produktforbedring. Vi bruger ikke tredjeparts marketing-cookies som standard — se{' '}
              <Link href="/cookies" className="text-amber-700 font-medium hover:underline">
                cookiepolitikken
              </Link>{' '}
              og{' '}
              <Link href="/privatliv" className="text-amber-700 font-medium hover:underline">
                privatlivspolitikken
              </Link>
              .
            </p>
          </div>

          {showDetails && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-3 text-sm text-gray-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsToggle}
                  onChange={(e) => setAnalyticsToggle(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-medium">Valgfri statistik (førsteparts)</span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    Hjælper os med at forstå brugen af ForgeLab i aggregeret form. Kan fravælges.
                  </span>
                </span>
              </label>
              <button
                type="button"
                onClick={saveCustomFromPanel}
                className="mt-3 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                Gem valg
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setAnalyticsToggle(false)
                setShowDetails(true)
              }}
              className="order-2 sm:order-1 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
            >
              Indstillinger
            </button>
            <button
              type="button"
              onClick={acceptNecessaryOnly}
              className="order-1 sm:order-2 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
            >
              Kun nødvendige
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="order-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
            >
              Accepter alle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
