'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PasswordResetConfirmFormClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = searchParams.get('token') || ''

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Mangler token i linket')
      return
    }
    if (password.length < 6) {
      setError('Password skal være mindst 6 tegn')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords matcher ikke')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Noget gik galt')
      } else {
        setMessage('Dit password er nulstillet. Du sendes til login...')
        setTimeout(() => router.push('/login'), 1200)
      }
    } catch {
      setError('Kunne ikke nulstille password. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nyt password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Mindst 6 tegn"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bekræft password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Skriv samme password igen"
        />
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? 'Gemmer...' : 'Gem nyt password'}
      </button>
    </form>
  )
}
