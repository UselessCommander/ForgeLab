/**
 * ForgeLab hovedfarver — defineret i app/globals.css (:root + data-theme).
 * Brug CSS-variabler i UI; denne fil er til reference og JS der skal kende hex-værdier.
 */

/** Standard amber-brand (default tema) */
export const FORGE_ACCENT_DEFAULT = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  pageBg: '#fffaf2',
} as const

/** Tekst og struktur */
export const FORGE_NEUTRALS = {
  ink: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  panel: '#ffffff',
} as const

/**
 * Framework-fasefarver på Metoder (sprint-dage / DT-faser).
 * Matcher --forge-framework-* i globals.css — hentet fra brand-temaerne i samme fil.
 */
export const FORGE_FRAMEWORK_PHASE_COLORS = {
  map: { accent: FORGE_ACCENT_DEFAULT[500], soft: FORGE_ACCENT_DEFAULT[100] },
  sketch: { accent: '#3b82f6', soft: '#dbeafe' },
  decide: { accent: '#8b5cf6', soft: '#ede9fe' },
  prototype: { accent: '#10b981', soft: '#d1fae5' },
  test: { accent: '#ec4899', soft: '#fce7f3' },
} as const

/** CSS-variabelnavne til brug i className eller style */
export const FORGE_CSS_VARS = {
  accent50: 'var(--forge-accent-50)',
  accent100: 'var(--forge-accent-100)',
  accent500: 'var(--forge-accent-500)',
  accent600: 'var(--forge-accent-600)',
  accent700: 'var(--forge-accent-700)',
  pageBg: 'var(--forge-page-bg)',
  frameworkInk: 'var(--forge-framework-ink)',
  frameworkMuted: 'var(--forge-framework-muted)',
  frameworkMap: 'var(--forge-framework-map)',
  frameworkMapSoft: 'var(--forge-framework-map-soft)',
  frameworkSketch: 'var(--forge-framework-sketch)',
  frameworkSketchSoft: 'var(--forge-framework-sketch-soft)',
  frameworkDecide: 'var(--forge-framework-decide)',
  frameworkDecideSoft: 'var(--forge-framework-decide-soft)',
  frameworkPrototype: 'var(--forge-framework-prototype)',
  frameworkPrototypeSoft: 'var(--forge-framework-prototype-soft)',
  frameworkTest: 'var(--forge-framework-test)',
  frameworkTestSoft: 'var(--forge-framework-test-soft)',
} as const
