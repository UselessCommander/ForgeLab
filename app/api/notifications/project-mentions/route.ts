import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type MentionRow = {
  id: string
  project_id: string
  source_type: 'comment' | 'board'
  source_id: string
  mentioned_user_id: string
  mentioned_by_user_id: string
  mention_text: string
  mention_context: string
  mentioned_at: string
  read_at: string | null
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: mentions, error: mentionError } = await supabase
      .from('project_mentions')
      .select(
        'id, project_id, source_type, source_id, mentioned_user_id, mentioned_by_user_id, mention_text, mention_context, mentioned_at, read_at'
      )
      .eq('mentioned_user_id', userId)
      .order('mentioned_at', { ascending: false })

    if (mentionError) {
      console.error('Error fetching mention notifications:', mentionError)
      return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 })
    }

    const projectIds = Array.from(new Set((mentions || []).map((m: MentionRow) => m.project_id)))
    const authorIds = Array.from(new Set((mentions || []).map((m: MentionRow) => m.mentioned_by_user_id)))

    const [projectResp, authorResp] = await Promise.all([
      projectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', projectIds)
        : Promise.resolve({ data: [], error: null as any }),
      authorIds.length > 0
        ? supabase.from('users').select('id, username, email').in('id', authorIds)
        : Promise.resolve({ data: [], error: null as any }),
    ])

    if (projectResp.error || authorResp.error) {
      console.error('Error resolving mention metadata:', projectResp.error || authorResp.error)
      return NextResponse.json({ error: 'Failed to resolve mention metadata' }, { status: 500 })
    }

    const projectNameById = new Map((projectResp.data || []).map((p: any) => [p.id, p.name || 'Projekt']))
    const authorById = new Map((authorResp.data || []).map((u: any) => [u.id, u]))

    const items = (mentions || []).map((mention: MentionRow) => {
      const author = authorById.get(mention.mentioned_by_user_id)
      const authorName =
        typeof author?.username === 'string' && author.username.trim()
          ? author.username.trim()
          : typeof author?.email === 'string' && author.email.trim()
            ? author.email.trim()
            : 'En kollega'

      return {
        id: mention.id,
        projectId: mention.project_id,
        projectName: projectNameById.get(mention.project_id) || 'Projekt',
        sourceType: mention.source_type,
        sourceId: mention.source_id,
        mentionedAt: mention.mentioned_at,
        readAt: mention.read_at,
        mentionedByName: authorName,
        mentionText: mention.mention_text || '',
        mentionContext: mention.mention_context || '',
      }
    })

    return NextResponse.json({
      items,
      unreadCount: items.filter((item) => !item.readAt).length,
    })
  } catch (error) {
    console.error('Error in GET /api/notifications/project-mentions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/project-mentions
// Body: { ids?: string[], markAll?: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : []
    const markAll = Boolean(body?.markAll)

    const nowIso = new Date().toISOString()
    let query = supabase
      .from('project_mentions')
      .update({ read_at: nowIso })
      .eq('mentioned_user_id', userId)
      .is('read_at', null)

    if (!markAll && ids.length > 0) {
      query = query.in('id', ids)
    }

    const { error } = await query
    if (error) {
      console.error('Error marking mentions as read:', error)
      return NextResponse.json({ error: 'Failed to mark mentions as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/notifications/project-mentions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
