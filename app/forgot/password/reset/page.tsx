import { Suspense } from 'react'
import Link from 'next/link'
import PasswordResetConfirmFormClient from './PasswordResetConfirmFormClient'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Nulstil kodeord</h1>
        <p className="text-gray-600 mb-6">Vælg et nyt kodeord.</p>
        <Suspense fallback={<p className="text-sm text-gray-500">Indlæser...</p>}>
          <PasswordResetConfirmFormClient />
        </Suspense>
        <Link href="/login" className="inline-block mt-6 text-sm text-gray-600 hover:text-amber-600">
          ← Tilbage til login
        </Link>
      </div>
    </main>
  )
}
