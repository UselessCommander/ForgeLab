'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import {
  applyForgeColorMode,
  applyForgeTheme,
  FORGE_COLOR_MODE_STORAGE_KEY,
  FORGE_THEME_OPTIONS,
  getStoredForgeColorMode,
  type ForgeTheme,
  type ForgeColorMode,
  getStoredForgeTheme,
  storeForgeColorMode,
  storeForgeTheme,
} from '@/lib/theme'

type MeResponse = {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  profileRole?: string
  avatarUrl?: string | null
}

const ROLE_OPTIONS = [
  'Founder',
  'CEO',
  'COO',
  'CTO',
  'CPO',
  'Product Manager',
  'Designer',
  'Developer',
  'Marketing',
  'Sales',
  'Operations',
  'Student',
  'Other',
]

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse>({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [theme, setTheme] = useState<ForgeTheme>('default')
  const [colorMode, setColorMode] = useState<ForgeColorMode>('system')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const rawAvatar = data?.avatarUrl
        const resolvedAvatar =
          typeof rawAvatar === 'string' && rawAvatar.length > 0 ? rawAvatar : null
        const next = {
          username: typeof data?.username === 'string' ? data.username : '',
          email: typeof data?.email === 'string' ? data.email : '',
          firstName: typeof data?.firstName === 'string' ? data.firstName : '',
          lastName: typeof data?.lastName === 'string' ? data.lastName : '',
          profileRole: typeof data?.profileRole === 'string' ? data.profileRole : '',
          avatarUrl: resolvedAvatar,
        }
        setMe(next)
        setAvatarUrl(resolvedAvatar)
        setFirstName(next.firstName || '')
        setLastName(next.lastName || '')
        setProfileRole(next.profileRole || '')
        setTheme(getStoredForgeTheme())
        const mode = getStoredForgeColorMode()
        if (!window.localStorage.getItem(FORGE_COLOR_MODE_STORAGE_KEY)) {
          window.localStorage.setItem(FORGE_COLOR_MODE_STORAGE_KEY, 'system')
        }
        setColorMode(mode)
      } catch {
        // Keep page usable even if user endpoint fails.
      }
    }
    load()
  }, [])

  useEffect(() => {
    applyForgeTheme(theme)
  }, [theme])

  useEffect(() => {
    applyForgeColorMode(colorMode)
  }, [colorMode])

  const saveProfile = async () => {
    setSaving(true)
    setSaveMessage('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, profileRole }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setSaveMessage(payload?.error || 'Kunne ikke gemme profil')
        return
      }
      setSaveMessage('Profil gemt')
      setMe((prev) => ({ ...prev, firstName, lastName, profileRole }))
      storeForgeTheme(theme)
      storeForgeColorMode(colorMode)
      applyForgeTheme(theme)
      applyForgeColorMode(colorMode)
    } catch {
      setSaveMessage('Kunne ikke gemme profil')
    } finally {
      setSaving(false)
    }
  }

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarMessage('')
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch('/api/auth/me/avatar', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAvatarMessage(typeof payload?.error === 'string' ? payload.error : 'Upload mislykkedes')
        return
      }
      const url = typeof payload?.avatarUrl === 'string' ? payload.avatarUrl : null
      if (url) {
        setAvatarUrl(url)
        setMe((prev) => ({ ...prev, avatarUrl: url }))
      }
    } catch {
      setAvatarMessage('Upload mislykkedes')
    } finally {
      setAvatarUploading(false)
    }
  }

  const removeAvatar = async () => {
    setAvatarMessage('')
    setAvatarUploading(true)
    try {
      const res = await fetch('/api/auth/me/avatar', { method: 'DELETE', credentials: 'include' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAvatarMessage(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke fjerne billede')
        return
      }
      setAvatarUrl(null)
      setMe((prev) => ({ ...prev, avatarUrl: null }))
    } catch {
      setAvatarMessage('Kunne ikke fjerne billede')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        }
      />

      <div className="layout-page py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold text-gray-900">Profil</h1>
          <p className="mt-1 text-sm text-gray-500">Din konto i ForgeLab.</p>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-2">Intet billede</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profilbillede</p>
                  <p className="mt-1 text-sm text-gray-600">
                    PNG, JPEG, GIF, WebP, SVG eller ICO — op til 5 MB med Supabase Storage.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                  className="hidden"
                  onChange={onAvatarFile}
                />
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  {avatarUploading ? 'Uploader...' : 'Upload billede'}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={removeAvatar}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Fjern
                  </button>
                ) : null}
              </div>
            </div>
            {avatarMessage ? <p className="px-5 py-2 text-sm text-red-600 bg-red-50">{avatarMessage}</p> : null}

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="px-5 py-4 border-b border-gray-100 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Brugernavn</p>
                <p className="mt-1 text-base font-medium text-gray-900">{me.username || '—'}</p>
              </div>
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 text-base font-medium text-gray-900">{me.email || '—'}</p>
              </div>
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fornavn</p>
              <input
                suppressHydrationWarning
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Dit fornavn"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Efternavn</p>
              <input
                suppressHydrationWarning
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dit efternavn"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rolle</p>
              <select
                suppressHydrationWarning
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">Vælg rolle</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Theme</p>
              <select
                value={theme}
                onChange={(e) => setTheme((e.target.value as ForgeTheme) || 'default')}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              >
                {FORGE_THEME_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dark mode</p>
              <select
                value={colorMode}
                onChange={(e) => setColorMode((e.target.value as ForgeColorMode) || 'system')}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="system">System standard</option>
                <option value="light">Lys</option>
                <option value="dark">Mork</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? 'Gemmer...' : 'Gem profil'}
            </button>
            {saveMessage ? <p className="text-sm text-gray-600">{saveMessage}</p> : null}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
