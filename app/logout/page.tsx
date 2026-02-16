'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    }
    logout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <p className="text-gray-600">Logger ud...</p>
      </div>
    </div>
  )
}
