import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/projects/[projectId] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch tools for the project
    const { data: tools, error: toolsError } = await supabase
      .from('project_tools')
      .select('tool_slug')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description || '',
      toolIds: (tools || []).map((t) => t.tool_slug),
      updatedAt: project.updated_at,
      createdAt: project.created_at,
    })
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[projectId] - Update a project
export async function PUT(
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
    const { name, description, toolIds } = body

    // Verify project belongs to user
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update project basic info
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description.trim() || ''

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)

      if (updateError) {
        console.error('Error updating project:', updateError)
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
      }
    }

    // Update tools if provided
    if (Array.isArray(toolIds)) {
      // Delete existing tools
      await supabase.from('project_tools').delete().eq('project_id', projectId)

      // Insert new tools with order
      if (toolIds.length > 0) {
        const toolsToInsert = toolIds.map((toolSlug: string, index: number) => ({
          project_id: projectId,
          tool_slug: toolSlug,
          order_index: index,
        }))

        const { error: toolsError } = await supabase.from('project_tools').insert(toolsToInsert)

        if (toolsError) {
          console.error('Error updating project tools:', toolsError)
          return NextResponse.json({ error: 'Failed to update project tools' }, { status: 500 })
        }
      }
    }

    // Fetch updated project
    const { data: updatedProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch updated project' }, { status: 500 })
    }

    // Fetch tools
    const { data: tools } = await supabase
      .from('project_tools')
      .select('tool_slug')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    return NextResponse.json({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description || '',
      toolIds: (tools || []).map((t) => t.tool_slug),
      updatedAt: updatedProject.updated_at,
      createdAt: updatedProject.created_at,
    })
  } catch (error) {
    console.error('Error in PUT /api/projects/[projectId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Verify project belongs to user
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete project (cascade will delete tools and tool_data)
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
