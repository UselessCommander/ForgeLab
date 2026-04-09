export type ForgeTheme =
  | 'default'
  | 'emerald'
  | 'chelsea'
  | 'arsenal'
  | 'sunset'
  | 'lightning-purple'
  | 'pink-cherry'

export const FORGE_THEME_OPTIONS: Array<{ id: ForgeTheme; label: string }> = [
  { id: 'default', label: 'Forge Amber' },
  { id: 'emerald', label: 'Emerald Green' },
  { id: 'chelsea', label: 'Chelsea Blue' },
  { id: 'arsenal', label: 'Arsenal Red' },
  { id: 'sunset', label: 'Sunset Orange' },
  { id: 'lightning-purple', label: 'Lightning Purple' },
  { id: 'pink-cherry', label: 'Pink Cherry' },
]

export const FORGE_THEME_STORAGE_KEY = 'forgelab-theme'
export const FORGE_COLOR_MODE_STORAGE_KEY = 'forgelab-color-mode'
export type ForgeColorMode = 'system' | 'light' | 'dark'

export function applyForgeTheme(theme: ForgeTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyForgeColorMode(mode: ForgeColorMode) {
  if (typeof document === 'undefined') return
  const resolved = mode === 'system' ? getSystemColorMode() : mode
  document.documentElement.setAttribute('data-color-mode', resolved)
}

export function getStoredForgeTheme(): ForgeTheme {
  if (typeof window === 'undefined') return 'default'
  const raw = window.localStorage.getItem(FORGE_THEME_STORAGE_KEY)
  if (raw === 'emerald') return 'emerald'
  if (raw === 'chelsea') return 'chelsea'
  if (raw === 'arsenal') return 'arsenal'
  if (raw === 'sunset') return 'sunset'
  if (raw === 'lightning-purple') return 'lightning-purple'
  if (raw === 'pink-cherry') return 'pink-cherry'
  return 'default'
}

export function getStoredForgeColorMode(): ForgeColorMode {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(FORGE_COLOR_MODE_STORAGE_KEY)
  if (raw === 'light') return 'light'
  if (raw === 'dark') return 'dark'
  return 'system'
}

export function storeForgeTheme(theme: ForgeTheme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FORGE_THEME_STORAGE_KEY, theme)
}

export function storeForgeColorMode(mode: ForgeColorMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FORGE_COLOR_MODE_STORAGE_KEY, mode)
}
