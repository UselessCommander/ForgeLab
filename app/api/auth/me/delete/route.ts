import { NextResponse } from 'next/server'
import { getCurrentUserId, clearSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userId === 'admin') {
    return NextResponse.json({ error: 'Admin-kontoen kan ikke slettes' }, { status: 400 })
  }

  try {
    // 1. Slet brugerens projekter (og alt tilknyttet via CASCADE i DB)
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', userId)

    if (ownedProjects && ownedProjects.length > 0) {
      const projectIds = ownedProjects.map((p: { id: string }) => p.id)
      await supabase.from('project_members').delete().in('project_id', projectIds)
      await supabase.from('projects').delete().in('id', projectIds)
    }

    // 2. Fjern bruger fra projekter de er inviteret til
    await supabase.from('project_members').delete().eq('user_id', userId)

    // 3. Slet notifikationer
    await supabase.from('project_invite_notifications').delete().eq('user_id', userId)

    // 4. Slet selve brugeren
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Kunne ikke slette konto' }, { status: 500 })
    }

    // 5. Ryd session
    await clearSession()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/auth/me/delete:', err)
    return NextResponse.json({ error: 'Intern serverfejl' }, { status: 500 })
  }
}
