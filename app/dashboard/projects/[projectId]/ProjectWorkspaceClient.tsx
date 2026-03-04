'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import {
  getProject,
  addToolToProject,
  removeToolFromProject,
  type Project,
} from '@/lib/projects'
import { VAERKTOEJER, getVaerktoejBySlug, getVaerktoejerGroupedByKategori } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

interface ProjectWorkspaceClientProps {
  projectId: string
}

export default function ProjectWorkspaceClient({ projectId }: ProjectWorkspaceClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [showAddTool, setShowAddTool] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const p = await getProject(projectId)
      setProject(p ?? null)
      if (p && p.toolIds.length > 0 && !activeTool) {
        setActiveTool(p.toolIds[0])
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTool = async (toolId: string) => {
    if (modifying) return
    try {
      setModifying(true)
      await addToolToProject(projectId, toolId)
      await loadProject()
      setActiveTool(toolId)
      setShowAddTool(false)
    } catch (error) {
      console.error('Error adding tool:', error)
      alert('Kunne ikke tilføje værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleRemoveTool = async (toolId: string) => {
    if (modifying) return
    try {
      setModifying(true)
      await removeToolFromProject(projectId, toolId)
      await loadProject()
      if (activeTool === toolId) {
        const p = await getProject(projectId)
        setActiveTool(p?.toolIds[0] ?? null)
      }
    } catch (error) {
      console.error('Error removing tool:', error)
      alert('Kunne ikke fjerne værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-gray-500">Indlæser projekt...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-gray-500">Projekt ikke fundet.</div>
        <Link href="/dashboard" className="ml-4 text-amber-600 hover:underline">
          Tilbage til dashboard
        </Link>
      </div>
    )
  }

  const projectTools = project.toolIds
    .map((id) => ({ slug: id, tool: getVaerktoejBySlug(id) }))
    .filter((x) => x.tool)
  const availableToAdd = VAERKTOEJER.filter((t) => !project.toolIds.includes(t.slug))
  const availableByKategori = getVaerktoejerGroupedByKategori((t) => !project.toolIds.includes(t.slug))

  return (
    <div className="min-h-screen flex bg-[#fafbfc]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30" />
      </div>
      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 border-r border-gray-200/80 bg-white/70 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-gray-200/80">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-amber-600 font-medium text-sm transition-colors">
            <span>←</span>
            <span>Dashboard</span>
          </Link>
        </div>
        <div className="p-4 border-b border-gray-200/80">
          <h2 className="font-bold text-gray-900 truncate tracking-tight" title={project.name}>
            {project.name}
          </h2>
          {project.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
            Værktøjer
          </p>
          {projectTools.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-4">Ingen værktøjer endnu</p>
          ) : (
            <ul className="space-y-0.5">
              {projectTools.map(({ slug, tool }) => {
                if (!tool) return null
                const { Icon, bg, text } = getToolIcon(slug)
                const isActive = activeTool === slug
                return (
                  <li key={slug}>
                    <button
                      onClick={() => setActiveTool(slug)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm truncate flex-1">{tool.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <button
            onClick={() => setShowAddTool(true)}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm"
          >
            <span className="w-8 h-8 rounded flex items-center justify-center border border-dashed border-gray-300">
              +
            </span>
            <span>Tilføj værktøj</span>
          </button>
        </nav>
        <div className="p-2 border-t border-gray-200">
          <Link
            href="/dashboard"
            className="block w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Eksportér (kommer snart)
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        {activeTool && (
          <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200/80 bg-white/70 backdrop-blur-md shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {getVaerktoejBySlug(activeTool)?.title ?? activeTool}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Gem (auto)</span>
              <span className="text-xs text-gray-400">Eksportér (snart)</span>
            </div>
          </div>
        )}

        {/* Tool content area - iframe */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTool ? (
            <iframe
              key={activeTool}
              src={`/tools/${activeTool}?embed=1&projectId=${projectId}&toolSlug=${activeTool}`}
              className="w-full h-full border-0"
              title={getVaerktoejBySlug(activeTool)?.title ?? activeTool}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="mb-2">Vælg et værktøj eller tilføj et nyt</p>
                <button
                  onClick={() => setShowAddTool(true)}
                  className="text-amber-600 font-medium hover:text-amber-700"
                >
                  Tilføj værktøj →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Tool Modal */}
      {showAddTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowAddTool(false)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] bg-white rounded-2xl border border-gray-200/80 shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200/80 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Tilføj værktøj</h3>
              <p className="text-sm text-gray-500 mt-1">Vælg et værktøj at tilføje til projektet</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {availableToAdd.length === 0 ? (
                <p className="text-gray-500 text-sm">Alle værktøjer er allerede tilføjet.</p>
              ) : (
                availableByKategori.map(({ kategori, tools }) => (
                  <div key={kategori.id}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {kategori.label}
                    </p>
                    <div className="space-y-2">
                      {tools.map((tool) => {
                        const { Icon, bg, text } = getToolIcon(tool.slug)
                        return (
                          <button
                            key={tool.slug}
                            onClick={() => handleAddTool(tool.slug)}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 text-left min-w-0"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{tool.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{tool.shortDescription}</p>
                            </div>
                            <span className="flex-shrink-0 text-amber-600 text-sm font-medium">+ Tilføj</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200/80 flex-shrink-0">
              <button
                onClick={() => setShowAddTool(false)}
                className="w-full py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
