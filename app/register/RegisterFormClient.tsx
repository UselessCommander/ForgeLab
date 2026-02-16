'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterFormClient() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (username.length < 3) {
      setError('Brugernavn skal være mindst 3 tegn')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password skal være mindst 6 tegn')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords matcher ikke')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/login?registered=true')
      } else {
        const data = await response.json()
        setError(data.error || 'Fejl ved registrering')
      }
    } catch {
      setError('Fejl ved registrering. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-6 auth-form-stagger">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brugernavn
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Indtast brugernavn (min. 3 tegn)"
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
            minLength={6}
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Indtast password (min. 6 tegn)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bekræft password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Bekræft password"
          />
        </div>

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
          {loading ? 'Opretter bruger...' : 'Opret Bruger'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2 auth-form-stagger">
        <Link
          href="/login"
          className="block text-gray-600 hover:text-amber-600 transition-colors text-sm font-medium hover:underline underline-offset-2"
        >
          Har du allerede en bruger? Log ind →
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
