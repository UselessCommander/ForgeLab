import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST — add project to workspace
export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const { projectId } = await request.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .single()
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { error } = await supabase
    .from('workspace_projects')
    .upsert({ workspace_id: workspaceId, project_id: projectId })

  if (error) return NextResponse.json({ error: 'Failed to add project' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const { projectId } = await request.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { error } = await supabase
    .from('workspace_projects')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('project_id', projectId)

  if (error) return NextResponse.json({ error: 'Failed to remove project' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
