import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// DELETE /api/projects/[projectId]/tools/[toolSlug] - Remove a tool from a project
export async function DELETE(
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

    // Remove tool
    const { error: deleteError } = await supabase
      .from('project_tools')
      .delete()
      .eq('project_id', projectId)
      .eq('tool_slug', toolSlug)

    if (deleteError) {
      console.error('Error removing tool from project:', deleteError)
      return NextResponse.json({ error: 'Failed to remove tool' }, { status: 500 })
    }

    // Also delete tool data if it exists
    await supabase
      .from('project_tool_data')
      .delete()
      .eq('project_id', projectId)
      .eq('tool_slug', toolSlug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/tools/[toolSlug]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
