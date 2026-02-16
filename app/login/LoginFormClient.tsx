'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginFormInner() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Bruger oprettet! Du kan nu logge ind.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Forkert brugernavn eller password')
      }
    } catch (err: unknown) {
      setError('Fejl ved login. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-6 auth-form-stagger">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brugernavn
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Indtast brugernavn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Indtast password"
          />
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-slide-up-in">
            <p className="text-emerald-700 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-up-in">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
        >
          {loading ? 'Logger ind...' : 'Log Ind'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2 auth-form-stagger">
        <Link
          href="/register"
          className="block text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium hover:underline underline-offset-2"
        >
          Har du ikke en bruger? Opret bruger →
        </Link>
        <Link
          href="/"
          className="block text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium hover:underline underline-offset-2"
        >
          ← Tilbage til forsiden
        </Link>
      </div>
    </>
  )
}

export default function LoginFormClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-12 bg-amber-200 rounded-xl" />
          </div>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  )
}
