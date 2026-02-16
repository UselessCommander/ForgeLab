import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { getCurrentUserId } from '@/lib/auth'
import RegisterFormClient from './RegisterFormClient'

export default async function RegisterPage() {
  const userId = await getCurrentUserId()

  if (userId) {
    return (
      <div className="min-h-screen bg-[#1a2f4a] flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a3f5a_1px,transparent_1px),linear-gradient(to_bottom,#2a3f5a_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
        </div>
        <div className="max-w-md w-full relative z-10">
          <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ForgeLabLogo size={48} />
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  ForgeLab
                </h1>
              </div>
              <p className="text-gray-300">Du er allerede logget ind</p>
            </div>
            <div className="p-4 bg-[#1a2f4a] border-2 border-green-600 rounded-lg mb-6">
              <p className="text-green-400 text-sm text-center">
                Du har allerede en aktiv session. Gå til dashboard for at bruge værktøjerne.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="block w-full text-center px-6 py-4 bg-[#F97316] text-white border-2 border-[#F97316] font-bold text-lg hover:bg-[#ea580c] transition-all duration-200"
            >
              Gå til dashboard
            </Link>
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-gray-400 hover:text-[#F97316] transition-colors text-sm"
              >
                ← Tilbage til forsiden
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a2f4a] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a3f5a_1px,transparent_1px),linear-gradient(to_bottom,#2a3f5a_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
      </div>
      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#2a3f5a] border-2 border-[#3a4f6a] p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ForgeLabLogo size={48} />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                ForgeLab
              </h1>
            </div>
            <p className="text-gray-300">Opret ny bruger</p>
          </div>
          <RegisterFormClient />
        </div>
      </div>
    </div>
  )
}
