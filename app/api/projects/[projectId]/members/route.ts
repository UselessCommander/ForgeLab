import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canViewProject, isProjectOwner } from '@/lib/project-access'

type Role = 'owner' | 'editor' | 'viewer'

// GET /api/projects/[projectId]/members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: members, error } = await supabase
      .from('project_members')
      .select('user_id, role, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching project members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    const memberUserIds = (members || []).map((m) => m.user_id)
    const { data: users } = await supabase.from('users').select('id, username').in('id', memberUserIds)
    const usernameById = new Map((users || []).map((u) => [u.id, u.username]))

    return NextResponse.json(
      (members || []).map((m) => ({
        ...m,
        username: usernameById.get(m.user_id) || m.user_id,
      }))
    )
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/members
// Body: { username: string, role?: 'editor' | 'viewer' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params
    const owner = await isProjectOwner(projectId, userId)
    if (!owner) return NextResponse.json({ error: 'Only owner can invite members' }, { status: 403 })

    const body = await request.json()
    const username = String(body?.username || '').trim()
    const role: Role = body?.role === 'viewer' ? 'viewer' : body?.role === 'editor' ? 'editor' : 'editor'

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    const { data: userRows, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', username)
      .limit(1)

    if (userError) {
      console.error('Error finding user for invite:', userError)
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    const invitedUser = userRows?.[0]
    if (!invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: upsertError } = await supabase
      .from('project_members')
      .upsert(
        {
          project_id: projectId,
          user_id: invitedUser.id,
          role,
        },
        { onConflict: 'project_id,user_id' }
      )

    if (upsertError) {
      console.error('Error adding project member:', upsertError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: invitedUser.id,
      username: invitedUser.username,
      role,
    })
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId]/members
// Body: { userId: string }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params
    const owner = await isProjectOwner(projectId, userId)
    if (!owner) return NextResponse.json({ error: 'Only owner can remove members' }, { status: 403 })

    const body = await request.json()
    const removeUserId = String(body?.userId || '').trim()
    if (!removeUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: targetMembership, error: targetErr } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', removeUserId)
      .single()

    if (targetErr || !targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMembership.role === 'owner') {
      return NextResponse.json({ error: 'Owner cannot be removed' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', removeUserId)

    if (deleteError) {
      console.error('Error removing project member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

