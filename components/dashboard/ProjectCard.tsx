'use client'

import Link from 'next/link'
import { FolderOpen, Trash2 } from 'lucide-react'
import type { Project } from '@/lib/projects'

interface ProjectCardProps {
  project: Project
  onDelete?: (project: Project) => void
  deleting?: boolean
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

export default function ProjectCard({ project, onDelete, deleting = false }: ProjectCardProps) {
  const toolCount = project.toolIds.length

  return (
    <div className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/70 hover:-translate-y-0.5 transition-all duration-200">
      <Link
        href={`/dashboard/projects/${project.id}`}
        aria-label={`Åbn projekt ${project.name}`}
        className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="relative z-10 flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-amber-700">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(project)}
            disabled={deleting}
            className="relative z-20 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Slet projekt ${project.name}`}
            title="Slet projekt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Opdateret {formatDate(project.updatedAt)}
        </span>
        <span>·</span>
        <span>
          {toolCount} værktøj{toolCount !== 1 ? 'er' : ''}
        </span>
      </div>
    </div>
  )
}
