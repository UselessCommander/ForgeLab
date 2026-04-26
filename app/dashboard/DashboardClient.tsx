'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import ProjectCard from '@/components/dashboard/ProjectCard'
import AvailableToolCard from '@/components/dashboard/AvailableToolCard'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'
import DesignThinkingDiagram from '@/components/dashboard/DesignThinkingDiagram'
import GoogleDesignSprintDiagram from '@/components/dashboard/GoogleDesignSprintDiagram'
import {
  getProjects,
  createProject,
  deleteProject,
  inviteProjectMember,
  type Project,
} from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import {
  DOUBLE_DIAMOND_PHASES,
  GOOGLE_DESIGN_SPRINT_PHASES,
  getDefaultPhaseForTool,
  getFrameworkPhases,
  type DoubleDiamondPhase,
  type FrameworkId,
  type DesignThinkingPhase,
  type GoogleDesignSprintPhase,
} from '@/lib/frameworks'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'
import { getStoredForgeTheme, type ForgeTheme } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import type { ActiveUser } from '@/components/dashboard/ProjectCard'
import WorkspacesSection from '@/components/dashboard/WorkspacesSection'
import { getWorkspaces, type Workspace } from '@/lib/workspaces'
import { Bell, AlertTriangle, Plus, ArrowRight, Folder, FolderOpen, Users, Wrench, Sparkles, TrendingUp, ChevronRight, Clock } from 'lucide-react'

type FrameworkSelection = DoubleDiamondPhase | GoogleDesignSprintPhase | DesignThinkingPhase | 'hmw'
type ProjectInviteNotification = {
  id: string
  projectId: string
  projectName: string
  role: 'editor' | 'viewer'
  invitedAt: string
  readAt: string | null
  invitedByName: string
}

type ProjectMentionNotification = {
  id: string
  projectId: string
  projectName: string
  sourceType: 'comment' | 'board'
  sourceId: string
  mentionedAt: string
  readAt: string | null
  mentionedByName: string
  mentionText: string
  mentionContext: string
}

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
  const [showNotifications, setShowNotifications] = useState(false)
  const [inviteNotifications, setInviteNotifications] = useState<ProjectInviteNotification[]>([])
  const [mentionNotifications, setMentionNotifications] = useState<ProjectMentionNotification[]>([])
  const [heroTheme, setHeroTheme] = useState<ForgeTheme>('default')
  const [activeUsersByProject, setActiveUsersByProject] = useState<Record<string, ActiveUser[]>>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  useEffect(() => {
    loadProjects()
    loadInviteNotifications()
    loadMentionNotifications()
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

  useEffect(() => {
    // Keep bell notifications fresh without manual reload.
    const refresh = () => {
      void loadInviteNotifications()
      void loadMentionNotifications()
    }
    const interval = window.setInterval(refresh, 15000)
    const onFocus = () => refresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

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

  const loadInviteNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/project-invites', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) return
      const payload = await res.json()
      const items = Array.isArray(payload?.items) ? payload.items : []
      setInviteNotifications(items)
    } catch (error) {
      console.warn('Kunne ikke indlæse invitation-notifikationer:', error)
    }
  }

  const loadMentionNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/project-mentions', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) return
      const payload = await res.json()
      const items = Array.isArray(payload?.items) ? payload.items : []
      setMentionNotifications(items)
    } catch (error) {
      console.warn('Kunne ikke indlæse mention-notifikationer:', error)
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

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 5) return 'God nat'
    if (hour < 10) return 'God morgen'
    if (hour < 12) return 'God formiddag'
    if (hour < 18) return 'God eftermiddag'
    return 'God aften'
  })()
  const greetingWithName = username ? `${greeting}, ${username}` : greeting

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
  const mentionProjects = [...mentionNotifications].sort(
    (a, b) => new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime()
  )
  const unreadMentions = mentionProjects.filter((m) => !m.readAt)
  const unreadMentionCount = unreadMentions.length
  const unreadNotificationCount = unreadInviteCount + unreadMentionCount

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

  const markMentionsAsSeen = async (ids?: string[]) => {
    if (unreadMentionCount === 0) return
    try {
      await fetch('/api/notifications/project-mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : { markAll: true }),
      })
      setMentionNotifications((prev) =>
        prev.map((mention) =>
          !mention.readAt && (!ids || ids.length === 0 || ids.includes(mention.id))
            ? { ...mention, readAt: new Date().toISOString() }
            : mention
        )
      )
    } catch (error) {
      console.warn('Kunne ikke markere mentions som læst:', error)
    }
  }

  const openNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev
      if (!prev && next) {
        if (unreadInviteCount > 0) void markInvitesAsSeen()
        if (unreadMentionCount > 0) void markMentionsAsSeen()
      }
      return next
    })
  }

  const [activeFrameworkView, setActiveFrameworkView] = useState<FrameworkId>('double-diamond')
  const [activeSelection, setActiveSelection] = useState<FrameworkSelection>('discover')
  useEffect(() => {
    if (activeFrameworkView === 'google-design-sprint') {
      setActiveSelection('understand')
    } else if (activeFrameworkView === 'design-thinking') {
      setActiveSelection('empathize')
    } else {
      setActiveSelection('discover')
    }
  }, [activeFrameworkView])

  const frameworkPhases = getFrameworkPhases(activeFrameworkView)
  const phaseTools = VAERKTOEJER.filter((tool) => {
    // QR should be shown as standalone outside the Double Diamond list.
    if (tool.slug === 'qr-generator') return false
    if (activeFrameworkView === 'double-diamond' && activeSelection === 'hmw') return tool.slug === 'hmw'
    const defaultPhase = getDefaultPhaseForTool(activeFrameworkView, tool.slug)
    if (activeFrameworkView === 'double-diamond' && activeSelection === 'develop' && tool.slug === 'hmw') return true
    return defaultPhase === activeSelection
  })
  const standaloneTools = VAERKTOEJER.filter((tool) => tool.slug === 'qr-generator')
  const discoverMethods = [
    'Desk research',
    'Interviews',
    'Ekspertinterviews',
    'Voxpop',
    'Survey / spørgeskema',
    'Dagbogsstudier',
    'Shadowing',
    'Feltobservationer',
    'Netnografi',
    'Service Safari',
    'Fokusgrupper',
    'DIKW-pyramiden',
    'Shannon & Weaver',
    'Lasswell',
    "OMD's ECO-system",
    'RFM-modellen',
    'Henrik Vejlgaards Trend-diamant',
    'Diffusionsmodellen (Rogers)',
    'Gallup Kompasrose',
  ]
  const defineMethods = [
    'Affinity Diagram',
    'Card Sorting',
    'Empathy Map',
    'Persona Canvas',
    'Brugerrejse',
    "5 Why's",
    'HMW (How Might We)',
    'SWOT',
    'TOWS Matrix',
    'PESTEL',
    'Porters Five Forces',
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
    'Brainstorming',
    'Brainwriting',
    'Crazy Eights',
    'SCAMPER',
    'Mindmapping',
    'Reverse / Evil Brainstorm',
    'Circle writing',
    'Idéblomsten',
    'Krydsmetoden',
    'Lightning demos',
    'Skitser',
    'Moodboard',
  ]
  const deliverMethods = [
    'Survey / spørgeskema',
    'A/B/N Test',
    'Card Sorting',
    'Business Model Canvas',
    'Value Proposition Canvas',
    'SMUK-model',
    'David Aaker Identitetsmodel',
    'Repositioneringskort',
    'Crossing the Chasm',
    'AIDA / AIDAS',
    'AISAS',
    'See-Think-Do-Care',
    'Pirate Funnel (AARRR)',
    'Marketing Funnel',
    '4 Basics (trafik, salg, IT, service)',
    'Gantt-diagram',
    'Kanban Board',
    'QR Code Generator',
    'Survey Template',
  ]
  const sprintMethods: Record<GoogleDesignSprintPhase, string[]> = {
    understand: [
      'Desk research',
      'Interviews (kun eksisterende data / korte calls)',
      'Ekspertinterviews',
      'Gallup Kompasrose',
      'DIKW-pyramiden',
      'Shannon & Weaver',
      'Lasswell',
    ],
    sketch: [
      'Affinity Diagram',
      'Empathy Map',
      'Persona Canvas',
      'Brugerrejse',
      "5 Why's",
      'HMW',
      'Brainstorming',
      'Brainwriting',
      'Crazy Eights',
      'SCAMPER',
      'Lightning demos',
      'Mindmapping',
      'Skitser',
    ],
    decide: ['Dot voting', 'Heat map', 'Storyboard', 'Beslutning / løsningsvalg'],
    prototype: ['(Skitser -> konkret UI)'],
    test: [
      'Interviews (brugertest)',
      'Survey (let validering)',
      'A/B/N Test (kun hvis digitalt og hurtigt muligt)',
      'Card Sorting (kun hvis IA er central)',
    ],
  }
  const designThinkingMethods: Record<DesignThinkingPhase, string[]> = {
    empathize: discoverMethods,
    define: defineMethods,
    ideate: developMethods,
    prototype: deliverMethods,
    test: deliverMethods,
  }
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
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30 select-none">
                <ForgeLabLogo size={16} className="text-white" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-gray-900">ForgeLab</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5">
              {([
                ['/dashboard', 'Dashboard'],
                ['/tools/kanban', 'Kanban'],
                ['/tools/gantt', 'Gantt'],
              ] as [string, string][]).map(([h, l]) => (
                <Link key={h} href={h} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${h === '/dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>{l}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} strokeWidth={2.5} />
                Demo-tilstand
              </span>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={openNotifications}
                className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Notifikationer"
              >
                <Bell size={15} strokeWidth={2.2} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-4 text-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Notifikationer</p>
                    <span className="text-xs text-gray-400">{inviteProjects.length + mentionProjects.length}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {inviteProjects.length === 0 && mentionProjects.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-gray-400 text-center">Ingen notifikationer endnu.</div>
                    ) : (
                      <>
                        {mentionProjects.map((mention) => {
                          const isUnread = !mention.readAt
                          const preview = (mention.mentionContext || mention.mentionText || '').trim()
                          return (
                            <Link
                              key={mention.id}
                              href={`/dashboard/projects/${mention.projectId}`}
                              onClick={() => { void markMentionsAsSeen([mention.id]); setShowNotifications(false) }}
                              className={`block px-4 py-3 transition-colors ${isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{mention.projectName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{mention.mentionedByName} nævnte dig i {mention.sourceType === 'comment' ? 'en kommentar' : 'board-tekst'}.</p>
                                  {preview && <p className="text-xs text-gray-400 mt-1 truncate">{preview}</p>}
                                </div>
                                {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                              </div>
                            </Link>
                          )
                        })}
                        {inviteProjects.map((project) => {
                          const isUnread = !project.readAt
                          return (
                            <Link
                              key={project.id}
                              href={`/dashboard/projects/${project.projectId}`}
                              onClick={() => { void markInvitesAsSeen([project.id]); setShowNotifications(false) }}
                              className={`block px-4 py-3 transition-colors ${isUnread ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{project.projectName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{project.invitedByName} inviterede dig som {project.role === 'viewer' ? 'viewer' : 'editor'}.</p>
                                </div>
                                {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                              </div>
                            </Link>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/profile" className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase">
              {username ? username[0] : 'U'}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-5 py-8">
        {/* Hero / topsektion */}
        <section className="mb-10">
          <div
            className="relative overflow-hidden rounded-3xl text-white p-7 md:p-10"
            style={{
              background: ({
                'default': 'linear-gradient(135deg, #f59e0b 0%, #f59e0b 40%, #ea580c 100%)',
                'emerald': 'linear-gradient(135deg, #10b981 0%, #059669 40%, #047857 100%)',
                'chelsea': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
                'arsenal': 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)',
                'sunset': 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #c2410c 100%)',
                'lightning-purple': 'linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #5b21b6 100%)',
                'pink-cherry': 'linear-gradient(135deg, #ec4899 0%, #db2777 40%, #9d174d 100%)',
              } as Record<ForgeTheme, string>)[heroTheme],
              boxShadow: ({
                'default': '0 8px 48px -8px rgba(245,158,11,0.45)',
                'emerald': '0 8px 48px -8px rgba(16,185,129,0.45)',
                'chelsea': '0 8px 48px -8px rgba(59,130,246,0.45)',
                'arsenal': '0 8px 48px -8px rgba(239,68,68,0.45)',
                'sunset': '0 8px 48px -8px rgba(249,115,22,0.45)',
                'lightning-purple': '0 8px 48px -8px rgba(168,85,247,0.45)',
                'pink-cherry': '0 8px 48px -8px rgba(236,72,153,0.45)',
              } as Record<ForgeTheme, string>)[heroTheme],
            }}
          >
            {/* Decorative bg elements */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-1/3 w-80 h-40 rounded-full bg-black/15 blur-2xl" />
              <div className="absolute top-6 right-1/4 w-3 h-3 rounded-full bg-white/30" />
              <div className="absolute top-12 right-1/3 w-1.5 h-1.5 rounded-full bg-white/20" />
              <div className="absolute bottom-8 right-16 w-2 h-2 rounded-full bg-white/25" />
              <svg className="absolute bottom-0 right-0 opacity-10 w-64 h-32" viewBox="0 0 200 100" fill="none">
                <circle cx="180" cy="80" r="60" stroke="white" strokeWidth="1.5"/>
                <circle cx="180" cy="80" r="40" stroke="white" strokeWidth="1"/>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              {/* Left: greeting + actions */}
              <div className="flex-1 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/80 mb-4">
                  <Sparkles className="w-3 h-3" />
                  {({
                    'default': 'Forge Amber',
                    'emerald': 'Emerald Green',
                    'chelsea': 'Chelsea Blue',
                    'arsenal': 'Arsenal Red',
                    'sunset': 'Sunset Orange',
                    'lightning-purple': 'Lightning Purple',
                    'pink-cherry': 'Pink Cherry',
                  } as Record<ForgeTheme, string>)[heroTheme]}
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight leading-tight mb-3">
                  {greetingWithName}, klar til<br className="hidden md:block" /> næste eksperiment?
                </h1>
                <p className="text-sm md:text-base text-white/75 max-w-xl leading-relaxed mb-7">
                  Opret et projekt, tilknyt dine designtools og se resultater direkte i Analytics.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-lg shadow-black/30 hover:bg-black transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Nyt projekt
                  </button>
                  {latestProject && (
                    <Link
                      href={`/dashboard/projects/${latestProject.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 text-white/90 text-sm font-medium hover:bg-white/20 border border-white/20 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate max-w-[160px]">{latestProject.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: stat cards */}
              <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {[
                  { icon: Folder, label: 'Mine projekter', value: ownedProjects.length, sub: 'projekter du ejer' },
                  { icon: Users, label: 'Delt med mig', value: sharedProjects.length, sub: 'delte projekter' },
                  { icon: Wrench, label: 'Tilg. værktøjer', value: VAERKTOEJER.length, sub: 'klar til brug' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="rounded-2xl bg-white/12 border border-white/15 px-4 py-3.5 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-semibold uppercase tracking-wide mb-2">
                      <Icon className="w-3 h-3" />
                      {label}
                    </div>
                    <p className="text-3xl font-extrabold leading-none text-white mb-1">{value}</p>
                    <p className="text-[11px] text-white/50">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Workspaces */}
        <section>
          <WorkspacesSection
            workspaces={workspaces}
            projects={projects}
            onWorkspacesChange={loadWorkspaces}
          />
        </section>

        {/* Primær indhold: projekter */}
        <section className="mb-12">
          {/* Projekter */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                  <FolderOpen className="w-4.5 h-4.5 text-amber-600 w-[18px] h-[18px]" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight">Dine projekter</h2>
                  <p className="text-xs text-gray-400">
                    Saml alle dine designtools og eksperimenter samlet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Nyt projekt
              </button>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-10 text-center shadow-sm">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Indlæser dine projekter...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1.5">Klar til dit første projekt?</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                  Opret et projekt og tilknyt de designtools du vil bruge.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Opret dit første projekt
                </button>
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
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onDelete={handleDeleteProject}
                          deleting={deletingProjectId === p.id}
                          activeUsers={activeUsersByProject[p.id] || []}
                        />
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
                        <ProjectCard
                          key={p.id}
                          project={p}
                          deleting={false}
                          activeUsers={activeUsersByProject[p.id] || []}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight">
                  Værktøjer i{' '}
                  {activeFrameworkView === 'google-design-sprint'
                    ? 'Google Design Sprint'
                    : activeFrameworkView === 'design-thinking'
                      ? 'Design Thinking'
                      : 'Double Diamond'}
                </h2>
                <p className="text-xs text-gray-400">Vælg en fase og se relevante metoder.</p>
              </div>
            </div>
            <div className="inline-flex rounded-xl bg-gray-100/80 border border-gray-200/60 p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveFrameworkView('double-diamond')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFrameworkView === 'double-diamond'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/70'
                }`}
              >
                Double Diamond
              </button>
              <button
                type="button"
                onClick={() => setActiveFrameworkView('google-design-sprint')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFrameworkView === 'google-design-sprint'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/70'
                }`}
              >
                Google Design Sprint
              </button>
              <button
                type="button"
                onClick={() => setActiveFrameworkView('design-thinking')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFrameworkView === 'design-thinking'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/70'
                }`}
              >
                Design Thinking
              </button>
            </div>
          </div>

          <div className="swiss-panel p-4 md:p-6 mb-5">
            <div
              className={
                activeFrameworkView === 'double-diamond'
                  ? 'p-0 mb-5 overflow-x-auto'
                  : 'rounded-xl border border-neutral-200 bg-white p-3 md:p-4 mb-5 overflow-x-auto'
              }
            >
              {activeFrameworkView === 'google-design-sprint' ? (
                <GoogleDesignSprintDiagram
                  activeSelection={activeSelection as GoogleDesignSprintPhase}
                  onSelect={(selection) => setActiveSelection(selection)}
                />
              ) : activeFrameworkView === 'design-thinking' ? (
                <DesignThinkingDiagram
                  activeSelection={activeSelection as DesignThinkingPhase}
                  onSelect={(selection) => setActiveSelection(selection)}
                />
              ) : (
                <DoubleDiamondDiagram
                  activeSelection={activeSelection as DoubleDiamondPhase | 'hmw'}
                  onSelect={(selection) => setActiveSelection(selection)}
                />
              )}
            </div>

            <div className="mt-5">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 mb-3">
                <span className="w-2 h-2 rounded-full bg-black" />
                {activeFrameworkView === 'double-diamond' && activeSelection === 'hmw'
                  ? 'HMW'
                  : frameworkPhases.find((p) => p.id === activeSelection)?.label}
              </div>

              {(() => {
                let methods: string[] = []
                let sectionLabel = ''

                if (activeFrameworkView === 'double-diamond') {
                  if (activeSelection === 'discover') methods = discoverMethods
                  if (activeSelection === 'define') methods = defineMethods
                  if (activeSelection === 'develop') methods = developMethods
                  if (activeSelection === 'deliver') methods = deliverMethods
                  sectionLabel = `${frameworkPhases.find((p) => p.id === activeSelection)?.label || ''} metoder`
                } else if (activeFrameworkView === 'google-design-sprint') {
                  const sprintSelection = activeSelection as GoogleDesignSprintPhase
                  methods = sprintMethods[sprintSelection] || []
                  sectionLabel = `${frameworkPhases.find((p) => p.id === activeSelection)?.label || ''} sprint-metoder`
                } else {
                  const dtSelection = activeSelection as DesignThinkingPhase
                  methods = designThinkingMethods[dtSelection] || []
                  sectionLabel = `${frameworkPhases.find((p) => p.id === activeSelection)?.label || ''} metoder`
                }

                if (methods.length === 0) return null
                return (
                  <div className="mb-4 bg-amber-50/40 p-3 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-amber-800 mb-2">
                      {sectionLabel} (ikke nødvendigvis tools)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {methods.map((method) => renderMethodChip(method))}
                    </div>
                  </div>
                )
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {phaseTools.map((tool) => {
                  const { Icon, bg, text } = getToolIcon(tool.slug)
                  return (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white transition-colors rounded-lg"
                    >
                      <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${bg} ${text}`}>
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
