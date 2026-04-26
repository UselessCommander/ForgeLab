'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import {
  applyForgeTheme,
  FORGE_THEME_OPTIONS,
  type ForgeTheme,
  getStoredForgeTheme,
  storeForgeTheme,
} from '@/lib/theme'
import { formatPlanLabel } from '@/lib/subscription'

type MeResponse = {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  profileRole?: string
  avatarUrl?: string | null
  planKey?: string | null
  subscriptionStatus?: string | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionCancelAtPeriodEnd?: boolean
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
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingMessage, setBillingMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
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
          planKey: typeof data?.planKey === 'string' ? data.planKey : 'free',
          subscriptionStatus: typeof data?.subscriptionStatus === 'string' ? data.subscriptionStatus : null,
          subscriptionCurrentPeriodEnd:
            typeof data?.subscriptionCurrentPeriodEnd === 'string' ? data.subscriptionCurrentPeriodEnd : null,
          subscriptionCancelAtPeriodEnd: Boolean(data?.subscriptionCancelAtPeriodEnd),
        }
        setMe(next)
        setAvatarUrl(resolvedAvatar)
        setFirstName(next.firstName || '')
        setLastName(next.lastName || '')
        setProfileRole(next.profileRole || '')
        setTheme(getStoredForgeTheme())
      } catch {
        // Keep page usable even if user endpoint fails.
      }
    }
    load()
  }, [])

  useEffect(() => {
    applyForgeTheme(theme)
  }, [theme])

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
      applyForgeTheme(theme)
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

  const openCheckout = async () => {
    setBillingLoading(true)
    setBillingMessage('')
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', credentials: 'include' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || typeof payload?.url !== 'string') {
        setBillingMessage(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke starte betaling')
        return
      }
      window.location.assign(payload.url)
    } catch {
      setBillingMessage('Kunne ikke starte betaling')
    } finally {
      setBillingLoading(false)
    }
  }

  const openBillingPortal = async () => {
    setBillingLoading(true)
    setBillingMessage('')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || typeof payload?.url !== 'string') {
        setBillingMessage(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke åbne abonnementsportal')
        return
      }
      window.location.assign(payload.url)
    } catch {
      setBillingMessage('Kunne ikke åbne abonnementsportal')
    } finally {
      setBillingLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmText !== 'SLET' || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/auth/me/delete', { method: 'DELETE', credentials: 'include' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(payload?.error || 'Kunne ikke slette konto')
        return
      }
      window.location.href = '/'
    } catch {
      setDeleteError('Noget gik galt. Prøv igen.')
    } finally {
      setDeleting(false)
    }
  }

  const periodEndLabel = me.subscriptionCurrentPeriodEnd
    ? new Date(me.subscriptionCurrentPeriodEnd).toLocaleDateString('da-DK')
    : null
  const planLabel = formatPlanLabel(me.planKey)
  const subscriptionStatusLabel = me.subscriptionStatus || 'ingen'
  const isFreePlan = (me.planKey || 'free') === 'free'

  const initials = [firstName || me.firstName, lastName || me.lastName]
    .filter(Boolean).map(n => n![0].toUpperCase()).join('') ||
    (me.username ? me.username[0].toUpperCase() : 'U')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30 select-none">
                <ForgeLabLogo size={16} className="text-white" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-gray-900">ForgeLab</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all">Dashboard</Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-900">Profil</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase">
              {initials[0] || 'U'}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kontoindstillinger</h1>
          <p className="mt-1 text-sm text-gray-500">Administrer din profil, udseende og abonnement.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDEBAR — one unified card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Avatar section */}
            <div className="p-6 flex flex-col items-center text-center">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                className="hidden"
                onChange={onAvatarFile}
              />
              {/* Clickable avatar */}
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-60 transition-all"
                title="Klik for at skifte profilbillede"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white select-none">{initials}</span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <svg className="w-5 h-5 text-white mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white text-[10px] font-semibold">{avatarUploading ? 'Uploader…' : 'Skift foto'}</span>
                </div>
              </button>

              <div className="mt-4">
                <p className="font-bold text-gray-900 text-base">{me.username || '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{me.email || '—'}</p>
                {profileRole && <span className="mt-2 inline-block text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">{profileRole}</span>}
              </div>

              {avatarUrl && (
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={removeAvatar}
                  className="mt-4 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  Fjern profilbillede
                </button>
              )}
              {avatarMessage && <p className="mt-2 text-xs text-red-500">{avatarMessage}</p>}
              <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">PNG, JPEG, GIF, WebP eller SVG · maks 5 MB</p>
            </div>

            {/* Account info section */}
            <div className="border-t border-gray-100 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Konto</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Brugernavn</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{me.username || '—'}</p>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">{me.email || '—'}</p>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 font-medium">Plan</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-sm font-bold ${isFreePlan ? 'text-gray-700' : 'text-amber-600'}`}>{planLabel}</span>
                    {isFreePlan ? (
                      <button type="button" onClick={openCheckout} disabled={billingLoading} className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50">
                        {billingLoading ? '...' : 'Opgrader →'}
                      </button>
                    ) : (
                      <button type="button" onClick={openBillingPortal} disabled={billingLoading} className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50">
                        {billingLoading ? '...' : 'Administrer →'}
                      </button>
                    )}
                  </div>
                  {billingMessage && <p className="text-xs text-red-500 mt-1">{billingMessage}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN — one unified card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Personal info */}
            <div className="px-6 py-6">
              <h2 className="text-sm font-bold text-gray-900 mb-0.5">Personlige oplysninger</h2>
              <p className="text-xs text-gray-500 mb-5">Opdater dit navn og din rolle.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fornavn</label>
                  <input
                    suppressHydrationWarning
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Dit fornavn"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Efternavn</label>
                  <input
                    suppressHydrationWarning
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dit efternavn"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rolle</label>
                  <select
                    suppressHydrationWarning
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  >
                    <option value="">Vælg rolle</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="border-t border-gray-100 px-6 py-6">
              <h2 className="text-sm font-bold text-gray-900 mb-0.5">Udseende</h2>
              <p className="text-xs text-gray-500 mb-5">Tilpas temaet for din ForgeLab-oplevelse.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tema</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme((e.target.value as ForgeTheme) || 'default')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                >
                  {FORGE_THEME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subscription */}
            <div className="border-t border-gray-100 px-6 py-6">
              <h2 className="text-sm font-bold text-gray-900 mb-0.5">Abonnement</h2>
              <p className="text-xs text-gray-500 mb-5">Din nuværende plan og faktureringsoplysninger.</p>
              <div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{planLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Status: <span className="font-semibold">{subscriptionStatusLabel}</span>
                      {periodEndLabel && !me.subscriptionCancelAtPeriodEnd && ` · Fornyes ${periodEndLabel}`}
                    </p>
                    {me.subscriptionCancelAtPeriodEnd && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        Annulleres {periodEndLabel ? periodEndLabel : 'ved periodens udløb'}
                      </p>
                    )}
                  </div>
                  {isFreePlan ? (
                    <button
                      type="button"
                      disabled={billingLoading}
                      onClick={openCheckout}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-sm shadow-amber-500/25"
                    >
                      {billingLoading ? 'Sender…' : 'Opgrader til Pro'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={billingLoading}
                      onClick={openBillingPortal}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-60 transition-colors"
                    >
                      {billingLoading ? 'Sender…' : 'Administrer abonnement'}
                    </button>
                  )}
                </div>
                {billingMessage && <p className="mt-2 text-sm text-red-600">{billingMessage}</p>}
              </div>
            </div>

            {/* Save button */}
            <div className="border-t border-gray-100 px-6 py-5 flex items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 transition-colors shadow-sm"
              >
                {saving ? 'Gemmer…' : 'Gem ændringer'}
              </button>
              {saveMessage && (
                <span className={`text-sm font-medium ${saveMessage === 'Profil gemt' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {saveMessage === 'Profil gemt' ? '✓ ' : ''}{saveMessage}
                </span>
              )}
            </div>

            {/* Danger zone */}
            {me.username && me.username !== 'admin' && (
              <div className="border-t border-red-100">
                <div className="px-6 py-4 bg-red-50/40">
                  <h2 className="text-sm font-bold text-red-600 mb-0.5">Farezone</h2>
                  <p className="text-xs text-gray-500">Irreversible handlinger — vær forsigtig.</p>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Slet konto</p>
                      <p className="text-xs text-gray-500 mt-1">Sletter din konto og alle projekter permanent. Kan ikke fortrydes.</p>
                    </div>
                    {!showDeleteConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Slet konto
                      </button>
                    )}
                  </div>
                  {showDeleteConfirm && (
                    <div className="mt-4 space-y-3 p-4 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-sm font-medium text-gray-800">
                        Skriv <span className="font-mono font-bold text-red-600">SLET</span> for at bekræfte:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="SLET"
                        className="w-full max-w-xs rounded-lg border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={deleteAccount}
                          disabled={deleteConfirmText !== 'SLET' || deleting}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {deleting ? 'Sletter...' : 'Bekræft sletning'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError('') }}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white transition-colors"
                        >
                          Annuller
                        </button>
                      </div>
                      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
