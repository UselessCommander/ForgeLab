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
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brugernavn
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-3 bg-[#1a2f4a] border-2 border-[#3a4f6a] text-white placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            placeholder="Indtast brugernavn (min. 3 tegn)"
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
            minLength={6}
            className="w-full px-4 py-3 bg-[#1a2f4a] border-2 border-[#3a4f6a] text-white placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            placeholder="Indtast password (min. 6 tegn)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bekræft Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-[#1a2f4a] border-2 border-[#3a4f6a] text-white placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            placeholder="Bekræft password"
          />
        </div>

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
          {loading ? 'Opretter bruger...' : 'Opret Bruger'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/login"
          className="block text-gray-400 hover:text-[#F97316] transition-colors text-sm"
        >
          Har du allerede en bruger? Log ind →
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
