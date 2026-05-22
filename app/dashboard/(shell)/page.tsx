import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById, userNeedsOnboarding } from '@/lib/users'
import DashboardClient from '../DashboardClient'

export default async function DashboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')
  if (userId !== 'admin') {
    const user = await getUserById(userId)
    if (userNeedsOnboarding(userId, user)) redirect('/onboarding')
  }

  return <DashboardClient />
}
