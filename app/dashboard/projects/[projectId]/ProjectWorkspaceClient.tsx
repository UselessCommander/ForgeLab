'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import Link from 'next/link'
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

import { ToolEmbedProvider } from '@/components/ToolEmbedContext'
import { getToolComponent } from '@/components/ToolRegistry'

interface ProjectWorkspaceClientProps {
  projectId: string
}

type CardPosition = { x: number; y: number }

const CARD_COLORS = [
  { bg: '#FFF9C4', border: '#F9E83A', accent: '#CA9E00' },
  { bg: '#E0F7FA', border: '#4DD0E1', accent: '#006064' },
  { bg: '#FCE4EC', border: '#F48FB1', accent: '#880E4F' },
  { bg: '#F3E5F5', border: '#CE93D8', accent: '#4A148C' },
  { bg: '#E8F5E9', border: '#81C784', accent: '#1B5E20' },
  { bg: '#FFF3E0', border: '#FFCC80', accent: '#E65100' },
  { bg: '#E3F2FD', border: '#90CAF9', accent: '#0D47A1' },
  { bg: '#F1F8E9', border: '#AED581', accent: '#33691E' },
]

function getCardColor(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length]
}

// ── Mock data for local dev (no database) ────────────────────────
const MOCK_PROJECT: Project = {
  id: 'demo',
  name: '🎨 Demo Projekt',
  description: 'Dette er et demo-projekt (ingen database tilsluttet)',
  toolIds: ['swot-generator', 'kanban', 'empathy-map', 'brainstorming', 'gantt-chart'],
  framework: 'none',
  toolPhases: {},
  ddCanvasLayout: {},
  role: 'owner',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
}

export default function ProjectWorkspaceClient({ projectId }: ProjectWorkspaceClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [showAddTool, setShowAddTool] = useState(false)
  const [showPanel, setShowPanel] = useState<'settings' | 'collaborate' | null>(null)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')

  // ── Canvas state ──────────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })

  // ── Card positions ─────────────────────────────────────────────────
  const [cardPositions, setCardPositions] = useState<Record<string, CardPosition>>({})
  const dragging = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

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
      const [p, m] = await Promise.all([
        getProject(projectId).catch(() => null),
        getProjectMembers(projectId).catch(() => []),
      ])
      if (p) {
        setProject(p)
        setMembers(m || [])
        setIsOffline(false)
        if (p.ddCanvasLayout) {
          const pos: Record<string, CardPosition> = {}
          Object.entries(p.ddCanvasLayout).forEach(([slug, { x, y }]) => {
            pos[slug] = { x: x * 1600, y: y * 900 }
          })
          setCardPositions(pos)
        }
      } else {
        // No DB available — use mock project so UI is still visible
        setProject(MOCK_PROJECT)
        setMembers([])
        setIsOffline(true)
      }
    } catch (err) {
      console.warn('DB unavailable, using mock project:', err)
      setProject(MOCK_PROJECT)
      setMembers([])
      setIsOffline(true)
    } finally {
      setLoading(false)
    }
  }

  const defaultPos = useCallback(
    (slug: string, idx: number): CardPosition => {
      if (cardPositions[slug]) return cardPositions[slug]
      const col = idx % 3
      const row = Math.floor(idx / 3)
      return { x: 60 + col * 320, y: 60 + row * 230 }
    },
    [cardPositions]
  )

  const persistLayout = useCallback(
    (positions: Record<string, CardPosition>) => {
      if (!project) return
      const norm: Record<string, { x: number; y: number }> = {}
      Object.entries(positions).forEach(([slug, { x, y }]) => {
        norm[slug] = { x: x / 1600, y: y / 900 }
      })
      updateProject(projectId, { ddCanvasLayout: norm }).catch(console.error)
    },
    [project, projectId]
  )

  // ── Canvas event handlers ──────────────────────────────────────────
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    // only start panning if clicking the canvas background itself
    if (!target.classList.contains('canvas-bg') && target !== canvasRef.current) return
    isPanning.current = true
    lastPanPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x
      const dy = e.clientY - lastPanPos.current.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      lastPanPos.current = { x: e.clientX, y: e.clientY }
    }
    if (dragging.current) {
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = (e.clientX - rect.left - pan.x) / zoom
      const my = (e.clientY - rect.top - pan.y) / zoom
      const newPos = { x: mx - dragOffset.current.x, y: my - dragOffset.current.y }
      setCardPositions(prev => ({ ...prev, [dragging.current!]: newPos }))
    }
  }

  const onCanvasMouseUp = () => {
    isPanning.current = false
    if (dragging.current) {
      const slug = dragging.current
      dragging.current = null
      setCardPositions(prev => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => persistLayout(prev), 800)
        return { ...prev }
      })
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.min(2.5, Math.max(0.25, z * (e.deltaY > 0 ? 0.92 : 1.08))))
  }

  // ── Card drag ──────────────────────────────────────────────────────
  const onCardMouseDown = (e: React.MouseEvent, slug: string, idx: number) => {
    if (!canEdit) return
    e.stopPropagation()
    const rect = canvasRef.current!.getBoundingClientRect()
    const pos = cardPositions[slug] || defaultPos(slug, idx)
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - pos.x, y: my - pos.y }
    dragging.current = slug
    if (!cardPositions[slug]) setCardPositions(p => ({ ...p, [slug]: pos }))
    e.preventDefault()
  }

  // ── Tool actions ───────────────────────────────────────────────────
  const handleAddTool = async (toolId: string) => {
    if (project?.role === 'viewer') return alert('Du har kun læseadgang til dette projekt.')
    if (modifying) return
    if (isOffline) {
      // Local demo mode: just add to local state
      setProject(prev => prev ? { ...prev, toolIds: [...prev.toolIds, toolId] } : prev)
      setShowAddTool(false)
      return
    }
    try {
      setModifying(true)
      await addToolToProject(projectId, toolId)
      await loadProject()
      setShowAddTool(false)
    } catch {
      alert('Kunne ikke tilføje værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleRemoveTool = async (toolId: string) => {
    if (project?.role === 'viewer') return alert('Du har kun læseadgang til dette projekt.')
    if (modifying) return
    if (isOffline) {
      // Local demo mode: just remove from local state
      setProject(prev => prev ? { ...prev, toolIds: prev.toolIds.filter(id => id !== toolId) } : prev)
      setCardPositions(prev => { const n = { ...prev }; delete n[toolId]; return n })
      return
    }
    try {
      setModifying(true)
      await removeToolFromProject(projectId, toolId)
      setCardPositions(prev => { const n = { ...prev }; delete n[toolId]; return n })
      await loadProject()
    } catch {
      alert('Kunne ikke fjerne værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleFrameworkChange = async (framework: FrameworkId) => {
    if (!canEdit || modifying || !project) return
    if (isOffline) {
      setProject(prev => prev ? { ...prev, framework } : prev)
      return
    }
    try {
      setModifying(true)
      await updateProject(projectId, { framework })
      await loadProject()
    } catch {
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
      setProject({ ...project, toolPhases: { ...(project.toolPhases || {}), [toolSlug]: phase } })
    } catch {
      alert('Kunne ikke flytte værktøjet til ny fase. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleInvite = async () => {
    if (!isOwner || !inviteUsername.trim()) return
    try {
      setModifying(true)
      await inviteProjectMember(projectId, inviteUsername.trim(), inviteRole)
      setInviteUsername('')
      setInviteRole('editor')
      setMembers((await getProjectMembers(projectId)) || [])
    } catch (err: any) {
      alert(err?.message || 'Kunne ikke invitere medlem.')
    } finally {
      setModifying(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!isOwner) return
    try {
      setModifying(true)
      await removeProjectMember(projectId, userId)
      setMembers((await getProjectMembers(projectId)) || [])
    } catch (err: any) {
      alert(err?.message || 'Kunne ikke fjerne medlem.')
    } finally {
      setModifying(false)
    }
  }

  // ── Loading / not found ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={S.fullscreen}>
        <div style={{ textAlign: 'center' }}>
          <div style={S.spinner} />
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 16 }}>Indlæser projekt…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ ...S.fullscreen, flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ color: '#6B7280', marginBottom: 12, fontSize: 15 }}>Projekt ikke fundet.</p>
          <Link href="/dashboard" style={{ color: '#D97706', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            ← Tilbage til dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Derived data ───────────────────────────────────────────────────
  const allowed = new Set<string>(TOOL_SLUGS as readonly string[])
  const projectTools = project.toolIds.map(id => ({ slug: id, tool: getVaerktoejBySlug(id) })).filter(x => x.tool)
  // In offline/demo mode allow all tools, not just allowed slugs
  const toAdd = VAERKTOEJER.filter(t =>
    (isOffline || allowed.has(t.slug)) && !project.toolIds.includes(t.slug)
  )
  const byKategori = getVaerktoejerGroupedByKategori(t => allowed.has(t.slug) && !project.toolIds.includes(t.slug))
  const byPhase = DOUBLE_DIAMOND_PHASES.map(phase => ({
    phase,
    tools: toAdd.filter(t => getDefaultPhaseForTool('double-diamond', t.slug) === phase.id),
  })).filter(g => g.tools.length > 0)

  const toolCount = projectTools.length
  const framework = project.framework || 'none'
  const canEdit = project.role === 'owner' || project.role === 'editor'
  const isOwner = project.role === 'owner'
  const toolPhases = project.toolPhases || {}
  const lastUpdated = project.updatedAt ? new Date(project.updatedAt).toLocaleString('da-DK') : '–'

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#ECEAE5', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

      {/* Offline / demo mode banner */}
      {isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: 'linear-gradient(90deg, #FEF3C7, #FDE68A)',
          borderBottom: '1px solid #FCD34D',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 12, color: '#92400E', fontWeight: 500,
        }}>
          <span>⚠️</span>
          <span>Demo-tilstand — ingen database tilsluttet. Ændringer gemmes ikke.</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          TOP BAR
      ════════════════════════════════════════════════ */}
      <div style={{ ...S.topbar, top: isOffline ? 33 : 0 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <Link href="/dashboard" style={S.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div style={S.projectBadge}>
            <span style={{ fontSize: 16 }}>⚗️</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {project.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
              {toolCount} værktøj{toolCount !== 1 ? 'er' : ''} · {project.role}
            </p>
          </div>
        </div>

        {/* Center: zoom */}
        <div style={S.zoomBar}>
          <button style={S.zoomBtn} onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}>−</button>
          <button style={{ ...S.zoomBtn, minWidth: 52, fontSize: 12, fontWeight: 700 }} onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }) }}>
            {Math.round(zoom * 100)}%
          </button>
          <button style={S.zoomBtn} onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}>+</button>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowPanel(p => p === 'collaborate' ? null : 'collaborate')}
            style={{ ...S.iconBtn, background: showPanel === 'collaborate' ? '#FEF3C7' : 'white', color: showPanel === 'collaborate' ? '#92400E' : '#374151' }}
            title="Samarbejde"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Samarbejde</span>
          </button>

          <button
            onClick={() => setShowPanel(p => p === 'settings' ? null : 'settings')}
            style={{ ...S.iconBtn, background: showPanel === 'settings' ? '#FEF3C7' : 'white', color: showPanel === 'settings' ? '#92400E' : '#374151' }}
            title="Indstillinger"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <button
            onClick={() => setShowAddTool(true)}
            disabled={!canEdit}
            style={{
              ...S.iconBtn,
              background: canEdit ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#E5E7EB',
              color: canEdit ? 'white' : '#9CA3AF',
              border: 'none',
              boxShadow: canEdit ? '0 2px 10px rgba(245,158,11,0.45)' : 'none',
              cursor: canEdit ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Tilføj værktøj</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          INFINITE CANVAS
      ════════════════════════════════════════════════ */}
      <ToolEmbedProvider projectId={projectId}>
        <div
        ref={canvasRef}
        className="canvas-bg"
        style={{
          position: 'fixed',
          inset: 0,
          top: isOffline ? 89 : 56,
          cursor: isPanning.current ? 'grabbing' : 'grab',
          backgroundImage: 'radial-gradient(circle, #C5C1BB 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x % (24 * zoom)}px ${pan.y % (24 * zoom)}px`,
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        onWheel={onWheel}
      >
        {/* Transform layer */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: 'transform',
          }}
        >
          {/* Empty state */}
          {toolCount === 0 && (
            <div style={{
              position: 'absolute', top: 200, left: 300,
              textAlign: 'center', userSelect: 'none', pointerEvents: 'none',
              width: 320,
            }}>
              <div style={{ fontSize: 72, marginBottom: 12, filter: 'grayscale(0.3)', opacity: 0.5 }}>🧰</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#6B7280', margin: 0 }}>Boardet er tomt</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Klik <strong>"Tilføj værktøj"</strong> i toolbaren øverst</p>
            </div>
          )}

          {/* ── Tool cards ─────────────────────────────── */}
          {projectTools.map(({ slug, tool }, idx) => {
            if (!tool) return null
            const { Icon } = getToolIcon(slug)
            const c = getCardColor(slug)
            const pos = cardPositions[slug] || defaultPos(slug, idx)
            const isDragging = dragging.current === slug
            const phase = framework === 'double-diamond' ? ((toolPhases[slug] as DoubleDiamondPhase) || null) : null
            const phaseLabel = phase ? DOUBLE_DIAMOND_PHASES.find(p => p.id === phase)?.label : null

            return (
              <div
                key={slug}
                onMouseDownCapture={() => {
                  // Bring card to front logic could go here if we dynamically sorted, 
                  // but currently Z-index is based on 'isDragging'.
                }}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: 600, // Større standardbredde nu hvor de er voksne komponenter
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  background: c.bg,
                  border: `2px solid ${c.border}`,
                  borderRadius: 18,
                  boxShadow: isDragging
                    ? '0 24px 48px rgba(0,0,0,0.22), 0 8px 16px rgba(0,0,0,0.1)'
                    : '0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
                  resize: 'both', // Gør kortene resizable
                  overflow: 'hidden',
                  userSelect: 'none',
                  transition: isDragging ? 'box-shadow 0.1s' : 'box-shadow 0.2s, border-color 0.2s',
                  transform: isDragging ? 'rotate(-1.5deg) scale(1.03)' : 'none',
                  zIndex: isDragging ? 1000 : 1,
                }}
              >
                {/* Drag handle strip */}
                {canEdit && (
                  <div 
                    data-drag-handle="true"
                    onMouseDown={e => onCardMouseDown(e, slug, idx)}
                    style={{
                    height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: `1px dashed ${c.border}`, cursor: 'grab',
                    opacity: 0.5,
                  }}>
                    <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                      {[0,6,12,18].map(x => [0,4].map(y => (
                        <circle key={`${x}-${y}`} cx={x+2} cy={y+2} r="1.5" fill={c.accent} />
                      )))}
                    </svg>
                  </div>
                )}

                {/* Header */}
                <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(255,255,255,0.75)',
                    border: `1.5px solid ${c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 18, height: 18, color: c.accent }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.accent, lineHeight: 1.35 }}>
                      {tool.title}
                    </h3>
                    {phaseLabel && (
                      <span style={{
                        display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 600,
                        color: c.accent, opacity: 0.75,
                        background: 'rgba(255,255,255,0.55)', borderRadius: 5, padding: '1px 7px',
                        letterSpacing: '0.04em',
                      }}>
                        {phaseLabel}
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); handleRemoveTool(slug) }}
                      title="Fjern fra projekt"
                      style={{
                        width: 22, height: 22, border: 'none', borderRadius: 7,
                        background: 'rgba(255,255,255,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#9CA3AF', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.color = '#9CA3AF' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Description - vi reducerer denne eller fjerner den i embed mode */}
                <p style={{ margin: '0 12px 10px', fontSize: 11.5, color: c.accent, opacity: 0.65, lineHeight: 1.55 }}>
                  {tool.shortDescription.length > 85 ? tool.shortDescription.slice(0, 85) + '…' : tool.shortDescription}
                </p>

                {/* Værktøjets indhold fylder resten af kortet */}
                <div 
                  style={{ flex: 1, padding: '0 0 12px 0', overflow: 'auto', pointerEvents: isDragging ? 'none' : 'auto', userSelect: 'auto', position: 'relative' }}
                  onMouseDown={e => e.stopPropagation()} // Stop dragging from inside tool
                >
                  {(() => {
                    const ToolComponent = getToolComponent(slug)
                    if (ToolComponent) {
                      return <ToolComponent />
                    }
                    return (
                      <p style={{ margin: '12px', fontSize: 13, color: c.accent, opacity: 0.65 }}>
                        Modul ikke understøttet i lærred-visning endnu.
                      </p>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SIDE PANELS
      ════════════════════════════════════════════════ */}
      {showPanel && (
        <div style={{
          position: 'fixed', top: isOffline ? 89 : 56, right: 0, bottom: 0, width: 300,
          background: 'white', borderLeft: '1px solid #E5E7EB', zIndex: 200,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-6px 0 24px rgba(0,0,0,0.07)',
          animation: 'slideIn 0.2s ease',
        }}>
          <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:none;opacity:1}}`}</style>

          {/* Panel header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
              {showPanel === 'settings' ? '⚙️ Projektindstillinger' : '👥 Samarbejde'}
            </h2>
            <button onClick={() => setShowPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {showPanel === 'settings' && (
              <>
                <Section label="Navn">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{project.name}</p>
                  {project.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6B7280' }}>{project.description}</p>}
                </Section>

                <Section label="Framework">
                  <select
                    value={framework}
                    onChange={e => handleFrameworkChange((e.target.value as FrameworkId) || 'none')}
                    disabled={!canEdit || modifying}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, background: 'white', color: '#374151' }}
                  >
                    <option value="none">Ingen framework</option>
                    <option value="double-diamond">Double Diamond</option>
                  </select>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                    Med Double Diamond kan du tildele faser til hvert værktøj.
                  </p>
                </Section>

                <Section label="Info">
                  <InfoRow label="Rolle" value={project.role || '–'} />
                  <InfoRow label="Sidst opdateret" value={lastUpdated} />
                  <InfoRow label="Antal værktøjer" value={String(toolCount)} />
                </Section>
              </>
            )}

            {showPanel === 'collaborate' && (
              <>
                {isOwner ? (
                  <Section label="Invitér et nyt medlem">
                    <input
                      value={inviteUsername}
                      onChange={e => setInviteUsername(e.target.value)}
                      placeholder="Brugernavn"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, marginBottom: 8, outline: 'none' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#F59E0B')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, background: 'white' }}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={handleInvite}
                        disabled={modifying || !inviteUsername.trim()}
                        style={{
                          padding: '0 16px', borderRadius: 10, border: 'none',
                          background: '#111827', color: 'white',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          opacity: inviteUsername.trim() ? 1 : 0.4,
                        }}
                      >Invitér</button>
                    </div>
                  </Section>
                ) : (
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>Kun owner kan invitere/fjerne medlemmer.</p>
                )}

                <Section label={`Medlemmer (${members.length})`}>
                  {members.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Ingen endnu.</p>
                  ) : members.map(m => (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(m.username || m.user_id).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username || m.user_id}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{m.role}</p>
                      </div>
                      {isOwner && m.role !== 'owner' && (
                        <button onClick={() => handleRemoveMember(m.user_id)} style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Fjern</button>
                      )}
                    </div>
                  ))}
                </Section>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          ADD TOOL MODAL
      ════════════════════════════════════════════════ */}
      {showAddTool && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowAddTool(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 500, maxHeight: '82vh', background: 'white', borderRadius: 22, boxShadow: '0 32px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>+ Tilføj værktøj</h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9CA3AF' }}>Vælg et værktøj til dit board.</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {toAdd.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>🎉 Alle værktøjer er tilføjet!</p>
              ) : (framework === 'double-diamond' ? byPhase.map(({ phase, tools }) => (
                <div key={phase.id} style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{phase.label}</p>
                  {tools.map(tool => <ToolPickerRow key={tool.slug} tool={tool} onAdd={() => handleAddTool(tool.slug)} />)}
                </div>
              )) : byKategori.map(({ kategori, tools }) => (
                <div key={kategori.id} style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{kategori.label}</p>
                  {tools.map(tool => <ToolPickerRow key={tool.slug} tool={tool} onAdd={() => handleAddTool(tool.slug)} />)}
                </div>
              )))}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
              <button onClick={() => setShowAddTool(false)} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 14, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hint bar ──────────────────────────────────────────────── */}
      <div style={S.hintBar}>
        <span>🖱️ Scroll = zoom</span>
        <span style={{ opacity: 0.35 }}>·</span>
        <span>🤚 Træk baggrund = pan</span>
        {canEdit && <><span style={{ opacity: 0.35 }}>·</span><span>✦ Træk kort for at flytte</span></>}
      </div>
      </ToolEmbedProvider>
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F9FAFB', borderRadius: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{value}</span>
    </div>
  )
}

function ToolPickerRow({ tool, onAdd }: { tool: { slug: string; title: string; shortDescription: string }; onAdd: () => void }) {
  const { Icon, bg, text } = getToolIcon(tool.slug)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 12px', borderRadius: 12,
        border: hovered ? '1.5px solid #FCD34D' : '1.5px solid #F3F4F6',
        background: hovered ? '#FFFBF0' : 'white',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
        marginBottom: 6,
      }}
    >
      <div className={`${bg} ${text}`} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 17, height: 17 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{tool.title}</p>
        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.shortDescription}</p>
      </div>
      <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, flexShrink: 0 }}>+ Tilføj</span>
    </button>
  )
}

// ── Style constants ────────────────────────────────────────────────
const S = {
  fullscreen: {
    width: '100vw', height: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#ECEAE5', fontFamily: 'Inter, system-ui, sans-serif',
  } as React.CSSProperties,

  spinner: {
    width: 44, height: 44, borderRadius: '50%',
    border: '3px solid #E5E0D8', borderTop: '3px solid #F59E0B',
    animation: 'spin 0.75s linear infinite', margin: '0 auto',
  } as React.CSSProperties,

  topbar: {
    position: 'fixed', left: 0, right: 0, height: 56, zIndex: 100,
    background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
    boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
  } as React.CSSProperties,

  backBtn: {
    width: 32, height: 32, borderRadius: 9, border: '1.5px solid #E5E7EB',
    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6B7280', textDecoration: 'none', flexShrink: 0,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  projectBadge: {
    width: 32, height: 32, borderRadius: 10,
    background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
    border: '1.5px solid #FCD34D',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  } as React.CSSProperties,

  zoomBar: {
    display: 'flex', alignItems: 'center', gap: 2,
    background: '#F9FAFB', borderRadius: 10, padding: '2px 3px',
    border: '1px solid #E5E7EB', flexShrink: 0,
  } as React.CSSProperties,

  zoomBtn: {
    width: 28, height: 28, borderRadius: 7, border: 'none',
    background: 'transparent', cursor: 'pointer',
    fontSize: 16, color: '#6B7280',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,

  iconBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB',
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
    transition: 'all 0.15s', color: '#374151', background: 'white',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  hintBar: {
    position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(17,24,39,0.72)', backdropFilter: 'blur(8px)',
    borderRadius: 99, padding: '6px 16px', color: 'white', fontSize: 11,
    zIndex: 50, pointerEvents: 'none', display: 'flex', alignItems: 'center',
    gap: 8, whiteSpace: 'nowrap', letterSpacing: '0.01em',
  } as React.CSSProperties,
}
