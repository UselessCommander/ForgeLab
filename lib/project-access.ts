import { supabase } from './supabase'

export type ProjectRole = 'owner' | 'editor' | 'viewer'

export async function getProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data.role as ProjectRole
}

export async function canViewProject(projectId: string, userId: string): Promise<boolean> {
  const role = await getProjectRole(projectId, userId)
  return !!role
}

export async function canEditProject(projectId: string, userId: string): Promise<boolean> {
  const role = await getProjectRole(projectId, userId)
  return role === 'owner' || role === 'editor'
}

export async function isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const role = await getProjectRole(projectId, userId)
  return role === 'owner'
}

