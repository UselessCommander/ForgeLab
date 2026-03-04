import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST /api/projects/[projectId]/tools - Add a tool to a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { toolSlug } = body

    if (!toolSlug || typeof toolSlug !== 'string') {
      return NextResponse.json({ error: 'toolSlug is required' }, { status: 400 })
    }

    // Verify project belongs to user
    const { data: project, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (checkError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if tool already exists
    const { data: existing } = await supabase
      .from('project_tools')
      .select('id')
      .eq('project_id', projectId)
      .eq('tool_slug', toolSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Tool already in project' }, { status: 400 })
    }

    // Get current max order_index
    const { data: tools } = await supabase
      .from('project_tools')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrder = tools && tools.length > 0 ? (tools[0].order_index || 0) + 1 : 0

    // Add tool
    const { error: insertError } = await supabase.from('project_tools').insert({
      project_id: projectId,
      tool_slug: toolSlug,
      order_index: nextOrder,
    })

    if (insertError) {
      console.error('Error adding tool to project:', insertError)
      return NextResponse.json({ error: 'Failed to add tool' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/tools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

