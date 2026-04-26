import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })

  const ws = workspaces || []
  if (ws.length === 0) return NextResponse.json([])

  const workspaceIds = ws.map((w) => w.id)
  const { data: links } = await supabase
    .from('workspace_projects')
    .select('workspace_id, project_id')
    .in('workspace_id', workspaceIds)

  const projectIdsByWorkspace: Record<string, string[]> = {}
  for (const link of links || []) {
    if (!projectIdsByWorkspace[link.workspace_id]) projectIdsByWorkspace[link.workspace_id] = []
    projectIdsByWorkspace[link.workspace_id].push(link.project_id)
  }

  return NextResponse.json(
    ws.map((w) => ({
      id: w.id,
      name: w.name,
      color: w.color || '#6366f1',
      projectIds: projectIdsByWorkspace[w.id] || [],
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }))
  )
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, color } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('workspaces')
    .insert({ user_id: userId, name: name.trim(), color: color || '#6366f1' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })

  return NextResponse.json({
    id: data.id,
    name: data.name,
    color: data.color,
    projectIds: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })
}
