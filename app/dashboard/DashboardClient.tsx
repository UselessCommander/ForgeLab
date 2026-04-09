'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import ProjectCard from '@/components/dashboard/ProjectCard'
import AvailableToolCard from '@/components/dashboard/AvailableToolCard'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'
import {
  getProjects,
  createProject,
  deleteProject,
  type Project,
} from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import { DOUBLE_DIAMOND_PHASES, getDefaultPhaseForTool, type DoubleDiamondPhase } from '@/lib/frameworks'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

type DiamondSelection = DoubleDiamondPhase | 'hmw'
type ProjectInviteNotification = {
  id: string
  projectId: string
  projectName: string
  role: 'editor' | 'viewer'
  invitedAt: string
  readAt: string | null
  invitedByName: string
}

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [inviteNotifications, setInviteNotifications] = useState<ProjectInviteNotification[]>([])

  useEffect(() => {
    loadProjects()
    loadInviteNotifications()
  }, [])

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
      const saved = localStorage.getItem('forgelab_demo_projects')
      setProjects(saved ? JSON.parse(saved) : [])
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  const loadInviteNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/project-invites', { credentials: 'include' })
      if (!res.ok) return
      const payload = await res.json()
      const items = Array.isArray(payload?.items) ? payload.items : []
      setInviteNotifications(items)
    } catch (error) {
      console.warn('Kunne ikke indlæse invitation-notifikationer:', error)
    }
  }


  const handleCreate = async () => {
    if (!newName.trim() || creating) return

    if (isOffline) {
      // Demo mode: create project locally
      const newProject: Project = {
        id: `demo-${Date.now()}`,
        name: newName.trim(),
        description: newDesc.trim(),
        toolIds: [],
        framework: 'none',
        role: 'owner',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      const updated = [...projects, newProject]
      setProjects(updated)
      localStorage.setItem('forgelab_demo_projects', JSON.stringify(updated))
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      window.location.href = `/dashboard/projects/${newProject.id}`
      return
    }

    try {
      setCreating(true)
      const p = await createProject(newName.trim(), newDesc.trim())
      await loadProjects()
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
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

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 5) return 'God aften'
    if (hour < 10) return 'Godmorgen'
    if (hour < 18) return 'God eftermiddag'
    return 'God aften'
  })()

  const projectCount = projects.length
  const ownedProjects = projects.filter(p => (p.role || 'viewer') === 'owner')
  const sharedProjects = projects.filter(p => (p.role || 'viewer') !== 'owner')
  const latestProject =
    projectCount > 0
      ? [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null
  const inviteProjects = [...inviteNotifications].sort(
    (a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()
  )
  const unreadInvites = inviteProjects.filter((p) => !p.readAt)
  const unreadInviteCount = unreadInvites.length

  const markInvitesAsSeen = async (ids?: string[]) => {
    if (unreadInviteCount === 0) return
    try {
      await fetch('/api/notifications/project-invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : { markAll: true }),
      })
      setInviteNotifications((prev) =>
        prev.map((invite) =>
          !invite.readAt && (!ids || ids.length === 0 || ids.includes(invite.id))
            ? { ...invite, readAt: new Date().toISOString() }
            : invite
        )
      )
    } catch (error) {
      console.warn('Kunne ikke markere invitationer som læst:', error)
    }
  }

  const openNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev
      if (!prev && next && unreadInviteCount > 0) {
        void markInvitesAsSeen()
      }
      return next
    })
  }

  const [activeSelection, setActiveSelection] = useState<DiamondSelection>('discover')
  const phaseTools = VAERKTOEJER.filter((tool) => {
    // QR should be shown as standalone outside the Double Diamond list.
    if (tool.slug === 'qr-generator') return false
    if (activeSelection === 'hmw') return tool.slug === 'hmw'
    const defaultPhase = getDefaultPhaseForTool('double-diamond', tool.slug)
    // HMW should be visible both as a dedicated node and in Develop.
    if (activeSelection === 'develop' && tool.slug === 'hmw') return true
    return defaultPhase === activeSelection
  })
  const standaloneTools = VAERKTOEJER.filter((tool) => tool.slug === 'qr-generator')
  const discoverMethods = [
    'Desk research',
    'Interviews',
    'Ekspertinterviews',
    'Dagbogsstudier',
    'Feltobservationer',
    'Voxpop',
    'Survey / spørgeskema',
    'Shadowing',
    'Netnografi',
    'Service Safari',
    'Fokusgrupper',
    "OMD's ECO-system",
    'Shannon & Weaver',
    'Lasswell',
  ]
  const defineMethods = [
    'RFM-modellen',
    'Henrik Vejlgaards Trend-diamant',
    'Diffusionsmodellen (Rogers)',
    '4 Basics (trafik, salg, IT, service)',
    'Marketing Funnel',
    'Repositioneringskort',
  ]
  const methodDescriptions: Record<string, string> = {
    Brainwriting:
      'Deltagerne skriver idéer ned individuelt og bygger videre på hinandens input i flere runder.',
    'Crazy Eights':
      'Tegn 8 hurtige idéer på 8 minutter for at presse kreativiteten og undgå overthinking.',
    Mindmapping:
      'Start med et centralt emne og udforsk idéer som forgreninger for at skabe overblik og sammenhænge.',
    'Circle writing':
      'Deltagerne skriver idéer på skift i en cirkel, hvor hver person bygger videre på den forrige.',
    'Reverse / Evil Brainstorm':
      'Tænk i det værste eller modsatte scenarie for at afsløre problemer og nye løsninger.',
    Skitser:
      'Visualisér idéer hurtigt med simple tegninger for at gøre dem konkrete og diskuterbare.',
    Krydsmetoden:
      'Vælg to forskellige temaer, lav en liste af ord for hver, og kombiner dem tilfældigt på tværs for at tvinge nye og uventede idéer frem.',
    Idéblomsten:
      'Udforsk en idé i flere retninger ved at forgrene den ud i variationer og perspektiver.',
    'Lightning demos':
      'Gennemgå hurtigt eksisterende løsninger for at hente inspiration og genbruge gode mønstre.',
    'Pirate Funnel (AARRR)':
      'AARRR-modellen til at forstå og forbedre vækst: Acquisition, Activation, Retention, Revenue og Referral.',
  }
  const developMethods = [
    'Brainwriting',
    'Crazy Eights',
    'Mindmapping',
    'Circle writing',
    'Reverse / Evil Brainstorm',
    'Skitser',
    'Krydsmetoden',
    'Idéblomsten',
    'Lightning demos',
    'Moodboard',
    'Crossing the Chasm',
    'AIDA / AIDAS',
    'AISAS',
    'See-Think-Do-Care',
    'Pirate Funnel (AARRR)',
  ]
  const deliverMethods = [
    'See-Think-Do-Care',
  ]
  const renderMethodChip = (method: string) => {
    const description = methodDescriptions[method]
    const isHighlightedMethod = method === 'Henrik Vejlgaards Trend-diamant'
    return (
      <span key={method} className="relative inline-flex group">
        <span
          className={`px-2.5 py-1 text-xs ${
            isHighlightedMethod
              ? 'border border-yellow-400 bg-yellow-100 text-yellow-900'
              : 'border border-amber-300 bg-white text-amber-900'
          }`}
        >
          {method}
        </span>
        {description && (
          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 border border-amber-300 bg-white p-2 text-[11px] leading-relaxed text-amber-900 shadow-md group-hover:block">
            {description}
          </span>
        )}
      </span>
    )
  }
  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={openNotifications}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                title="Invitationer"
                aria-label="Invitationer"
              >
                <span style={{ fontSize: 17, lineHeight: 1 }}>🔔</span>
                {unreadInviteCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">
                    {unreadInviteCount > 9 ? '9+' : unreadInviteCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Invitationer</p>
                    <span className="text-xs text-gray-500">{inviteProjects.length}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {inviteProjects.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500">Ingen invitationer endnu.</div>
                    ) : (
                      inviteProjects.map((project) => {
                        const isUnread = !project.readAt
                        return (
                          <Link
                            key={project.id}
                            href={`/dashboard/projects/${project.projectId}`}
                            onClick={() => {
                              void markInvitesAsSeen([project.id])
                              setShowNotifications(false)
                            }}
                            className={`block px-4 py-3 border-b last:border-b-0 transition-colors ${
                              isUnread ? 'bg-amber-50/60 hover:bg-amber-50' : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{project.projectName}</p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {project.invitedByName} inviterede dig som {project.role === 'viewer' ? 'viewer' : 'editor'}.
                                </p>
                              </div>
                              {isUnread && (
                                <span className="mt-1 inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                              )}
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Analytics
            </Link>
            <LogoutButton />
          </div>
        }
      />
      {/* Offline banner */}
      {isOffline && (
        <div style={{
          background: 'linear-gradient(90deg, #FEF3C7, #FDE68A)',
          borderBottom: '1px solid #FCD34D',
          padding: '7px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 12, color: '#92400E', fontWeight: 500,
        }}>
          <span>⚠️</span>
          <span>Demo-tilstand aktiv — ingen database. Projekter gemmes kun i denne browser-session.</span>
        </div>
      )}
      <div className="layout-page py-10">
        {/* Hero / topsektion */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500/90 to-amber-600 text-white p-6 md:p-8 shadow-[0_20px_45px_rgba(249,115,22,0.35)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl md:max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/90 mb-1">
                  Dit ForgeLab dashboard
                </p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                  {greeting}, klar til næste eksperiment?
                </h1>
                <p className="text-sm md:text-base text-amber-50/90 max-w-2xl">
                  Opret et nyt projekt på få sekunder, tilføj værktøjer som A/B/N test eller spørgeskemaer – og følg resultaterne direkte i Analytics.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm md:text-base font-semibold shadow-lg shadow-black/40 hover:bg-black transition-all duration-150"
                  >
                    Opret nyt projekt
                  </button>
                  {latestProject && (
                    <Link
                      href={`/dashboard/projects/${latestProject.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-amber-50 text-sm font-medium hover:bg-white/15 border border-white/20 backdrop-blur"
                    >
                      Fortsæt seneste projekt
                      <span className="hidden sm:inline text-amber-100/80 truncate max-w-[180px]">
                        “{latestProject.name}”
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="rounded-2xl bg-black/15 border border-white/15 px-4 py-3">
                  <p className="text-amber-100/80 text-[11px] font-medium uppercase tracking-wide mb-1">
                    Aktive projekter
                  </p>
                  <p className="text-2xl font-semibold leading-tight">{projectCount}</p>
                  <p className="text-amber-100/70 text-[11px] mt-1">
                    Samler alle dine værktøjer ét sted.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/10 border border-white/10 px-4 py-3">
                  <p className="text-amber-100/80 text-[11px] font-medium uppercase tracking-wide mb-1">
                    Tilgængelige værktøjer
                  </p>
                  <p className="text-2xl font-semibold leading-tight">{VAERKTOEJER.length}</p>
                  <p className="text-amber-100/70 text-[11px] mt-1">
                    Klar til at blive tilknyttet dine projekter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primær indhold: projekter */}
        <section className="mb-12">
          {/* Projekter */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Dine projekter</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Saml værktøjer, eksperimenter og resultater i projekter, så du holder overblik.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/50 text-amber-600 text-sm font-medium hover:bg-amber-50/70 transition-colors"
              >
                + Nyt projekt
              </button>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-10 text-center shadow-sm">
                <p className="text-gray-500 text-sm">Indlæser dine projekter…</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200/70 bg-amber-50/60 p-8 text-center shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Kom i gang på få sekunder</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Opret dit første projekt og tilføj de værktøjer, du vil teste eller analysere.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/30"
                >
                  Opret dit første projekt
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Mine projekter</h3>
                    <span className="text-xs text-gray-400">{ownedProjects.length}</span>
                  </div>
                  {ownedProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">
                      Du ejer ingen projekter endnu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {ownedProjects.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onDelete={handleDeleteProject}
                          deleting={deletingProjectId === p.id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Delt med mig</h3>
                    <span className="text-xs text-gray-400">{sharedProjects.length}</span>
                  </div>
                  {sharedProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">
                      Ingen delte projekter endnu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {sharedProjects.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          deleting={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tilgængelige værktøjer */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Værktøjer i Double Diamond</h2>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mb-5 max-w-4xl">
            Vælg en fase i modellen og se relevante værktøjer i stedet for en lang liste.
          </p>

          <div className="swiss-panel p-4 md:p-6 mb-5">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 md:p-4 mb-5 overflow-x-auto">
              <DoubleDiamondDiagram activeSelection={activeSelection} onSelect={setActiveSelection} />
            </div>

            <div className="mt-5">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-3">
                <span className="w-2 h-2 rounded-full bg-black" />
                {activeSelection === 'hmw'
                  ? 'HMW'
                  : DOUBLE_DIAMOND_PHASES.find((p) => p.id === activeSelection)?.label}
              </div>

              {activeSelection === 'discover' && (
                <div className="mb-4 border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs uppercase tracking-widest text-amber-800 mb-2">
                    Discover metoder (ikke nødvendigvis tools)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {discoverMethods.map((method) => renderMethodChip(method))}
                  </div>
                </div>
              )}

              {activeSelection === 'define' && (
                <div className="mb-4 border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs uppercase tracking-widest text-amber-800 mb-2">
                    Define metoder (ikke nødvendigvis tools)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {defineMethods.map((method) => renderMethodChip(method))}
                  </div>
                </div>
              )}

              {activeSelection === 'develop' && (
                <div className="mb-4 border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs uppercase tracking-widest text-amber-800 mb-2">
                    Develop metoder (ikke nødvendigvis tools)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {developMethods.map((method) => renderMethodChip(method))}
                  </div>
                </div>
              )}

              {activeSelection === 'deliver' && (
                <div className="mb-4 border border-amber-200 bg-amber-50/60 p-3">
                  <p className="text-xs uppercase tracking-widest text-amber-800 mb-2">
                    Deliver metoder (ikke nødvendigvis tools)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliverMethods.map((method) => renderMethodChip(method))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {phaseTools.map((tool) => {
                  const { Icon, bg, text } = getToolIcon(tool.slug)
                  return (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-3 p-3 border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <div className={`w-9 h-9 border border-neutral-300 flex items-center justify-center ${bg} ${text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-neutral-900 truncate">{tool.title}</p>
                        <p className="text-xs text-neutral-500 line-clamp-1">{tool.shortDescription}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
              Standalone værktøjer (uden for Double Diamond)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {standaloneTools.map((tool) => (
                <AvailableToolCard key={tool.slug} tool={tool} href={`/tools/${tool.slug}`} />
              ))}
            </div>
          </div>
        </section>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200/80 shadow-xl p-6"
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
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Annuller
              </button>
              <button
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
    </PageShell>
  )
}
