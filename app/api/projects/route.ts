import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/projects - Get all projects for current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
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
          .select('tool_slug')
          .eq('project_id', project.id)
          .order('order_index', { ascending: true })

        if (toolsError) {
          console.error('Error fetching project tools:', toolsError)
          return {
            ...project,
            toolIds: [],
          }
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          toolIds: (tools || []).map((t) => t.tool_slug),
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
    const { name, description = '' } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || '',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description || '',
      toolIds: [],
      updatedAt: project.updated_at,
      createdAt: project.created_at,
    })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
