import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
    const { content, userId } = await request.json()

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Content and userId are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('project_comments')
      .update({
        content: content.trim(),
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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'UserId and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

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
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('project_comments')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
