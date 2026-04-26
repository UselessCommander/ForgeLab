import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST — brug et invite-token til at joine projektet
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params

  // Find invite link
  const { data: link, error: linkError } = await supabase
    .from('project_invite_links')
    .select('id, project_id, role, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (linkError || !link) {
    return NextResponse.json({ error: 'Ugyldigt eller udløbet invitationslink.' }, { status: 404 })
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Dette invitationslink er udløbet.' }, { status: 410 })
  }

  const { project_id: projectId, role } = link

  // Hent projekt-info til at returnere
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .maybeSingle()

  // Tjek om brugeren allerede er medlem
  const { data: existing } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Allerede medlem — bare redirect
    return NextResponse.json({ ok: true, projectId, projectName: project?.name, alreadyMember: true, role: existing.role })
  }

  // Tilføj som medlem
  const { error: insertError } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role })

  if (insertError) {
    return NextResponse.json({ error: 'Kunne ikke tilføje dig til projektet.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, projectId, projectName: project?.name, role })
}

// GET — hent info om et invite-link (til preview inden join)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: link } = await supabase
    .from('project_invite_links')
    .select('project_id, role, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!link) return NextResponse.json({ error: 'Ugyldigt link' }, { status: 404 })
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Linket er udløbet' }, { status: 410 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', link.project_id)
    .maybeSingle()

  return NextResponse.json({
    projectId: link.project_id,
    projectName: project?.name || 'Projekt',
    role: link.role,
  })
}
