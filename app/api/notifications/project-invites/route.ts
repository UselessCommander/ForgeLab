import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type InviteRole = 'editor' | 'viewer'

type InviteRow = {
  id: string
  project_id: string
  invited_user_id: string
  invited_by_user_id: string
  role: InviteRole
  invited_at: string
  read_at: string | null
  accepted_at: string | null
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: invites, error: inviteError } = await supabase
      .from('project_invitations')
      .select('id, project_id, invited_user_id, invited_by_user_id, role, invited_at, read_at, accepted_at')
      .eq('invited_user_id', userId)
      .order('invited_at', { ascending: false })

    if (inviteError) {
      console.error('Error fetching project invites:', inviteError)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    const projectIds = Array.from(new Set((invites || []).map((i: InviteRow) => i.project_id)))
    const inviterIds = Array.from(new Set((invites || []).map((i: InviteRow) => i.invited_by_user_id)))

    const [projectResp, inviterResp] = await Promise.all([
      projectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', projectIds)
        : Promise.resolve({ data: [], error: null as any }),
      inviterIds.length > 0
        ? supabase.from('users').select('id, username, email').in('id', inviterIds)
        : Promise.resolve({ data: [], error: null as any }),
    ])

    if (projectResp.error || inviterResp.error) {
      console.error('Error resolving invite metadata:', projectResp.error || inviterResp.error)
      return NextResponse.json({ error: 'Failed to resolve invite metadata' }, { status: 500 })
    }

    const projectNameById = new Map((projectResp.data || []).map((p: any) => [p.id, p.name || 'Projekt']))
    const inviterById = new Map((inviterResp.data || []).map((u: any) => [u.id, u]))

    const items = (invites || []).map((invite: InviteRow) => {
      const inviter = inviterById.get(invite.invited_by_user_id)
      const inviterName =
        typeof inviter?.username === 'string' && inviter.username.trim()
          ? inviter.username.trim()
          : typeof inviter?.email === 'string' && inviter.email.trim()
            ? inviter.email.trim()
            : 'En kollega'

      return {
        id: invite.id,
        projectId: invite.project_id,
        projectName: projectNameById.get(invite.project_id) || 'Projekt',
        role: invite.role,
        invitedAt: invite.invited_at,
        readAt: invite.read_at,
        acceptedAt: invite.accepted_at,
        invitedByName: inviterName,
      }
    })

    return NextResponse.json({
      items,
      unreadCount: items.filter((item) => !item.readAt).length,
    })
  } catch (error) {
    console.error('Error in GET /api/notifications/project-invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/project-invites
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
      .from('project_invitations')
      .update({ read_at: nowIso })
      .eq('invited_user_id', userId)
      .is('read_at', null)

    if (!markAll && ids.length > 0) {
      query = query.in('id', ids)
    }

    const { error } = await query
    if (error) {
      console.error('Error marking invites as read:', error)
      return NextResponse.json({ error: 'Failed to mark invites as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/notifications/project-invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
