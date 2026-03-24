import Link from 'next/link'

export default function ForgotPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Hjælp til login</h1>
        <p className="text-gray-600 mb-6">Vælg hvad du har brug for hjælp til.</p>

        <div className="space-y-3">
          <Link
            href="/forgot/username"
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Jeg har glemt mit brugernavn
          </Link>
          <Link
            href="/forgot/password"
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Jeg har glemt mit kodeord
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          >
            Tilbage til login
          </Link>
        </div>
      </div>
    </main>
  )
}
