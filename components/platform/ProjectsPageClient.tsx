'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, FolderOpen, Sparkles } from 'lucide-react'
import ProjectCard from '@/components/dashboard/ProjectCard'
import {
  getProjects,
  createProject,
  deleteProject,
  inviteProjectMember,
  type Project,
} from '@/lib/projects'
import { type FrameworkId } from '@/lib/frameworks'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'
import { getWorkspaces, type Workspace } from '@/lib/workspaces'

function parseInviteEmailList(raw: string): string[] {
  const parts = raw.split(/[\n,;]+/)
  const seen = new Set<string>()
  const out: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const part of parts) {
    const e = part.trim().toLowerCase()
    if (!e || seen.has(e)) continue
    if (emailRegex.test(e)) {
      seen.add(e)
      out.push(e)
    }
  }
  return out
}

export default function ProjectsPageClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFramework, setNewFramework] = useState<FrameworkId>('none')
  const [createInviteEmails, setCreateInviteEmails] = useState('')
  const [createInviteRole, setCreateInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [creating, setCreating] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const loadProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects', { credentials: 'include' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      setProjects(await res.json())
      setIsOffline(false)
    } catch {
      if (hasFunctionalStorageConsent()) {
        const saved = localStorage.getItem('forgelab_demo_projects')
        setProjects(saved ? JSON.parse(saved) : [])
      } else {
        setProjects([])
      }
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
    void getWorkspaces().then(setWorkspaces).catch(() => {})
  }, [])

  const workspaceByProjectId = useMemo(() => {
    const map = new Map<string, string>()
    for (const ws of workspaces) {
      for (const pid of ws.projectIds) {
        if (!map.has(pid)) map.set(pid, ws.name)
      }
    }
    return map
  }, [workspaces])

  const ownedProjects = projects.filter((p) => (p.role || 'viewer') === 'owner')
  const sharedProjects = projects.filter((p) => (p.role || 'viewer') !== 'owner')

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewName('')
    setNewDesc('')
    setNewFramework('none')
    setCreateInviteEmails('')
    setCreateInviteRole('editor')
  }

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    if (isOffline) {
      if (!hasFunctionalStorageConsent()) {
        alert('Demo-tilstand kræver samtykke til browser-lagring.')
        return
      }
      const newProject: Project = {
        id: `demo-${Date.now()}`,
        name: newName.trim(),
        description: newDesc.trim(),
        toolIds: [],
        framework: newFramework,
        role: 'owner',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      const updated = [...projects, newProject]
      setProjects(updated)
      localStorage.setItem('forgelab_demo_projects', JSON.stringify(updated))
      closeCreateModal()
      window.location.href = `/dashboard/projects/${newProject.id}`
      return
    }
    const inviteList = parseInviteEmailList(createInviteEmails)
    try {
      setCreating(true)
      const p = await createProject(newName.trim(), newDesc.trim(), { framework: newFramework })
      for (const email of inviteList) {
        try {
          await inviteProjectMember(p.id, email, createInviteRole)
        } catch {
          /* continue */
        }
      }
      await loadProjects()
      closeCreateModal()
      window.location.href = `/dashboard/projects/${p.id}`
    } catch {
      alert('Kunne ikke oprette projekt. Prøv igen.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (deletingProjectId) return
    if (!window.confirm(`Er du sikker på, at du vil slette "${project.name}"?`)) return
    if (isOffline) {
      const updated = projects.filter((p) => p.id !== project.id)
      setProjects(updated)
      localStorage.setItem('forgelab_demo_projects', JSON.stringify(updated))
      return
    }
    try {
      setDeletingProjectId(project.id)
      await deleteProject(project.id)
      await loadProjects()
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Projekter</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Opret, find og åbn alle dine ForgeLab-projekter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-500/30 hover:bg-amber-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nyt projekt
        </button>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Indlæser projekter…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="mb-2 text-base font-extrabold text-gray-900">Ingen projekter endnu</h2>
          <p className="mb-5 text-sm text-gray-500">Opret dit første projekt for at komme i gang.</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Opret projekt
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Mine projekter</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                {ownedProjects.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ownedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onDelete={handleDeleteProject}
                  deleting={deletingProjectId === p.id}
                  workspaceName={workspaceByProjectId.get(p.id) ?? null}
                />
              ))}
            </div>
          </section>
          {sharedProjects.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2 border-t border-gray-100 pt-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Delt med mig</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                  {sharedProjects.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sharedProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} deleting={false} workspaceName={workspaceByProjectId.get(p.id) ?? null} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeCreateModal}>
          <div
            className="max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Opret nyt projekt</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Navn</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mit projekt"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Beskrivelse (valgfrit)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeCreateModal} className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
                Annuller
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {creating ? 'Opretter...' : 'Opret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
