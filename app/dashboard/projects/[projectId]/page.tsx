import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import ProjectWorkspaceClient from './ProjectWorkspaceClient'

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const { projectId } = await params
  return <ProjectWorkspaceClient projectId={projectId} />
}
