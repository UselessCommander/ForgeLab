import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getProjectCommentsWithReplies } from '@/lib/comments'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const comments = await getProjectCommentsWithReplies(projectId)

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { content, parentId, userId, positionX, positionY } = await request.json()

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Content and userId are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        project_id: projectId,
        parent_id: parentId || null,
        user_id: userId,
        content: content.trim(),
        position_x: positionX || null,
        position_y: positionY || null,
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
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
