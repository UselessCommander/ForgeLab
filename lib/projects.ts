/**
 * Project & tool association - Database-backed via API
 * Supports: projects, project_tools, per-project tool state
 */
import type { FrameworkId, FrameworkPhase } from '@/lib/frameworks'

/** Normaliseret placering af ikon på Double Diamond-canvas (0–1 i forhold til viewBox-bredde/højde) */
export type DdCanvasPosition = { x: number; y: number }

export interface Project {
  id: string
  name: string
  description: string
  toolIds: string[]
  framework?: FrameworkId
  toolPhases?: Record<string, FrameworkPhase>
  /** Manuelle ikonpositioner (slug → { x, y } i 0–1) */
  ddCanvasLayout?: Record<string, DdCanvasPosition>
  role?: 'owner' | 'editor' | 'viewer'
  updatedAt: string
  createdAt: string
}

export interface ProjectMember {
  user_id: string
  username?: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
}

// GET /api/projects - Get all projects for current user
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetch('/api/projects', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, return empty array
        return []
      }
      throw new Error(`Failed to fetch projects: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

// POST /api/projects - Create a new project
export async function createProject(name: string, description: string = ''): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create project' }))
    throw new Error(error.error || 'Failed to create project')
  }

  return await response.json()
}

// GET /api/projects/[projectId] - Get a single project
export async function getProject(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 404 || response.status === 503 || response.status >= 500) {
        return null // If offline or not found, return null and let demo mode handle it
      }
      throw new Error(`Failed to fetch project: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

// PUT /api/projects/[projectId] - Update a project
export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'toolIds' | 'framework' | 'toolPhases' | 'ddCanvasLayout'>>
): Promise<Project | null> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    if (response.status === 404 || response.status === 503 || response.status >= 500) {
      return null
    }
    const error = await response.json().catch(() => ({ error: 'Failed to update project' }))
    // Console log instead of throwing so it doesn't crash the browser overlay
    console.error(error.error || 'Failed to update project')
    return null
  }

  return await response.json()
}

// DELETE /api/projects/[projectId] - Delete a project
export async function deleteProject(id: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      return false
    }
    throw new Error('Failed to delete project')
  }

  return true
}

// POST /api/projects/[projectId]/tools - Add a tool to a project
export async function addToolToProject(projectId: string, toolId: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/tools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ toolSlug: toolId }),
  })

  if (!response.ok) {
    if (response.status === 400) {
      // Tool already exists or invalid request
      return false
    }
    throw new Error('Failed to add tool to project')
  }

  return true
}

// DELETE /api/projects/[projectId]/tools/[toolSlug] - Remove a tool from a project
export async function removeToolFromProject(projectId: string, toolId: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/tools/${toolId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      return false
    }
    throw new Error('Failed to remove tool from project')
  }

  return true
}

// PUT /api/projects/[projectId] - Reorder tools (update toolIds array)
export async function reorderProjectTools(projectId: string, toolIds: string[]): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ toolIds }),
  })

  if (!response.ok) {
    throw new Error('Failed to reorder project tools')
  }

  return true
}

export async function updateProjectToolPhases(
  projectId: string,
  toolPhases: Record<string, FrameworkPhase>
): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ toolPhases }),
  })

  if (!response.ok) {
    throw new Error('Failed to update project tool phases')
  }

  return true
}

// GET /api/projects/[projectId]/tools/[toolSlug]/data - Get tool data
export async function getProjectToolData(
  projectId: string,
  toolSlug: string
): Promise<Record<string, any>> {
  try {
    const response = await fetch(`/api/projects/${projectId}/tools/${toolSlug}/data`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 404 || response.status === 503 || response.status >= 500) {
        // Fallback to local storage for demo mode
        const saved = localStorage.getItem(`forgelab_demo_tool_${projectId}_${toolSlug}`)
        return saved ? JSON.parse(saved) : {}
      }
      throw new Error('Failed to fetch tool data')
    }

    const result = await response.json()
    return result.data || {}
  } catch (error) {
    console.error('Error fetching tool data, falling back to local storage:', error)
    const saved = localStorage.getItem(`forgelab_demo_tool_${projectId}_${toolSlug}`)
    return saved ? JSON.parse(saved) : {}
  }
}

// PUT /api/projects/[projectId]/tools/[toolSlug]/data - Save tool data
export async function saveProjectToolData(
  projectId: string,
  toolSlug: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${projectId}/tools/${toolSlug}/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      if (response.status === 404 || response.status === 503 || response.status >= 500) {
        // Fallback to local storage for demo mode
        localStorage.setItem(`forgelab_demo_tool_${projectId}_${toolSlug}`, JSON.stringify(data))
        return true
      }
      throw new Error('Failed to save tool data')
    }

    return true
  } catch (error) {
    console.error('Error saving tool data, falling back to local storage:', error)
    localStorage.setItem(`forgelab_demo_tool_${projectId}_${toolSlug}`, JSON.stringify(data))
    return true
  }
}

// GET /api/projects/[projectId]/members - Get project members
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch project members')
  }

  return await response.json()
}

// POST /api/projects/[projectId]/members - Invite member by username
export async function inviteProjectMember(
  projectId: string,
  username: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, role }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to invite member' }))
    throw new Error(error.error || 'Failed to invite member')
  }

  return true
}

// DELETE /api/projects/[projectId]/members - Remove project member
export async function removeProjectMember(projectId: string, userId: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove member' }))
    throw new Error(error.error || 'Failed to remove member')
  }

  return true
}
