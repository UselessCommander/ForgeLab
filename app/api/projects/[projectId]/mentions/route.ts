import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { canViewProject } from '@/lib/project-access'
import { supabase } from '@/lib/supabase'

type MentionSourceType = 'comment' | 'board'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const sourceType: MentionSourceType = body?.sourceType === 'comment' ? 'comment' : 'board'
    const sourceId = String(body?.sourceId || '').trim()
    const mentionText = String(body?.mentionText || '').trim().slice(0, 1200)
    const mentionContext = String(body?.mentionContext || '').trim().slice(0, 600)
    const mentionedUserIds: string[] = Array.isArray(body?.mentionedUserIds)
      ? body.mentionedUserIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : []

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 })
    }
    if (mentionedUserIds.length === 0) {
      return NextResponse.json({ ok: true, created: 0 })
    }

    const uniqueMentionedUserIds = Array.from(
      new Set(mentionedUserIds.map((id) => id.trim()).filter((id) => id && id !== userId))
    )
    if (uniqueMentionedUserIds.length === 0) return NextResponse.json({ ok: true, created: 0 })

    const { data: memberRows, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .in('user_id', uniqueMentionedUserIds)

    if (membersError) {
      console.error('Error resolving project members for mentions:', membersError)
      return NextResponse.json({ error: 'Failed to resolve mentions' }, { status: 500 })
    }

    const memberSet = new Set((memberRows || []).map((m: { user_id: string }) => String(m.user_id)))
    const mentionRows = uniqueMentionedUserIds
      .filter((mentionedUserId) => memberSet.has(mentionedUserId))
      .map((mentionedUserId) => ({
        project_id: projectId,
        source_type: sourceType,
        source_id: sourceId,
        mentioned_user_id: mentionedUserId,
        mentioned_by_user_id: userId,
        mention_text: mentionText,
        mention_context: mentionContext,
        mentioned_at: new Date().toISOString(),
        read_at: null as string | null,
      }))

    if (mentionRows.length === 0) return NextResponse.json({ ok: true, created: 0 })

    const { error: upsertError } = await supabase
      .from('project_mentions')
      .upsert(mentionRows, { onConflict: 'project_id,source_type,source_id,mentioned_user_id' })

    if (upsertError) {
      console.error('Error upserting project mentions:', upsertError)
      return NextResponse.json({ error: 'Failed to save mentions' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, created: mentionRows.length })
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/mentions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
