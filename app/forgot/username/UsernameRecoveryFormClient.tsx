'use client'

import { useState } from 'react'

export default function UsernameRecoveryFormClient() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Noget gik galt')
      } else {
        setMessage(data.message || 'Hvis email findes, har vi sendt brugernavn.')
      }
    } catch {
      setError('Kunne ikke sende anmodning. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="din@email.dk"
        />
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? 'Sender...' : 'Send brugernavn til min email'}
      </button>
    </form>
  )
}
