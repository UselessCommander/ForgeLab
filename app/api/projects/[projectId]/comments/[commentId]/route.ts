import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getCommentInProject } from '@/lib/project-comments-server'
import { canViewProject } from '@/lib/project-access'
import { canResolveProjectComments } from '@/lib/project-permissions'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, commentId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existing = await getCommentInProject(commentId, projectId)
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('project_comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select(`
        *,
        user:users(username)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, commentId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const canResolve = await canResolveProjectComments(projectId, userId)
    if (!canResolve) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await getCommentInProject(commentId, projectId)
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const action = typeof body.action === 'string' ? body.action : ''

    let updateData: Record<string, unknown>
    if (action === 'resolve') {
      updateData = {
        resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } else if (action === 'unresolve') {
      updateData = {
        resolved: false,
        resolved_by: null,
        resolved_at: null,
        updated_at: new Date().toISOString(),
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "resolve" or "unresolve"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('project_comments')
      .update(updateData)
      .eq('id', commentId)
      .eq('project_id', projectId)
      .select(`
        *,
        user:users(username)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, commentId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existing = await getCommentInProject(commentId, projectId)
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('project_comments')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
