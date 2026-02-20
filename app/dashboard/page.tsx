import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return <DashboardClient />
}
