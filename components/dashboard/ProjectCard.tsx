'use client'

import Link from 'next/link'
import { FolderOpen, Trash2, ArrowRight } from 'lucide-react'
import type { Project } from '@/lib/projects'
import type { FrameworkId } from '@/lib/frameworks'

export interface ActiveUser {
  userId: string
  username: string
  avatarUrl?: string | null
}

interface ProjectCardProps {
  project: Project
  onDelete?: (project: Project) => void
  deleting?: boolean
  activeUsers?: ActiveUser[]
  workspaceName?: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Lige nu'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min siden`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} timer siden`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Ejer',
  editor: 'Redaktør',
  viewer: 'Viewer',
}

const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  none: '',
  'double-diamond': 'Double Diamond',
  'google-design-sprint': 'Design Sprint',
  'design-thinking': 'Design Thinking',
}

export default function ProjectCard({
  project,
  onDelete,
  deleting = false,
  activeUsers = [],
  workspaceName = null,
}: ProjectCardProps) {
  const toolCount = project.toolIds.length
  const visibleUsers = activeUsers.slice(0, 4)
  const overflow = activeUsers.length - visibleUsers.length
  const role = project.role || 'viewer'
  const framework =
    project.framework && project.framework !== 'none'
      ? FRAMEWORK_LABELS[project.framework]
      : null

  return (
    <article className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/70 hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-amber-700">
                {project.name}
              </h3>
              {project.description ? (
                <p className="text-sm text-gray-500 truncate mt-0.5">{project.description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeUsers.length > 0 && (
              <div className="flex items-center" style={{ gap: '-4px' }}>
                {visibleUsers.map((u, i) => (
                  <div
                    key={u.userId}
                    title={u.username}
                    style={{ marginLeft: i === 0 ? 0 : -6, zIndex: visibleUsers.length - i }}
                    className="relative w-6 h-6 rounded-full ring-2 ring-white overflow-hidden flex-shrink-0 flex items-center justify-center bg-emerald-500 text-white"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold leading-none">
                        {u.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
                {overflow > 0 && (
                  <div
                    style={{ marginLeft: -6, zIndex: 0 }}
                    className="w-6 h-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 flex-shrink-0"
                  >
                    +{overflow}
                  </div>
                )}
              </div>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project)}
                disabled={deleting}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Slet projekt ${project.name}`}
                title="Slet projekt"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-semibold text-gray-600">
            {ROLE_LABELS[role] || role}
          </span>
          {framework && (
            <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
              {framework}
            </span>
          )}
          {workspaceName && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-500 truncate max-w-[10rem]">
              {workspaceName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400 mt-auto">
          <span>Opdateret {formatDate(project.updatedAt)}</span>
          <span aria-hidden>·</span>
          <span>
            {toolCount} metode{toolCount !== 1 ? 'r' : ''}
          </span>
          {activeUsers.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-emerald-600 font-medium">{activeUsers.length} online</span>
            </>
          )}
        </div>

        <Link
          href={`/dashboard/projects/${project.id}`}
          className="relative z-10 inline-flex items-center justify-center gap-2 w-full mt-1 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/20"
        >
          Åbn projekt
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  )
}
