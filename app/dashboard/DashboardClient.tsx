'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProjectCard from '@/components/dashboard/ProjectCard'
import DashboardHero, { type DashboardHeroStat } from '@/components/dashboard/DashboardHero'
import RecentActivitySection from '@/components/platform/RecentActivitySection'
import DashboardQuickLinks from '@/components/platform/DashboardQuickLinks'
import { buildGlobalActivity } from '@/lib/recent-activity'
import { useFavoriteMethods } from '@/lib/use-favorite-methods'
import {
  getProjects,
  createProject,
  deleteProject,
  inviteProjectMember,
  type Project,
} from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import { type FrameworkId } from '@/lib/frameworks'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'
import { getStoredForgeTheme, type ForgeTheme } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import type { ActiveUser } from '@/components/dashboard/ProjectCard'
import { getWorkspaces, type Workspace } from '@/lib/workspaces'
import { Plus, Folder, FolderOpen, Users, Wrench, Sparkles, TrendingUp, Clock } from 'lucide-react'

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

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [username, setUsername] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFramework, setNewFramework] = useState<FrameworkId>('none')
  const [createInviteEmails, setCreateInviteEmails] = useState('')
  const [createInviteRole, setCreateInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [heroTheme, setHeroTheme] = useState<ForgeTheme>('default')
  const { favorites } = useFavoriteMethods()
  const [activeUsersByProject, setActiveUsersByProject] = useState<Record<string, ActiveUser[]>>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  useEffect(() => {
    loadProjects()
    loadCurrentUser()
    loadWorkspaces()
    setHeroTheme(getStoredForgeTheme())
  }, [])

  useEffect(() => {
    if (!username || projects.length === 0) return

    const channels: ReturnType<typeof supabase.channel>[] = []

    for (const project of projects) {
      const pid = project.id
      const ch = supabase.channel(`dashboard-presence:${pid}`, {
        config: { presence: { key: currentUserId || username } },
      })
      ch
        .on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState() as Record<string, any[]>
          const users: ActiveUser[] = []
          for (const presences of Object.values(state)) {
            for (const p of presences) {
              const user: ActiveUser = {
                userId: p.userId || p.username || 'unknown',
                username: p.username || 'Bruger',
                avatarUrl: p.avatarUrl || null,
              }
              if (!users.some(u => u.userId === user.userId)) {
                users.push(user)
              }
            }
          }
          setActiveUsersByProject(prev => ({ ...prev, [pid]: users }))
        })
        .subscribe()
      channels.push(ch)
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [username, currentUserId, projects])

  const loadWorkspaces = async () => {
    try {
      const ws = await getWorkspaces()
      setWorkspaces(ws)
    } catch {
      // silently ignore — workspaces are optional
    }
  }

  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) return
      const payload = await res.json()
      const nextUsername =
        typeof payload?.username === 'string' && payload.username.trim()
          ? payload.username.trim()
          : ''
      setUsername(nextUsername)
      if (typeof payload?.id === 'string') setCurrentUserId(payload.id)
      if (typeof payload?.avatarUrl === 'string' && payload.avatarUrl) setCurrentUserAvatar(payload.avatarUrl)
    } catch (error) {
      console.warn('Kunne ikke hente nuværende bruger:', error)
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      // Fetch directly so we can detect 503/500 DB errors (getProjects swallows them)
      const res = await fetch('/api/projects', { credentials: 'include' })
      if (res.status === 401) {
        // Not logged in — let middleware handle redirect
        setProjects([])
        return
      }
      if (!res.ok) throw new Error(`API ${res.status}`)
      const projs: Project[] = await res.json()
      setProjects(projs)
      setIsOffline(false)
    } catch (error) {
      console.warn('DB unavailable — demo mode aktiv:', error)
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
        alert(
          'Demo-tilstand med lokale projekter kræver samtykke til valgfri browser-lagring. Vælg «Accepter alle» eller slå «Valgfri browser-lagring» til i cookie-banneret (fx fra forsiden), og prøv igen.'
        )
        return
      }
      // Demo mode: create project locally (invites kræver online konto)
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
      const inviteFailures: string[] = []
      for (const email of inviteList) {
        try {
          await inviteProjectMember(p.id, email, createInviteRole)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Ukendt fejl'
          inviteFailures.push(`${email}: ${msg}`)
        }
      }
      await loadProjects()
      closeCreateModal()
      if (inviteFailures.length > 0) {
        alert(
          `Projektet er oprettet, men nogle invitationer mislykkedes:\n\n${inviteFailures.join('\n')}\n\n(Tjek at modtageren har en ForgeLab-konto med den e-mail.)`
        )
      }
      window.location.href = `/dashboard/projects/${p.id}`
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Kunne ikke oprette projekt. Prøv igen.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (deletingProjectId) return
    const confirmed = window.confirm(
      `Er du sikker på, at du vil slette projektet "${project.name}"?\n\nDette kan ikke fortrydes.`
    )
    if (!confirmed) return

    if (isOffline) {
      if (!hasFunctionalStorageConsent()) {
        alert('Sletning i demo-tilstand kræver samtykke til valgfri browser-lagring.')
        return
      }
      // Demo mode: delete locally
      const updated = projects.filter(p => p.id !== project.id)
      setProjects(updated)
      localStorage.setItem('forgelab_demo_projects', JSON.stringify(updated))
      return
    }

    try {
      setDeletingProjectId(project.id)
      const success = await deleteProject(project.id)
      if (!success) {
        alert('Projektet blev ikke fundet.')
        return
      }
      await loadProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Kunne ikke slette projektet. Prøv igen.')
    } finally {
      setDeletingProjectId(null)
    }
  }

  const projectCount = projects.length
  const ownedProjects = projects.filter(p => (p.role || 'viewer') === 'owner')
  const sharedProjects = projects.filter(p => (p.role || 'viewer') !== 'owner')
  const latestProject =
    projectCount > 0
      ? [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null
  const hasProjects = projectCount > 0

  const workspaceByProjectId = useMemo(() => {
    const map = new Map<string, string>()
    for (const ws of workspaces) {
      for (const pid of ws.projectIds) {
        if (!map.has(pid)) map.set(pid, ws.name)
      }
    }
    return map
  }, [workspaces])

  const heroStats: DashboardHeroStat[] = hasProjects
    ? [
        { icon: Folder, label: 'Projekter', value: projectCount, sub: 'i alt' },
        { icon: Users, label: 'Delt', value: sharedProjects.length, sub: 'projekter' },
        { icon: Wrench, label: 'Værktøjer', value: VAERKTOEJER.length, sub: 'tilgængelige' },
        ...(latestProject
          ? [{ icon: Clock, label: 'Senest', value: '·', sub: latestProject.name }]
          : []),
      ]
    : [
        { icon: Wrench, label: 'Værktøjer', value: VAERKTOEJER.length, sub: 'klar til brug' },
        { icon: Sparkles, label: 'Double Diamond', value: '✓', sub: 'understøttet' },
        { icon: TrendingUp, label: 'Alt samlet', value: '·', sub: 'Boards, plan & slides' },
      ]

  const globalActivity = useMemo(() => buildGlobalActivity(projects, 8), [projects])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      {isOffline && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800">
          Demo-tilstand — projekter gemmes lokalt i browseren.
        </p>
      )}
      <DashboardHero
        heroTheme={heroTheme}
        hasProjects={hasProjects}
        stats={heroStats}
        latestProject={latestProject}
      />

        {/* Primær indhold: projekter */}
        <section className="mb-10">
          <div>
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-[18px] h-[18px] text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight">Dine projekter</h2>
                  <p className="text-xs text-gray-500">
                    Saml dine designværktøjer, metoder og eksperimenter ét sted.
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {hasProjects && (
                  <>
                    <Link
                      href="/projekter"
                      className="hidden sm:inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Se alle
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nyt projekt
                    </button>
                  </>
                )}
              </div>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-10 text-center shadow-sm">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Indlæser dine projekter...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-8 sm:p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1.5">Klar til dit første projekt?</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                  Opret et projekt og vælg de metoder, du vil arbejde med.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Opret dit første projekt
                </button>
                <p className="text-xs text-gray-400 mt-4 max-w-xs mx-auto">
                  Du kan altid tilføje flere værktøjer senere.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Mine projekter</span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ownedProjects.length}</span>
                    </div>
                  </div>
                  {ownedProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-5 text-sm text-gray-400 text-center">
                      Du ejer ingen projekter endnu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {ownedProjects.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            (window as any).__dragProjectId = p.id
                            e.dataTransfer.setData('projectId', p.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => { (window as any).__dragProjectId = null }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <ProjectCard
                            project={p}
                            onDelete={handleDeleteProject}
                            deleting={deletingProjectId === p.id}
                            activeUsers={activeUsersByProject[p.id] || []}
                            workspaceName={workspaceByProjectId.get(p.id) ?? null}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 pt-6 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Delt med mig</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{sharedProjects.length}</span>
                  </div>
                  {sharedProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-5 text-sm text-gray-400 text-center">
                      Ingen delte projekter endnu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {sharedProjects.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            (window as any).__dragProjectId = p.id
                            e.dataTransfer.setData('projectId', p.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => { (window as any).__dragProjectId = null }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <ProjectCard
                            project={p}
                            deleting={false}
                            activeUsers={activeUsersByProject[p.id] || []}
                            workspaceName={workspaceByProjectId.get(p.id) ?? null}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      <RecentActivitySection items={globalActivity} scope="global" />

      <DashboardQuickLinks favoriteSlugs={favorites} />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={closeCreateModal}>
          <div
            className="w-full max-w-md max-h-[min(90vh,720px)] overflow-y-auto bg-white rounded-2xl border border-gray-200/80 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opret nyt projekt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navn</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mit projekt"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse (valgfrit)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Kort beskrivelse"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
                <select
                  value={newFramework}
                  onChange={(e) => setNewFramework((e.target.value as FrameworkId) || 'none')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="none">Ingen framework</option>
                  <option value="double-diamond">Double Diamond</option>
                  <option value="google-design-sprint">Google Design Sprint</option>
                  <option value="design-thinking">Design Thinking</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">Bruges til faseinddeling af værktøjer i projektet.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invitér deltagere (valgfrit)</label>
                <textarea
                  value={createInviteEmails}
                  onChange={(e) => setCreateInviteEmails(e.target.value)}
                  placeholder="Én e-mail pr. linje eller adskilt med komma (fx navn@firma.dk)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y min-h-[4.5rem] text-sm"
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm text-gray-600 shrink-0">Rolle for inviterede</label>
                  <select
                    value={createInviteRole}
                    onChange={(e) => setCreateInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full sm:w-auto sm:min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Personerne skal allerede have en ForgeLab-konto med den angivne e-mail.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeCreateModal}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25"
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
