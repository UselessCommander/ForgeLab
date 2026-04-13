import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById, userNeedsOnboarding } from '@/lib/users'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')
  if (userId === 'admin') redirect('/dashboard')

  const user = await getUserById(userId)
  if (!user) redirect('/login')
  if (!userNeedsOnboarding(userId, user)) redirect('/dashboard')

  return <OnboardingClient />
}
