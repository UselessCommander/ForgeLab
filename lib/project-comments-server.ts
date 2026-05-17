import { supabase } from '@/lib/supabase'

export type ProjectCommentRow = {
  id: string
  project_id: string
  parent_id: string | null
  user_id: string
  content: string
  position_x: number | null
  position_y: number | null
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  user?: { username: string } | null
}

export async function getCommentInProject(
  commentId: string,
  projectId: string
): Promise<Pick<ProjectCommentRow, 'id' | 'user_id' | 'project_id' | 'resolved'> | null> {
  const { data, error } = await supabase
    .from('project_comments')
    .select('id, user_id, project_id, resolved')
    .eq('id', commentId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data as Pick<ProjectCommentRow, 'id' | 'user_id' | 'project_id' | 'resolved'>
}

export async function parentCommentBelongsToProject(
  parentId: string,
  projectId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_comments')
    .select('id')
    .eq('id', parentId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  return !error && !!data
}
