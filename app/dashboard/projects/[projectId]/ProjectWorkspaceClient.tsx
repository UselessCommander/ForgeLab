'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
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
  const [showAddTool, setShowAddTool] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const p = await getProject(projectId)
      setProject(p ?? null)
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
    } catch (error) {
      console.error('Error removing tool:', error)
      alert('Kunne ikke fjerne værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <SiteNav />
        <div className="container mx-auto px-6 py-16 max-w-5xl">
          <p className="text-gray-500">Indlæser projekt…</p>
        </div>
      </PageShell>
    )
  }

  if (!project) {
    return (
      <PageShell>
        <SiteNav />
        <div className="container mx-auto px-6 py-16 max-w-3xl">
          <p className="text-gray-500 mb-4">Projekt ikke fundet.</p>
          <Link href="/dashboard" className="text-amber-600 hover:text-amber-700 font-medium">
            ← Tilbage til dashboard
          </Link>
        </div>
      </PageShell>
    )
  }

  const projectTools = project.toolIds
    .map((id) => ({ slug: id, tool: getVaerktoejBySlug(id) }))
    .filter((x) => x.tool)
  const availableToAdd = VAERKTOEJER.filter((t) => !project.toolIds.includes(t.slug))
  const availableByKategori = getVaerktoejerGroupedByKategori((t) => !project.toolIds.includes(t.slug))

  const toolCount = projectTools.length
  const latestTool = projectTools[0] ?? null

  const lastUpdated = project.updatedAt
    ? new Date(project.updatedAt).toLocaleString('da-DK')
    : 'Ukendt'

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        }
      />
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Header */}
        <section className="mb-10">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/dashboard" className="hover:text-gray-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-500 truncate max-w-[220px] sm:max-w-xs">{project.name}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-3xl border border-gray-200/80 bg-white shadow-sm p-6 md:p-7">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight truncate">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1 max-w-xl">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-3">
                <span>Sidst opdateret: {lastUpdated}</span>
                <span>·</span>
                <span>
                  {toolCount} værktøj{toolCount !== 1 ? 'er' : ''}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAddTool(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-500/30 hover:bg-amber-600 transition-colors"
              >
                Tilføj værktøj
              </button>
              {latestTool && latestTool.tool && (
                <Link
                  href={`/tools/${latestTool.slug}?projectId=${projectId}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fortsæt seneste værktøj
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Fortsæt hvor du slap */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Fortsæt hvor du slap</h2>
          </div>
          {toolCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200/80 bg-gray-50/70 p-8 text-center text-sm text-gray-600">
              Ingen værktøjer endnu. Tilføj dit første værktøj for at komme i gang med projektet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTools.slice(0, 3).map(({ slug, tool }) => {
                if (!tool) return null
                const { Icon, bg, text } = getToolIcon(slug)
                return (
                  <Link
                    key={slug}
                    href={`/tools/${slug}?projectId=${projectId}`}
                    className="flex items-stretch gap-4 p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/70 transition-all duration-200 group"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-amber-700 truncate">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tool.shortDescription}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between text-right">
                      <span className="text-[11px] font-medium text-amber-600 group-hover:text-amber-700">
                        Åbn værktøj
                      </span>
                      <span className="text-[10px] text-gray-400">Senest brugt i dette projekt</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Værktøjer i projektet */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Værktøjer i projektet
            </h2>
          </div>
          {toolCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-8 text-center text-sm text-gray-600">
              <p className="mb-3">
                Der er endnu ingen værktøjer knyttet til dette projekt.
              </p>
              <button
                onClick={() => setShowAddTool(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/25"
              >
                Tilføj første værktøj
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectTools.map(({ slug, tool }) => {
                if (!tool) return null
                const { Icon, bg, text } = getToolIcon(slug)
                return (
                  <div
                    key={slug}
                    className="flex flex-col gap-3 p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/70 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${text}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{tool.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tool.shortDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/tools/${slug}?projectId=${projectId}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors"
                      >
                        Åbn værktøj
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(slug)}
                        className="text-[11px] text-gray-400 hover:text-red-600 font-medium"
                      >
                        Fjern fra projekt
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Tilføj værktøj-modal (uændret logik) */}
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
              <p className="text-sm text-gray-500 mt-1">Vælg et værktøj at tilføje til projektet.</p>
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
                            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-200 text-left min-w-0"
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
    </PageShell>
  )
}
