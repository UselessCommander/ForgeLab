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
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      Log Ud
    </button>
  )
}
