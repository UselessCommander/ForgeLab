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
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brugernavn
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#1a2f4a] border-2 border-[#3a4f6a] text-white placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            placeholder="Indtast brugernavn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#1a2f4a] border-2 border-[#3a4f6a] text-white placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            placeholder="Indtast password"
          />
        </div>

        {success && (
          <div className="p-4 bg-[#1a2f4a] border-2 border-green-600">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#1a2f4a] border-2 border-red-600">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-[#F97316] text-white border-2 border-[#F97316] font-bold text-lg hover:bg-[#ea580c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logger ind...' : 'Log Ind'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/register"
          className="block text-gray-400 hover:text-[#F97316] transition-colors text-sm"
        >
          Har du ikke en bruger? Opret bruger →
        </Link>
        <Link
          href="/"
          className="block text-gray-400 hover:text-[#F97316] transition-colors text-sm"
        >
          ← Tilbage til landing page
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
            <div className="h-12 bg-[#1a2f4a] rounded mb-4" />
            <div className="h-12 bg-[#1a2f4a] rounded mb-4" />
            <div className="h-12 bg-[#F97316] rounded" />
          </div>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  )
}
