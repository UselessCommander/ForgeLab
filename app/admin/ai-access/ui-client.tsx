'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'

type AiAccessUser = {
  id: string
  username: string | null
  email: string | null
  ai_enabled: boolean
  plan_key: string | null
  subscription_status: string | null
  created_at: string
}

export default function AiAccessAdminClient() {
  const [users, setUsers] = useState<AiAccessUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      params.set('limit', '200')
      const res = await fetch(`/api/admin/ai-access?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || 'Kunne ikke hente brugere')
        setUsers([])
        return
      }
      setUsers(Array.isArray(json?.users) ? json.users : [])
    } catch (e: any) {
      setError(e?.message || 'Netværksfejl')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleAiAccess = async (user: AiAccessUser) => {
    setSavingById(prev => ({ ...prev, [user.id]: true }))
    try {
      const res = await fetch('/api/admin/ai-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          aiEnabled: !user.ai_enabled,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json?.error || 'Kunne ikke opdatere AI-adgang')
        return
      }
      setUsers(prev =>
        prev.map(item => (item.id === user.id ? { ...item, ai_enabled: !item.ai_enabled } : item))
      )
    } finally {
      setSavingById(prev => ({ ...prev, [user.id]: false }))
    }
  }

  const counts = useMemo(() => {
    const total = users.length
    const enabled = users.filter(u => u.ai_enabled).length
    const pro = users.filter(u => (u.plan_key || '').toLowerCase() === 'pro').length
    return { total, enabled, pro }
  }, [users])

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Admin
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
            >
              Dashboard
            </Link>
          </div>
        }
      />
      <div className="layout-page py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Adgang</h1>
          <p className="mt-2 text-gray-600">
            Giv eller fjern AI-adgang pr. bruger med et enkelt klik.
          </p>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Brugere i liste</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{counts.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">AI aktiveret</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{counts.enabled}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Pro plan</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{counts.pro}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg på navn, email eller id..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Opdater
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-[1.4fr_1.6fr_0.7fr_0.8fr_0.9fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Bruger</span>
            <span>Email / ID</span>
            <span>Plan</span>
            <span>Status</span>
            <span>AI adgang</span>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Indlæser brugere...</div>
          ) : users.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">Ingen brugere fundet.</div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className="grid grid-cols-[1.4fr_1.6fr_0.7fr_0.8fr_0.9fr] items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{user.username || '(uden navn)'}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-gray-700">{user.email || '—'}</p>
                  <p className="truncate text-xs text-gray-400">{user.id}</p>
                </div>
                <p className="text-gray-700">{user.plan_key || 'free'}</p>
                <p className="text-gray-700">{user.subscription_status || '—'}</p>
                <button
                  type="button"
                  disabled={Boolean(savingById[user.id])}
                  onClick={() => void toggleAiAccess(user)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    user.ai_enabled
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${savingById[user.id] ? 'cursor-wait opacity-70' : ''}`}
                >
                  {savingById[user.id] ? 'Gemmer...' : user.ai_enabled ? 'Aktiveret' : 'Deaktiveret'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}

