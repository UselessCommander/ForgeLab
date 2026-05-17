import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getProjectCommentsWithReplies } from '@/lib/comments'
import { parentCommentBelongsToProject } from '@/lib/project-comments-server'
import { canViewProject } from '@/lib/project-access'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const comments = await getProjectCommentsWithReplies(projectId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null
    const positionX =
      typeof body.positionX === 'number' && Number.isFinite(body.positionX) ? body.positionX : null
    const positionY =
      typeof body.positionY === 'number' && Number.isFinite(body.positionY) ? body.positionY : null

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (parentId) {
      const parentOk = await parentCommentBelongsToProject(parentId, projectId)
      if (!parentOk) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        project_id: projectId,
        parent_id: parentId,
        user_id: userId,
        content,
        position_x: positionX,
        position_y: positionY,
      })
      .select(`
        *,
        user:users(username)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
