import type { ProjectComment } from '@/lib/comments'

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (body && typeof body.error === 'string') return body.error
  } catch {
    /* ignore */
  }
  return fallback
}

export async function fetchProjectCommentsApi(projectId: string): Promise<ProjectComment[]> {
  const res = await fetch(`/api/projects/${projectId}/comments`, { credentials: 'include' })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke hente kommentarer'))
  }
  return res.json()
}

export async function createProjectCommentApi(
  projectId: string,
  content: string,
  options?: { parentId?: string; positionX?: number; positionY?: number }
): Promise<ProjectComment> {
  const res = await fetch(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      parentId: options?.parentId,
      positionX: options?.positionX,
      positionY: options?.positionY,
    }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke oprette kommentar'))
  }
  return res.json()
}

export async function updateProjectCommentApi(
  projectId: string,
  commentId: string,
  content: string
): Promise<ProjectComment> {
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke opdatere kommentar'))
  }
  return res.json()
}

export async function resolveProjectCommentApi(
  projectId: string,
  commentId: string
): Promise<ProjectComment> {
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resolve' }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke markere kommentar som løst'))
  }
  return res.json()
}

export async function unresolveProjectCommentApi(
  projectId: string,
  commentId: string
): Promise<ProjectComment> {
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unresolve' }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke genåbne kommentar'))
  }
  return res.json()
}

export async function deleteProjectCommentApi(
  projectId: string,
  commentId: string
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Kunne ikke slette kommentar'))
  }
}
