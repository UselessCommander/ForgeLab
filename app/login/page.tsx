'use client'

import { Suspense } from 'react'
import AuthPageClient from './AuthPageClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400">Indlæser...</div>
        </div>
      }
    >
      <AuthPageClient />
    </Suspense>
  )
}
