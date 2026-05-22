import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import MethodsPageClient from '@/components/metoder/MethodsPageClient'

export const metadata = {
  title: 'Metoder | ForgeLab',
  description: 'Metodebibliotek med Double Diamond, kategorier og favoritter.',
}

function MethodsFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 text-center text-sm text-gray-500">
      Indlæser metoder…
    </div>
  )
}

export default async function MetoderPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <Suspense fallback={<MethodsFallback />}>
      <MethodsPageClient />
    </Suspense>
  )
}
