import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { isProjectOwner } from '@/lib/project-access'

function getBase(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

// GET — hent aktivt invite-link for projektet (kun owner)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const owner = await isProjectOwner(projectId, userId)
  if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('project_invite_links')
    .select('id, token, role, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  if (!data) return NextResponse.json({ link: null })

  return NextResponse.json({
    link: {
      id: data.id,
      token: data.token,
      role: data.role,
      createdAt: data.created_at,
      url: `${getBase(req)}/join/${data.token}`,
    },
  })
}

// POST — opret nyt invite-link (invaliderer IKKE gamle — eksisterende brugere beholder deres adgang)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const owner = await isProjectOwner(projectId, userId)
  if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const role: 'editor' | 'viewer' = body?.role === 'editor' ? 'editor' : 'viewer'

  const { data, error } = await supabase
    .from('project_invite_links')
    .insert({ project_id: projectId, role, created_by: userId })
    .select('id, token, role, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Kunne ikke oprette link' }, { status: 500 })

  return NextResponse.json({
    link: {
      id: data.id,
      token: data.token,
      role: data.role,
      createdAt: data.created_at,
      url: `${getBase(req)}/join/${data.token}`,
    },
  })
}

// DELETE — slet et specifikt invite-link (token i body)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const owner = await isProjectOwner(projectId, userId)
  if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const linkId = typeof body?.linkId === 'string' ? body.linkId : null
  if (!linkId) return NextResponse.json({ error: 'linkId mangler' }, { status: 400 })

  await supabase
    .from('project_invite_links')
    .delete()
    .eq('id', linkId)
    .eq('project_id', projectId)

  return NextResponse.json({ ok: true })
}
