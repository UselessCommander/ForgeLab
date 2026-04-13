/**
 * Cookie- og samtykke-præferencer (GDPR-orienteret, førsteparts).
 * Bruges af CookieConsent-banneret og kan læses fra klient-kode før analytics indlæses.
 */

export const CONSENT_STORAGE_KEY_V1 = 'forgelab_consent_v1'
/** @deprecated — migreres til CONSENT_STORAGE_KEY_V1 */
export const CONSENT_STORAGE_KEY_LEGACY = 'forgelab_cookie_consent'
export const CONSENT_COOKIE_V1 = 'forgelab_consent_v1'

export type ConsentPreferencesV1 = {
  version: 1
  /** Altid true — session, sikkerhed, CSRF-relateret */
  necessary: true
  /** Valgfri førsteparts-statistik (fx aggregeret brug), når vi indlæser det */
  analytics: boolean
  savedAt: string
}

export function defaultConsentPreferences(): ConsentPreferencesV1 {
  return {
    version: 1,
    necessary: true,
    analytics: false,
    savedAt: new Date().toISOString(),
  }
}

export function parseConsentV1(raw: string | null): ConsentPreferencesV1 | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPreferencesV1>
    if (parsed?.version !== 1 || parsed.necessary !== true) return null
    return {
      version: 1,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/** Om brugeren har sagt ja til ikke-nødvendige cookies (pt. analytics-flag). */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const v1 = parseConsentV1(window.localStorage.getItem(CONSENT_STORAGE_KEY_V1))
    if (v1) return v1.analytics
    const legacy = window.localStorage.getItem(CONSENT_STORAGE_KEY_LEGACY)
    if (legacy === 'accepted') return true
  } catch {
    return false
  }
  return false
}

export function persistConsentV1(prefs: ConsentPreferencesV1): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({ ...prefs, savedAt: new Date().toISOString() })
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY_V1, body)
    window.localStorage.removeItem(CONSENT_STORAGE_KEY_LEGACY)
  } catch {
    // ignore
  }
  const maxAge = 60 * 60 * 24 * 365
  if (typeof document !== 'undefined') {
    document.cookie = `${CONSENT_COOKIE_V1}=${encodeURIComponent(body)}; max-age=${maxAge}; path=/; SameSite=Lax`
    document.cookie = `${CONSENT_STORAGE_KEY_LEGACY}=; max-age=0; path=/`
  }
}
