import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById, userNeedsOnboarding } from '@/lib/users'
import ProjectWorkspaceClient from './ProjectWorkspaceClient'

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')
  if (userId !== 'admin') {
    const user = await getUserById(userId)
    if (userNeedsOnboarding(userId, user)) redirect('/onboarding')
  }

  const { projectId } = await params
  return <ProjectWorkspaceClient projectId={projectId} />
}
