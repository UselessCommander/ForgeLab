'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'

export default function RegisterFormClient() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [, setConsentRevision] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onConsent = () => {
      setConsentRevision((n) => n + 1)
      if (!hasFunctionalStorageConsent()) {
        setRememberMe(false)
      }
    }
    window.addEventListener('forgelab-consent-updated', onConsent)
    return () => window.removeEventListener('forgelab-consent-updated', onConsent)
  }, [])

  const handleGoogleRegister = async () => {
    setError('')
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (oauthError) {
        setError('Kunne ikke starte Google-oprettelse. Prøv igen.')
        setLoading(false)
      }
    } catch {
      setError('Kunne ikke starte Google-oprettelse. Prøv igen.')
      setLoading(false)
    }
  }

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
        credentials: 'include',
        body: JSON.stringify({
          username,
          email,
          password,
          rememberMe: rememberMe && hasFunctionalStorageConsent(),
        }),
      })

      if (response.ok) {
        try {
          if (typeof window !== 'undefined') {
            const allowRemember = rememberMe && hasFunctionalStorageConsent()
            if (allowRemember) {
              window.localStorage.setItem('forgelab_remember_me', 'true')
              window.localStorage.setItem('forgelab_remember_username', username)
              document.cookie = `forgelab_remember_me=true; max-age=${60 * 60 * 24 * 365}; path=/`
            } else {
              window.localStorage.removeItem('forgelab_remember_me')
              window.localStorage.removeItem('forgelab_remember_username')
              document.cookie = 'forgelab_remember_me=; max-age=0; path=/'
            }
          }
        } catch {
          // Ignore storage errors
        }
        const payload = await response.json().catch(() => ({}))
        router.push(payload?.needsOnboarding ? '/onboarding' : '/dashboard')
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
      <div className="space-y-4 mb-6 auth-form-stagger">
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full px-6 py-3.5 bg-white text-gray-800 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.5-4.6 5.9l.1-.1 6.3 5.3C36.7 39.4 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Opret med Google
        </button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">eller med email</span>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-up-in">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
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
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:border-amber-400 transition-all duration-300 hover:border-amber-200"
            placeholder="Indtast email"
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

        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="registerStandaloneRememberMe"
              checked={rememberMe}
              disabled={!hasFunctionalStorageConsent()}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 focus:ring-2 disabled:opacity-40"
            />
            <label htmlFor="registerStandaloneRememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
              Husk mig i et år
            </label>
          </div>
          {!hasFunctionalStorageConsent() && (
            <p className="text-xs text-gray-500 pl-6">
              Kræver samtykke til valgfri browser-lagring. Vælg &quot;Accepter alle&quot; under cookies på forsiden.
            </p>
          )}
        </div>

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
