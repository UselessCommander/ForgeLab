import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import ProjectsPageClient from '@/components/platform/ProjectsPageClient'

export const metadata = {
  title: 'Projekter | ForgeLab',
  description: 'Alle dine ForgeLab-projekter samlet.',
}

export default async function ProjekterPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return <ProjectsPageClient />
}
