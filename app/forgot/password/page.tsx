import Link from 'next/link'
import PasswordResetRequestFormClient from './PasswordResetRequestFormClient'

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Glemt kodeord</h1>
        <p className="text-gray-600 mb-6">Indtast din email, så sender vi et reset-link.</p>
        <PasswordResetRequestFormClient />
        <Link href="/forgot" className="inline-block mt-6 text-sm text-gray-600 hover:text-amber-600">
          ← Tilbage
        </Link>
      </div>
    </main>
  )
}
