import { createClient } from '@supabase/supabase-js'

// Mock Supabase client for development without environment variables
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  : {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: [],
              error: new Error('Supabase not configured')
            })
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({
            data: null,
            error: new Error('Supabase not configured')
          })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({
              data: null,
              error: new Error('Supabase not configured')
            })
          })
        })
      }),
      delete: () => ({
        eq: () => ({
          error: null
        })
      })
    } as any

export interface ProjectComment {
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
  replies?: ProjectComment[]
  user?: {
    username: string
  }
}

export async function getProjectComments(
  projectId: string,
  parentId: string | null = null
): Promise<ProjectComment[]> {
  const { data, error } = await supabase
    .from('project_comments')
    .select(`
      *,
      user:users(username)
    `)
    .eq('project_id', projectId)
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getProjectCommentsWithReplies(
  projectId: string
): Promise<ProjectComment[]> {
  const { data, error } = await supabase
    .from('project_comments')
    .select(`
      *,
      user:users(username)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data) return []

  // Build nested structure
  const commentsMap = new Map<string, ProjectComment>()
  const rootComments: ProjectComment[] = []

  // First pass: create map of all comments
  data.forEach(comment => {
    commentsMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build hierarchy
  data.forEach(comment => {
    const commentWithReplies = commentsMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentsMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(commentWithReplies)
      }
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}

export async function createProjectComment(
  projectId: string,
  userId: string,
  content: string,
  options?: {
    parentId?: string
    positionX?: number
    positionY?: number
  }
): Promise<ProjectComment> {
  const { data, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      parent_id: options?.parentId || null,
      user_id: userId,
      content: content.trim(),
      position_x: options?.positionX || null,
      position_y: options?.positionY || null,
    })
    .select(`
      *,
      user:users(username)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateProjectComment(
  commentId: string,
  userId: string,
  content: string
): Promise<ProjectComment> {
  const { data, error } = await supabase
    .from('project_comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select(`
      *,
      user:users(username)
    `)
    .single()

  if (error) throw error
  return data
}

export async function resolveProjectComment(
  commentId: string,
  userId: string
): Promise<ProjectComment> {
  const { data, error } = await supabase
    .from('project_comments')
    .update({
      resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      user:users(username)
    `)
    .single()

  if (error) throw error
  return data
}

export async function unresolveProjectComment(
  commentId: string,
  userId: string
): Promise<ProjectComment> {
  const { data, error } = await supabase
    .from('project_comments')
    .update({
      resolved: false,
      resolved_by: null,
      resolved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select(`
      *,
      user:users(username)
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteProjectComment(
  commentId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('project_comments')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}
