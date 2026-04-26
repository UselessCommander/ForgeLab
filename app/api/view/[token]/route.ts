import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public GET — hent read-only projektdata via viewer-token, kræver IKKE login
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
  if (link.role !== 'viewer') return NextResponse.json({ error: 'Dette link kræver login.' }, { status: 403 })
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Linket er udløbet' }, { status: 410 })
  }

  const projectId = link.project_id

  const [{ data: project }, { data: tools }, { data: members }] = await Promise.all([
    supabase.from('projects').select('id, name, description, framework, updated_at').eq('id', projectId).maybeSingle(),
    supabase.from('project_tools').select('tool_slug, framework_phase').eq('project_id', projectId),
    supabase.from('project_members').select('role').eq('project_id', projectId),
  ])

  if (!project) return NextResponse.json({ error: 'Projekt ikke fundet' }, { status: 404 })

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      framework: project.framework || null,
      updatedAt: project.updated_at,
      toolCount: (tools || []).length,
      memberCount: (members || []).length,
      tools: (tools || []).map(t => t.tool_slug),
    },
  })
}
