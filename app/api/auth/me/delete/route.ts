import { NextResponse } from 'next/server'
import { getCurrentUserId, clearSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

async function deleteUserOwnedProjects(userId: string): Promise<void> {
  const projectIds = new Set<string>()

  const { data: ownedMemberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)
    .eq('role', 'owner')

  ownedMemberships?.forEach((row: { project_id: string }) => projectIds.add(row.project_id))

  const { data: legacyOwned } = await supabase.from('projects').select('id').eq('user_id', userId)
  legacyOwned?.forEach((row: { id: string }) => projectIds.add(row.id))

  if (projectIds.size === 0) return

  const ids = Array.from(projectIds)
  await supabase.from('projects').delete().in('id', ids)
}

export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userId === 'admin') {
    return NextResponse.json({ error: 'Admin-kontoen kan ikke slettes' }, { status: 400 })
  }

  try {
    await deleteUserOwnedProjects(userId)

    await supabase.from('project_members').delete().eq('user_id', userId)
    await supabase.from('workspaces').delete().eq('user_id', userId)
    await supabase.from('qr_codes').delete().eq('user_id', userId)
    await supabase.from('ab_tests').delete().eq('user_id', userId)
    await supabase.from('surveys').delete().eq('owner_user_id', userId)
    await supabase.from('project_invitations').delete().eq('invited_user_id', userId)
    await supabase.from('project_invitations').delete().eq('invited_by_user_id', userId)
    await supabase.from('project_mentions').delete().eq('mentioned_user_id', userId)
    await supabase.from('project_mentions').delete().eq('mentioned_by_user_id', userId)

    const { error: inviteNotifError } = await supabase
      .from('project_invite_notifications')
      .delete()
      .eq('user_id', userId)
    if (inviteNotifError && inviteNotifError.code !== '42P01') {
      console.warn('project_invite_notifications cleanup:', inviteNotifError.message)
    }

    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Kunne ikke slette konto' }, { status: 500 })
    }

    await clearSession()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/auth/me/delete:', err)
    return NextResponse.json({ error: 'Intern serverfejl' }, { status: 500 })
  }
}
