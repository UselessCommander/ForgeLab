'use client'

import { Plus } from 'lucide-react'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import type { Vaerktoej } from '@/lib/vaerktoejer-data'

interface AvailableToolCardProps {
  tool: Vaerktoej
  onAddToProject?: (toolId: string) => void
  showAddButton?: boolean
}

export default function AvailableToolCard({
  tool,
  onAddToProject,
  showAddButton = false,
}: AvailableToolCardProps) {
  const { Icon, bg, text } = getToolIcon(tool.slug)

  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300">
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${text}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-gray-900 truncate">{tool.title}</h4>
        <p className="text-xs text-gray-500 truncate">{tool.shortDescription}</p>
      </div>
      {showAddButton && onAddToProject && (
        <button
          onClick={() => onAddToProject(tool.slug)}
          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          title="Tilføj til projekt"
          aria-label={`Tilføj ${tool.title} til projekt`}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
