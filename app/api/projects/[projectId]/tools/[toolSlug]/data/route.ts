import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/projects/[projectId]/tools/[toolSlug]/data - Get tool data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; toolSlug: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, toolSlug } = await params

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

    // Get tool data
    const { data: toolData, error: dataError } = await supabase
      .from('project_tool_data')
      .select('data')
      .eq('project_id', projectId)
      .eq('tool_slug', toolSlug)
      .single()

    if (dataError && dataError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching tool data:', dataError)
      return NextResponse.json({ error: 'Failed to fetch tool data' }, { status: 500 })
    }

    return NextResponse.json({ data: toolData?.data || {} })
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/tools/[toolSlug]/data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[projectId]/tools/[toolSlug]/data - Save tool data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; toolSlug: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, toolSlug } = await params
    const body = await request.json()
    const { data } = body

    if (data === undefined) {
      return NextResponse.json({ error: 'data is required' }, { status: 400 })
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

    // Upsert tool data
    const { error: upsertError } = await supabase
      .from('project_tool_data')
      .upsert(
        {
          project_id: projectId,
          tool_slug: toolSlug,
          data: data,
        },
        {
          onConflict: 'project_id,tool_slug',
        }
      )

    if (upsertError) {
      console.error('Error saving tool data:', upsertError)
      return NextResponse.json({ error: 'Failed to save tool data' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/projects/[projectId]/tools/[toolSlug]/data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
