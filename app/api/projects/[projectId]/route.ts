import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canEditProject, canViewProject, getProjectRole, isProjectOwner } from '@/lib/project-access'
import { getDefaultPhaseForTool, normalizeFramework, type FrameworkPhase } from '@/lib/frameworks'

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

    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const role = await getProjectRole(projectId, userId)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch tools for the project
    const { data: tools, error: toolsError } = await supabase
      .from('project_tools')
      .select('tool_slug, framework_phase')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (toolsError) {
      return NextResponse.json({ error: 'Failed to fetch project tools' }, { status: 500 })
    }

    const toolPhases = Object.fromEntries(
      (tools || []).map((t) => [t.tool_slug, t.framework_phase || null])
    )

    const rawLayout = (project as { dd_canvas_layout?: Record<string, { x: number; y: number }> })
      .dd_canvas_layout

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description || '',
      toolIds: (tools || []).map((t) => t.tool_slug),
      framework: normalizeFramework(project.framework),
      toolPhases,
      ddCanvasLayout: rawLayout && typeof rawLayout === 'object' ? rawLayout : {},
      role: role || 'viewer',
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
    const { name, description, toolIds, framework, toolPhases, ddCanvasLayout } = body as {
      name?: string
      description?: string
      toolIds?: string[]
      framework?: string
      toolPhases?: Record<string, FrameworkPhase>
      ddCanvasLayout?: Record<string, { x: number; y: number }>
    }

    const canEdit = await canEditProject(projectId, userId)
    if (!canEdit) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update project basic info
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description.trim() || ''
    if (framework !== undefined) updates.framework = normalizeFramework(framework)
    if (ddCanvasLayout !== undefined && typeof ddCanvasLayout === 'object' && ddCanvasLayout !== null) {
      const cleaned: Record<string, { x: number; y: number }> = {}
      for (const [slug, pos] of Object.entries(ddCanvasLayout)) {
        if (
          pos &&
          typeof pos === 'object' &&
          typeof (pos as { x?: unknown }).x === 'number' &&
          typeof (pos as { y?: unknown }).y === 'number'
        ) {
          const x = (pos as { x: number }).x
          const y = (pos as { y: number }).y
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue
          cleaned[slug] = { x: Math.round(x), y: Math.round(y) }
        }
      }
      updates.dd_canvas_layout = cleaned
    }

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

    const { data: currentProject, error: currentProjectError } = await supabase
      .from('projects')
      .select('framework')
      .eq('id', projectId)
      .single()

    if (currentProjectError) {
      return NextResponse.json({ error: 'Failed to fetch project framework' }, { status: 500 })
    }

    const effectiveFramework = normalizeFramework(updates.framework ?? currentProject.framework)

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
          framework_phase: toolPhases?.[toolSlug] ?? getDefaultPhaseForTool(effectiveFramework, toolSlug),
        }))

        const { error: toolsError } = await supabase.from('project_tools').insert(toolsToInsert)

        if (toolsError) {
          console.error('Error updating project tools:', toolsError)
          return NextResponse.json({ error: 'Failed to update project tools' }, { status: 500 })
        }
      }
    }

    if (!Array.isArray(toolIds) && toolPhases && typeof toolPhases === 'object') {
      for (const [toolSlug, phase] of Object.entries(toolPhases)) {
        const { error: phaseUpdateError } = await supabase
          .from('project_tools')
          .update({ framework_phase: phase ?? getDefaultPhaseForTool(effectiveFramework, toolSlug) })
          .eq('project_id', projectId)
          .eq('tool_slug', toolSlug)

        if (phaseUpdateError) {
          return NextResponse.json({ error: 'Failed to update tool phase' }, { status: 500 })
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
      .select('tool_slug, framework_phase')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    const updatedToolPhases = Object.fromEntries(
      (tools || []).map((t) => [t.tool_slug, t.framework_phase || null])
    )

    const outLayout = (updatedProject as { dd_canvas_layout?: Record<string, { x: number; y: number }> })
      .dd_canvas_layout

    return NextResponse.json({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description || '',
      toolIds: (tools || []).map((t) => t.tool_slug),
      framework: normalizeFramework(updatedProject.framework),
      toolPhases: updatedToolPhases,
      ddCanvasLayout: outLayout && typeof outLayout === 'object' ? outLayout : {},
      role: (await getProjectRole(projectId, userId)) || 'viewer',
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

    const owner = await isProjectOwner(projectId, userId)
    if (!owner) {
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
