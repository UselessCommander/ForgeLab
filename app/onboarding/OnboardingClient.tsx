'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

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
] as const

const STEPS = 4

export default function OnboardingClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (typeof data?.username === 'string') setUsername(data.username)
        if (typeof data?.firstName === 'string') setFirstName(data.firstName)
        if (typeof data?.lastName === 'string') setLastName(data.lastName)
        if (typeof data?.profileRole === 'string') setProfileRole(data.profileRole)
      } catch {
        // ignore
      }
    }
    void load()
  }, [])

  const finishOnboarding = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/onboarding/complete', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke afslutte')
        return
      }
      if (projectId) {
        router.replace(`/dashboard/projects/${projectId}`)
      } else {
        router.replace('/dashboard')
      }
      router.refresh()
    } catch {
      setError('Kunne ikke afslutte')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  const saveProfileAndContinue = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, profileRole }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke gemme profil')
        return
      }
      setStep(2)
    } catch {
      setError('Kunne ikke gemme profil')
    } finally {
      setLoading(false)
    }
  }

  const createProjectAndContinue = async () => {
    const name = projectName.trim()
    if (!name) {
      setStep(3)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(typeof payload?.error === 'string' ? payload.error : 'Kunne ikke oprette projekt')
        return
      }
      const data = await res.json()
      if (typeof data?.id === 'string') setProjectId(data.id)
      setStep(3)
    } catch {
      setError('Kunne ikke oprette projekt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <header className="relative z-10 border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-900">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <ForgeLabLogo size={24} />
            </div>
            <span className="font-semibold">ForgeLab</span>
          </Link>
          <span className="text-xs font-medium text-gray-500">
            Trin {step + 1} / {STEPS}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex gap-1.5 mb-8">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-gray-900">Velkommen til ForgeLab{username ? `, ${username}` : ''}</h1>
              <p className="text-gray-600 leading-relaxed">
                Her kan du samle produkt- og designarbejde i projekter, bruge værktøjer og samarbejde med dit team. På
                de næste skridt tilpasser vi din profil og kan oprette dit første projekt — det tager kun et øjeblik.
              </p>
              <p className="text-sm text-gray-500">
                Ved at fortsætte accepterer du vores behandling af data som beskrevet under{' '}
                <Link href="/privatliv" className="text-amber-700 hover:underline font-medium">
                  privatliv
                </Link>
                .
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-shadow"
              >
                Kom i gang
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-gray-900">Din profil</h1>
              <p className="text-gray-600 text-sm">
                Valgfrit — hjælper os med at tilpasse oplevelsen. Du kan altid ændre det under profil.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fornavn</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition-colors"
                  placeholder="Fornavn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Efternavn</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition-colors"
                  placeholder="Efternavn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rolle</label>
                <select
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition-colors bg-white"
                >
                  <option value="">Vælg rolle (valgfrit)</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Spring over
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={saveProfileAndContinue}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  Gem og fortsæt
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-gray-900">Første projekt</h1>
              <p className="text-gray-600 text-sm">
                Projektet er dit arbejdsrum for idéer, værktøjer og filer. Du kan oprette flere senere.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Projektnavn</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition-colors"
                  placeholder="Fx. Q4 produktlancering"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Spring over
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={createProjectAndContinue}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  Opret og fortsæt
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-gray-900">Du er klar</h1>
              <p className="text-gray-600 leading-relaxed">
                {projectId
                  ? 'Dit projekt er oprettet. Vi sender dig direkte ind i arbejdsrummet.'
                  : 'Du kan oprette projekter og invitere dit team fra dashboardet når som helst.'}
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={finishOnboarding}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-shadow disabled:opacity-50"
              >
                {loading ? 'Gemmer...' : projectId ? 'Åbn projekt' : 'Gå til dashboard'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
