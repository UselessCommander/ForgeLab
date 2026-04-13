import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'

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

export function applyForgeTheme(theme: ForgeTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function getStoredForgeTheme(): ForgeTheme {
  if (typeof window === 'undefined') return 'default'
  if (!hasFunctionalStorageConsent()) return 'default'
  const raw = window.localStorage.getItem(FORGE_THEME_STORAGE_KEY)
  if (raw === 'emerald') return 'emerald'
  if (raw === 'chelsea') return 'chelsea'
  if (raw === 'arsenal') return 'arsenal'
  if (raw === 'sunset') return 'sunset'
  if (raw === 'lightning-purple') return 'lightning-purple'
  if (raw === 'pink-cherry') return 'pink-cherry'
  return 'default'
}

export function storeForgeTheme(theme: ForgeTheme) {
  if (typeof window === 'undefined') return
  applyForgeTheme(theme)
  if (!hasFunctionalStorageConsent()) return
  window.localStorage.setItem(FORGE_THEME_STORAGE_KEY, theme)
}
