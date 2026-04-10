import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { normalizeFramework } from '@/lib/frameworks'

// GET /api/projects - Get all projects for current user
export async function GET(request: NextRequest) {
  try {
    // Early check: if Supabase env vars are missing, signal DB unavailable
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Database not configured', offline: true },
        { status: 503 }
      )
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all project ids where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', userId)

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const projectIds = (memberships || []).map((m) => m.project_id)
    if (projectIds.length === 0) {
      return NextResponse.json([])
    }

    const roleByProjectId = new Map((memberships || []).map((m) => [m.project_id, m.role]))

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('updated_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Fetch tools for each project
    const projectsWithTools = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: tools, error: toolsError } = await supabase
          .from('project_tools')
          .select('tool_slug, framework_phase')
          .eq('project_id', project.id)
          .order('order_index', { ascending: true })

        if (toolsError) {
          console.error('Error fetching project tools:', toolsError)
          return {
            ...project,
            toolIds: [],
          }
        }

        const toolPhases = Object.fromEntries(
          (tools || []).map((t) => [t.tool_slug, t.framework_phase || null])
        )

        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          toolIds: (tools || []).map((t) => t.tool_slug),
          framework: normalizeFramework(project.framework),
          toolPhases,
          role: roleByProjectId.get(project.id) || 'viewer',
          updatedAt: project.updated_at,
          createdAt: project.created_at,
        }
      })
    )

    return NextResponse.json(projectsWithTools)
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description = '', framework: frameworkRaw } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const framework = normalizeFramework(frameworkRaw)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || '',
        framework,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Add creator as owner member
    const { error: memberInsertError } = await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      role: 'owner',
    })

    if (memberInsertError) {
      console.error('Error creating project owner membership:', memberInsertError)
      // rollback project to avoid orphan project without owner
      await supabase.from('projects').delete().eq('id', project.id)
      return NextResponse.json({ error: 'Failed to create project membership' }, { status: 500 })
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description || '',
      toolIds: [],
      framework: normalizeFramework(project.framework),
      toolPhases: {},
      role: 'owner',
      updatedAt: project.updated_at,
      createdAt: project.created_at,
    })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
