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

function loadPrefsFromStorage(): { analytics: boolean; functionalStorage: boolean } {
  if (typeof window === 'undefined') return { analytics: false, functionalStorage: false }
  try {
    const v1raw = window.localStorage.getItem(CONSENT_STORAGE_KEY_V1)
    const p = parseConsentV1(v1raw)
    if (p) return { analytics: p.analytics, functionalStorage: p.functionalStorage }
  } catch {
    // ignore
  }
  return { analytics: false, functionalStorage: false }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsToggle, setAnalyticsToggle] = useState(false)
  const [functionalToggle, setFunctionalToggle] = useState(false)

  const syncFromStorageAndMaybeHide = useCallback(() => {
    if (typeof window === 'undefined') return
    const v1raw = window.localStorage.getItem(CONSENT_STORAGE_KEY_V1)
    const parsed = parseConsentV1(v1raw)
    if (parsed) {
      setAnalyticsToggle(parsed.analytics)
      setFunctionalToggle(parsed.functionalStorage)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (syncFromStorageAndMaybeHide()) {
      setVisible(false)
      return
    }

    if (readLegacyAccepted()) {
      const migrated: ConsentPreferencesV1 = {
        ...defaultConsentPreferences(),
        analytics: true,
        functionalStorage: true,
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
  }, [syncFromStorageAndMaybeHide])

  useEffect(() => {
    const onOpen = () => {
      const prefs = loadPrefsFromStorage()
      setAnalyticsToggle(prefs.analytics)
      setFunctionalToggle(prefs.functionalStorage)
      setShowDetails(true)
      setVisible(true)
    }
    window.addEventListener('forgelab:cookie-consent', onOpen as EventListener)
    return () => window.removeEventListener('forgelab:cookie-consent', onOpen as EventListener)
  }, [])

  const save = useCallback((prefs: ConsentPreferencesV1) => {
    persistConsentV1(prefs)
    setAnalyticsToggle(prefs.analytics)
    setFunctionalToggle(prefs.functionalStorage)
    setVisible(false)
    setShowDetails(false)
  }, [])

  /** Afvis alt valgfrit: ingen analytics og ingen localStorage/præference-cookies ud over login-session + samtykke. */
  const rejectOptional = () => {
    save({ ...defaultConsentPreferences(), analytics: false, functionalStorage: false })
  }

  const acceptAll = () => {
    save({ ...defaultConsentPreferences(), analytics: true, functionalStorage: true })
  }

  const saveCustomFromPanel = () => {
    const functional = functionalToggle
    const analytics = functional && analyticsToggle
    save({
      ...defaultConsentPreferences(),
      analytics,
      functionalStorage: functional,
    })
  }

  useEffect(() => {
    if (!functionalToggle) setAnalyticsToggle(false)
  }, [functionalToggle])

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
              <strong>Log ind</strong> kræver en <strong>nødvendig session-cookie</strong> fra serveren (kan ikke fravælges
              og gemmes ikke herfra). Vi gemmer dit <strong>samtykkevalg</strong> i en cookie og lokalt, så vi husker
              det. Hvis du <strong>afviser valgfrie</strong>, bruger vi ikke localStorage til tema, demo-projekter,
              gæste-værktøjsdata eller &quot;Husk mig&quot; — og ingen valgfri statistik-cookies.
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Læs mere i{' '}
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
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-3 text-sm text-gray-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={functionalToggle}
                  onChange={(e) => setFunctionalToggle(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-medium">Valgfri browser-lagring</span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    Tema, demo-projekter offline, data i værktøjer som gæst, &quot;Husk mig&quot; og AI-modelvalg i
                    chatten.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsToggle}
                  onChange={(e) => setAnalyticsToggle(e.target.checked)}
                  disabled={!functionalToggle}
                  className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:opacity-40"
                />
                <span>
                  <span className="font-medium">Valgfri statistik (førsteparts)</span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    Kræver typisk også browser-lagring til præferencer. Slå først lagring til ovenfor.
                  </span>
                </span>
              </label>
              <button
                type="button"
                onClick={saveCustomFromPanel}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                Gem valg
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (!showDetails) {
                  const p = loadPrefsFromStorage()
                  setAnalyticsToggle(p.analytics)
                  setFunctionalToggle(p.functionalStorage)
                }
                setShowDetails((v) => !v)
              }}
              className="order-2 sm:order-1 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
            >
              {showDetails ? 'Skjul indstillinger' : 'Indstillinger'}
            </button>
            <button
              type="button"
              onClick={rejectOptional}
              className="order-1 sm:order-2 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
            >
              Afvis valgfrie
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
