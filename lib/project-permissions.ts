/**
 * Explicit v1 product rules for project-scoped actions.
 * Enforced in API routes; UI should mirror these where practical.
 *
 * Deploy note: after migration 022 (RLS lockdown), server code must use
 * SUPABASE_SERVICE_ROLE_KEY via lib/supabase on the server — see migration header.
 */
import { canEditProject, canViewProject } from './project-access'

/** Editors and owners may mark thread comments resolved / reopen them. Viewers may read only. */
export async function canResolveProjectComments(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canEditProject(projectId, userId)
}

/** Chat text is ephemeral (realtime broadcast) for all members; file attachments require edit access. */
export async function canUploadProjectChatFiles(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canEditProject(projectId, userId)
}

/** Any project member (owner, editor, viewer). */
export async function canAccessProjectChat(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canViewProject(projectId, userId)
}
