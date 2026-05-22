import type { Project } from '@/lib/projects'
import { getVaerktoejBySlug } from '@/lib/vaerktoejer-data'
import { getMethodToolHref } from '@/lib/method-catalog'

export type ActivityItem = {
  id: string
  label: string
  at: string
  projectId?: string
  projectName?: string
  href?: string
}

function sortByDate(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

/** Activity across projects from `updatedAt` only — no invented edit events. */
export function buildGlobalActivity(projects: Project[], limit = 12): ActivityItem[] {
  const items: ActivityItem[] = []
  for (const project of projects) {
    if (!project.updatedAt) continue
    items.push({
      id: `${project.id}-updated`,
      label: 'Projektet blev opdateret',
      projectId: project.id,
      projectName: project.name,
      at: project.updatedAt,
      href: `/dashboard/projects/${project.id}`,
    })
  }
  return sortByDate(items).slice(0, limit)
}

/** Activity for one project: project update + linked tools (same timestamp as project). */
export function buildProjectActivity(project: Project, limit = 10): ActivityItem[] {
  const items: ActivityItem[] = []
  if (project.updatedAt) {
    items.push({
      id: 'project-updated',
      label: 'Projektet blev opdateret',
      at: project.updatedAt,
      href: `/dashboard/projects/${project.id}`,
    })
  }
  for (const slug of project.toolIds ?? []) {
    const tool = getVaerktoejBySlug(slug)
    if (!tool) continue
    items.push({
      id: `tool-${slug}`,
      label: `${tool.title} er tilknyttet projektet`,
      at: project.updatedAt || project.createdAt,
      href: `${getMethodToolHref(slug)}?projectId=${encodeURIComponent(project.id)}`,
    })
  }
  return sortByDate(items).slice(0, limit)
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return 'Lige nu'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min siden`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} t siden`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
