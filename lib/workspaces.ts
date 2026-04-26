export interface Workspace {
  id: string
  name: string
  color: string
  projectIds: string[]
  createdAt: string
  updatedAt: string
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const res = await fetch('/api/workspaces', { credentials: 'include' })
  if (!res.ok) return []
  return res.json()
}

export async function createWorkspace(name: string, color?: string): Promise<Workspace> {
  const res = await fetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, color }),
  })
  if (!res.ok) throw new Error('Failed to create workspace')
  return res.json()
}

export async function updateWorkspace(id: string, updates: { name?: string; color?: string }): Promise<void> {
  await fetch(`/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  })
}

export async function deleteWorkspace(id: string): Promise<void> {
  await fetch(`/api/workspaces/${id}`, { method: 'DELETE', credentials: 'include' })
}

export async function addProjectToWorkspace(workspaceId: string, projectId: string): Promise<void> {
  await fetch(`/api/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectId }),
  })
}

export async function removeProjectFromWorkspace(workspaceId: string, projectId: string): Promise<void> {
  await fetch(`/api/workspaces/${workspaceId}/projects`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ projectId }),
  })
}
