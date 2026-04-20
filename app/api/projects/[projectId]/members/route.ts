import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canViewProject, isProjectOwner } from '@/lib/project-access'
import { sendEmail } from '@/lib/email'
import { renderProjectInvitationEmail } from '@/lib/email-templates'

type Role = 'owner' | 'editor' | 'viewer'

function getBaseUrlFromRequest(request: NextRequest): string {
  const fromEnv = process.env.BASE_URL?.trim()
  if (fromEnv) return fromEnv
  return request.nextUrl.origin
}

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
    const { data: users } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .in('id', memberUserIds)
    const userById = new Map((users || []).map((u) => [u.id, u]))

    return NextResponse.json(
      (members || []).map((m) => ({
        ...m,
        username: userById.get(m.user_id)?.username || m.user_id,
        email: userById.get(m.user_id)?.email || null,
        avatar_url: userById.get(m.user_id)?.avatar_url || null,
      }))
    )
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[projectId]/members
// Body: { email: string, role?: 'editor' | 'viewer' }
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
    const email = String(body?.email || '').trim().toLowerCase()
    const role: Role = body?.role === 'viewer' ? 'viewer' : body?.role === 'editor' ? 'editor' : 'editor'

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const { data: userRows, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('email', email)
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

    const { error: inviteUpsertError } = await supabase
      .from('project_invitations')
      .upsert(
        {
          project_id: projectId,
          invited_user_id: invitedUser.id,
          invited_by_user_id: userId,
          role,
          invited_at: new Date().toISOString(),
          read_at: null,
          accepted_at: null,
        },
        { onConflict: 'project_id,invited_user_id' }
      )

    if (inviteUpsertError) {
      console.error('Error creating/updating project invitation:', inviteUpsertError)
    }

    const [{ data: projectRow }, { data: inviterRow }] = await Promise.all([
      supabase.from('projects').select('name').eq('id', projectId).single(),
      supabase.from('users').select('username, email').eq('id', userId).single(),
    ])

    const projectName =
      typeof projectRow?.name === 'string' && projectRow.name.trim() ? projectRow.name.trim() : 'Projekt'
    const inviterName =
      typeof inviterRow?.username === 'string' && inviterRow.username.trim()
        ? inviterRow.username.trim()
        : typeof inviterRow?.email === 'string' && inviterRow.email.trim()
          ? inviterRow.email.trim()
          : 'En kollega'

    const projectUrl = `${getBaseUrlFromRequest(request)}/dashboard/projects/${projectId}`
    let inviteEmailSent = false

    if (invitedUser.email) {
      try {
        await sendEmail({
          to: invitedUser.email,
          subject: `Du er inviteret til projektet "${projectName}" i ForgeLab`,
          html: renderProjectInvitationEmail({
            invitedByName: inviterName,
            projectName,
            role: role === 'viewer' ? 'viewer' : 'editor',
            projectUrl,
          }),
        })
        inviteEmailSent = true
      } catch (emailError) {
        console.error('Failed to send project invite email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      userId: invitedUser.id,
      username: invitedUser.username,
      email: invitedUser.email,
      role,
      inviteEmailSent,
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

