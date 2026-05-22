import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import WorkspacesPageClient from '@/components/platform/WorkspacesPageClient'

export const metadata = {
  title: 'Workspaces | ForgeLab',
  description: 'Organiser projekter for teams, fag eller kunder.',
}

export default async function WorkspacesPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return <WorkspacesPageClient />
}
