'use client'

import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import type { Project } from '@/lib/projects'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

interface ProjectCardProps {
  project: Project
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

export default function ProjectCard({ project }: ProjectCardProps) {
  const toolCount = project.toolIds.length

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex flex-col gap-3 p-6 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{formatDate(project.updatedAt)}</span>
        <span>·</span>
        <span>{toolCount} værktøj{toolCount !== 1 ? 'er' : ''}</span>
      </div>
    </Link>
  )
}
