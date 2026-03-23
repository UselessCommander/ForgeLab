'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import {
  getProject,
  addToolToProject,
  removeToolFromProject,
  updateProject,
  updateProjectToolPhases,
  getProjectMembers,
  inviteProjectMember,
  removeProjectMember,
  type Project,
  type ProjectMember,
} from '@/lib/projects'
import {
  DOUBLE_DIAMOND_PHASES,
  getDefaultPhaseForTool,
  type DoubleDiamondPhase,
  type FrameworkId,
} from '@/lib/frameworks'
import { VAERKTOEJER, getVaerktoejBySlug, getVaerktoejerGroupedByKategori } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import { TOOL_SLUGS } from '@/lib/tool-slugs'
import ProjectDoubleDiamondBoard from '@/components/dashboard/ProjectDoubleDiamondBoard'

interface ProjectWorkspaceClientProps {
  projectId: string
}

export default function ProjectWorkspaceClient({ projectId }: ProjectWorkspaceClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [showAddTool, setShowAddTool] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  /** Skal ligge før eventuelle early returns — ellers “flere hooks end forrige render” (React #310). */
  const handleDdCanvasLayoutSave = useCallback(
    async (layout: NonNullable<Project['ddCanvasLayout']>) => {
      const updated = await updateProject(projectId, { ddCanvasLayout: layout })
      if (updated) setProject(updated)
    },
    [projectId]
  )

  const loadProject = async () => {
    try {
      setLoading(true)
      const [p, m] = await Promise.all([getProject(projectId), getProjectMembers(projectId)])
      setProject(p ?? null)
      setMembers(m || [])
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTool = async (toolId: string) => {
    if (project?.role === 'viewer') {
      alert('Du har kun læseadgang til dette projekt.')
      return
    }
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
    if (project?.role === 'viewer') {
      alert('Du har kun læseadgang til dette projekt.')
      return
    }
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

  const handleFrameworkChange = async (framework: FrameworkId) => {
    if (!canEdit || modifying || !project) return
    try {
      setModifying(true)
      await updateProject(projectId, { framework })
      await loadProject()
    } catch (error) {
      console.error('Error updating framework:', error)
      alert('Kunne ikke opdatere framework. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handlePhaseChange = async (toolSlug: string, phase: DoubleDiamondPhase) => {
    if (!canEdit || modifying || !project) return
    try {
      setModifying(true)
      await updateProjectToolPhases(projectId, { [toolSlug]: phase })
      setProject({
        ...project,
        toolPhases: {
          ...(project.toolPhases || {}),
          [toolSlug]: phase,
        },
      })
    } catch (error) {
      console.error('Error updating tool phase:', error)
      alert('Kunne ikke flytte værktøjet til ny fase. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <SiteNav />
        <div className="layout-page py-16">
          <p className="text-gray-500">Indlæser projekt…</p>
        </div>
      </PageShell>
    )
  }

  if (!project) {
    return (
      <PageShell>
        <SiteNav />
        <div className="layout-page py-16">
          <div className="max-w-3xl">
            <p className="text-gray-500 mb-4">Projekt ikke fundet.</p>
            <Link href="/dashboard" className="text-amber-600 hover:text-amber-700 font-medium">
              ← Tilbage til dashboard
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  /** Kun værktøjer i den kanoniske liste (samme som API/projekt-gemning understøtter). */
  const allowedProjectToolSlugs = new Set<string>(TOOL_SLUGS as readonly string[])

  const projectTools = project.toolIds
    .map((id) => ({ slug: id, tool: getVaerktoejBySlug(id) }))
    .filter((x) => x.tool)
  const availableToAdd = VAERKTOEJER.filter(
    (t) => allowedProjectToolSlugs.has(t.slug) && !project.toolIds.includes(t.slug)
  )
  const availableByKategori = getVaerktoejerGroupedByKategori(
    (t) => allowedProjectToolSlugs.has(t.slug) && !project.toolIds.includes(t.slug)
  )
  const availableByPhase = DOUBLE_DIAMOND_PHASES.map((phase) => ({
    phase,
    tools: availableToAdd.filter(
      (tool) => getDefaultPhaseForTool('double-diamond', tool.slug) === phase.id
    ),
  })).filter((group) => group.tools.length > 0)

  const toolCount = projectTools.length
  const latestTool = projectTools[0] ?? null
  const framework = project.framework || 'none'

  const lastUpdated = project.updatedAt
    ? new Date(project.updatedAt).toLocaleString('da-DK')
    : 'Ukendt'
  const canEdit = project.role === 'owner' || project.role === 'editor'
  const isOwner = project.role === 'owner'
  const toolPhases = project.toolPhases || {}

  const handleInvite = async () => {
    if (!isOwner || !inviteUsername.trim()) return
    try {
      setModifying(true)
      await inviteProjectMember(projectId, inviteUsername.trim(), inviteRole)
      setInviteUsername('')
      setInviteRole('editor')
      const m = await getProjectMembers(projectId)
      setMembers(m || [])
    } catch (error: any) {
      alert(error?.message || 'Kunne ikke invitere medlem.')
    } finally {
      setModifying(false)
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (!isOwner) return
    try {
      setModifying(true)
      await removeProjectMember(projectId, memberUserId)
      const m = await getProjectMembers(projectId)
      setMembers(m || [])
    } catch (error: any) {
      alert(error?.message || 'Kunne ikke fjerne medlem.')
    } finally {
      setModifying(false)
    }
  }

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
      <div className="layout-page py-10">
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
                <span>·</span>
                <span>Din rolle: {project.role || 'viewer'}</span>
                <span>·</span>
                <span>
                  Framework: {framework === 'double-diamond' ? 'Double Diamond' : 'Ingen'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAddTool(true)}
                disabled={!canEdit}
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
          <div className="mt-4 rounded-2xl border border-gray-200/80 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
            <select
              value={framework}
              onChange={(e) => handleFrameworkChange((e.target.value as FrameworkId) || 'none')}
              disabled={!canEdit || modifying}
              className="w-full sm:w-72 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm"
            >
              <option value="none">Ingen framework</option>
              <option value="double-diamond">Double Diamond</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Når Double Diamond er valgt, placeres værktøjer i faser og kan flyttes mellem dem.
            </p>
          </div>
        </section>

        {/* Deling og samarbejde */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Samarbejde</h2>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 md:p-5 shadow-sm">
            {isOwner ? (
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Brugernavn at invitere"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole((e.target.value as 'editor' | 'viewer') || 'editor')}
                  className="px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={modifying || !inviteUsername.trim()}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
                >
                  Inviter
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">Kun projektets owner kan invitere/fjerne medlemmer.</p>
            )}

            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">Ingen medlemmer fundet.</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.username || member.user_id}
                      </p>
                      <p className="text-xs text-gray-500">Rolle: {member.role}</p>
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Fjern
                      </button>
                    )}
                  </div>
                ))
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

        {framework === 'double-diamond' && (
          <section className="mb-10">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Double Diamond</h2>
            <p className="text-sm text-gray-500 mb-4 max-w-3xl">
              Samme model som på dashboardet. Med redigeringsadgang kan du trække ikonerne frit på canvas (som i Figma);
              placeringen gemmes i projektet. Hover for værktøjsnavn. Fase skifter du under &quot;Værktøjer i projektet&quot;.
            </p>
            <ProjectDoubleDiamondBoard
              projectId={projectId}
              tools={projectTools.filter((t): t is { slug: string; tool: NonNullable<typeof t.tool> } => !!t.tool)}
              toolPhases={toolPhases}
              savedLayout={project.ddCanvasLayout}
              canEdit={canEdit}
              onLayoutSave={handleDdCanvasLayoutSave}
            />
            {toolCount === 0 && (
              <p className="mt-3 text-center text-sm text-gray-500">
                Ingen værktøjer endnu — tilføj et værktøj for at se det som ikon på diamanten.
              </p>
            )}
          </section>
        )}

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
                disabled={!canEdit}
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tools/${slug}?projectId=${projectId}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors"
                        >
                          Åbn værktøj
                        </Link>
                        {framework === 'double-diamond' && (
                          <select
                            value={(toolPhases[slug] as DoubleDiamondPhase) || 'develop'}
                            onChange={(e) => handlePhaseChange(slug, e.target.value as DoubleDiamondPhase)}
                            disabled={!canEdit || modifying}
                            className="px-2 py-2 rounded-lg border border-gray-200 bg-white text-xs"
                          >
                            {DOUBLE_DIAMOND_PHASES.map((phase) => (
                              <option key={phase.id} value={phase.id}>
                                {phase.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(slug)}
                        disabled={!canEdit}
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
              ) : framework === 'double-diamond' ? (
                availableByPhase.map(({ phase, tools }) => (
                  <div key={phase.id}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {phase.label}
                    </p>
                    <div className="space-y-2">
                      {tools.map((tool) => {
                        const { Icon, bg, text } = getToolIcon(tool.slug)
                        return (
                          <button
                            key={tool.slug}
                            onClick={() => handleAddTool(tool.slug)}
                            disabled={!canEdit}
                            className="w-full flex items-center gap-3 p-4 border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors text-left min-w-0"
                          >
                            <div className={`w-10 h-10 border border-neutral-300 flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{tool.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{tool.shortDescription}</p>
                            </div>
                            <span className="flex-shrink-0 text-gray-700 text-sm font-medium">+ Tilføj</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
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
                            disabled={!canEdit}
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
