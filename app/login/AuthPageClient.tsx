'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import AuthGraphic from '@/components/AuthGraphic'

function LoginFormInner({
  onSwitchToRegister,
  isVisible,
}: {
  onSwitchToRegister: () => void
  isVisible: boolean
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hvis brugeren allerede har en gyldig session-cookie, så send direkte til dashboard
  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data.authenticated) {
          router.replace('/dashboard')
        }
      } catch {
        // Ignorer fejl – brugeren kan altid logge ind manuelt
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedRemember = window.localStorage.getItem('forgelab_remember_me')
      const storedUsername = window.localStorage.getItem('forgelab_remember_username')
      if (storedRemember === 'true') {
        setRememberMe(true)
        if (storedUsername) {
          setUsername(storedUsername)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      })
      if (response.ok) {
        try {
          if (typeof window !== 'undefined') {
            if (rememberMe) {
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
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Forkert brugernavn eller password')
      }
    } catch {
      setError('Fejl ved login. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`h-full flex flex-col justify-center px-8 md:px-12 lg:px-20 transition-opacity duration-400 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-3 mb-10">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ForgeLabLogo size={28} />
          </div>
          <span className="text-xl font-semibold text-gray-900">ForgeLab</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Log ind</h1>
        <p className="text-gray-500 mb-6">
          Har du ikke en konto?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Opret bruger
          </button>
        </p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brugernavn</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all hover:border-amber-200"
              placeholder="Indtast brugernavn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all hover:border-amber-200"
              placeholder="Indtast password"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
              Husk mig i et år
            </label>
          </div>
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700 text-sm">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logger ind...' : 'Log ind'}
          </button>
        </form>
        <Link
          href="/"
          className="block mt-6 text-gray-500 hover:text-amber-700 text-sm font-medium transition-colors"
        >
          ← Tilbage til forsiden
        </Link>
      </div>
    </div>
  )
}

function RegisterFormInner({
  onSwitchToLogin,
  isVisible,
}: {
  onSwitchToLogin: () => void
  isVisible: boolean
}) {
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
        headers: { 'Content-Type': 'application/json' },
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
    <div
      className={`h-full flex flex-col justify-center px-8 md:px-12 lg:px-20 transition-opacity duration-400 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative z-10 w-full max-w-md ml-auto">
        <Link href="/" className="inline-flex items-center gap-3 mb-10">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ForgeLabLogo size={28} />
          </div>
          <span className="text-xl font-semibold text-gray-900">ForgeLab</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Opret bruger</h1>
        <p className="text-gray-500 mb-6">
          Har du allerede en konto?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Log ind
          </button>
        </p>
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brugernavn</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-3 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all hover:border-amber-200"
              placeholder="Indtast brugernavn (min. 3 tegn)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all hover:border-amber-200"
              placeholder="Indtast password (min. 6 tegn)"
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
              className="w-full px-4 py-3 bg-white/80 border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all hover:border-amber-200"
              placeholder="Bekræft password"
            />
          </div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opretter bruger...' : 'Opret bruger'}
          </button>
        </form>
        <Link
          href="/"
          className="block mt-6 text-gray-500 hover:text-amber-700 text-sm font-medium transition-colors"
        >
          ← Tilbage til forsiden
        </Link>
      </div>
    </div>
  )
}

export default function AuthPageClient() {
  const searchParams = useSearchParams()
  const [isRegister, setIsRegister] = useState(
    () => searchParams.get('mode') === 'register'
  )
  useEffect(() => {
    setIsRegister(searchParams.get('mode') === 'register')
  }, [searchParams])

  // Horizontal strip: [LoginForm | Graphic | RegisterForm]
  // Each panel = 50vw. Login: show panels 1+2. Register: show panels 2+3.
  return (
    <div className="min-h-screen w-full overflow-hidden">
      <div
        className="flex h-screen transition-transform duration-500 ease-in-out"
        style={{
          width: '150vw',
          transform: isRegister ? 'translateX(-50vw)' : 'translateX(0)',
        }}
      >
        {/* Panel 1: Login form (left when login) - matches landing bg */}
        <div className="relative w-[50vw] min-h-screen flex-shrink-0 bg-[#fafbfc] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-gray-400">Indlæser...</div>
            }
          >
            <LoginFormInner
              onSwitchToRegister={() => setIsRegister(true)}
              isVisible={!isRegister}
            />
          </Suspense>
        </div>

        {/* Panel 2: Graphic (right when login, left when register) */}
        <div className="relative w-[50vw] h-screen min-h-screen flex-shrink-0">
          <AuthGraphic />
        </div>

        {/* Panel 3: Register form (right when register) - matches landing bg */}
        <div className="relative w-[50vw] min-h-screen flex-shrink-0 bg-[#fafbfc] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />
          <RegisterFormInner
            onSwitchToLogin={() => setIsRegister(false)}
            isVisible={isRegister}
          />
        </div>
      </div>
    </div>
  )
}
