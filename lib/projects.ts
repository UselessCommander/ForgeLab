/**
 * Project & tool association - Database-backed via API
 * Supports: projects, project_tools, per-project tool state
 */

export interface Project {
  id: string
  name: string
  description: string
  toolIds: string[]
  updatedAt: string
  createdAt: string
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
      if (response.status === 404) {
        return null
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
  updates: Partial<Pick<Project, 'name' | 'description' | 'toolIds'>>
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
    if (response.status === 404) {
      return null
    }
    const error = await response.json().catch(() => ({ error: 'Failed to update project' }))
    throw new Error(error.error || 'Failed to update project')
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
      if (response.status === 404) {
        return {}
      }
      throw new Error('Failed to fetch tool data')
    }

    const result = await response.json()
    return result.data || {}
  } catch (error) {
    console.error('Error fetching tool data:', error)
    return {}
  }
}

// PUT /api/projects/[projectId]/tools/[toolSlug]/data - Save tool data
export async function saveProjectToolData(
  projectId: string,
  toolSlug: string,
  data: Record<string, any>
): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/tools/${toolSlug}/data`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    throw new Error('Failed to save tool data')
  }

  return true
}
