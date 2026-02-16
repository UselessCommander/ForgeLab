'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      // Hvis logout fejler, redirect alligevel
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
    >
      Log Ud
    </button>
  )
}
