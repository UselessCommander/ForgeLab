'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Fuldfører Google login...')

  useEffect(() => {
    const run = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) {
          router.replace('/login?error=google_auth_failed')
          return
        }

        const email = userData.user.email?.trim().toLowerCase()
        if (!email) {
          router.replace('/login?error=google_email_missing')
          return
        }

        const res = await fetch('/api/auth/oauth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (!res.ok) {
          router.replace('/login?error=google_not_linked')
          return
        }

        const payload = await res.json().catch(() => ({}))
        setStatus('Login lykkedes. Sender dig videre...')
        router.replace(payload?.needsOnboarding ? '/onboarding' : '/dashboard')
      } catch {
        router.replace('/login?error=google_auth_failed')
      }
    }

    void run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-sm text-gray-700">{status}</p>
      </div>
    </div>
  )
}
