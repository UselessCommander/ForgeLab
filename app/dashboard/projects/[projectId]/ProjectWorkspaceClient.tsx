'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import {
  getProject,
  addToolToProject,
  removeToolFromProject,
  updateProject,
  getProjectToolData,
  saveProjectToolData,
  updateProjectToolPhases,
  getProjectMembers,
  inviteProjectMember,
  removeProjectMember,
  type Project,
  type ProjectMember,
} from '@/lib/projects'
import {
  DOUBLE_DIAMOND_PHASES,
  DESIGN_THINKING_PHASES,
  GOOGLE_DESIGN_SPRINT_PHASES,
  getFrameworkPhases,
  getDefaultPhaseForTool,
  type DoubleDiamondPhase,
  type DesignThinkingPhase,
  type GoogleDesignSprintPhase,
  type FrameworkId,
} from '@/lib/frameworks'
import { VAERKTOEJER, getVaerktoejBySlug, getVaerktoejerGroupedByKategori } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import { TOOL_SLUGS } from '@/lib/tool-slugs'
import { supabase } from '@/lib/supabase'

import { ToolEmbedProvider } from '@/components/ToolEmbedContext'
import { getToolComponent } from '@/components/ToolRegistry'
import AiChatCompanion from '@/components/AiChatCompanion'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'
import DesignThinkingDiagram from '@/components/dashboard/DesignThinkingDiagram'
import GoogleDesignSprintDiagram from '@/components/dashboard/GoogleDesignSprintDiagram'
import ProjectDocsTab from '@/components/ProjectDocsTab'
import ProjectSlidesTab from '@/components/ProjectSlidesTab'

interface ProjectWorkspaceClientProps {
  projectId: string
}

type CardPosition = { x: number; y: number }
type FlowShape = 'terminator' | 'process' | 'decision' | 'data' | 'document' | 'database'
type FlowNode = { id: string; x: number; y: number; label: string; shape: FlowShape }
type FlowConnectorSide = 'left' | 'top' | 'bottom'
type FlowEdge = { id: string; from: string; to: string; fromSide?: FlowConnectorSide; toSide?: FlowConnectorSide }
type FlowEdgeDraft = {
  fromNodeId: string
  fromSide: FlowConnectorSide
  startX: number
  startY: number
  currentX: number
  currentY: number
}

type LiveCursorPayload = {
  userId: string
  username: string
  x: number
  y: number
  visible: boolean
  ts: number
}

type LiveCursor = LiveCursorPayload & {
  color: string
  updatedAt: number
}

const FLOWCHART_TOOL_SLUG = 'project-board-flowchart'
const CURSOR_STALE_MS = 12000
const CURSOR_SEND_INTERVAL_MS = 50
const CURSOR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#4F46E5']

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

const FLOW_SHAPE_LIBRARY: Array<{ shape: FlowShape; label: string }> = [
  { shape: 'terminator', label: 'Start / Slut' },
  { shape: 'process', label: 'Proces' },
  { shape: 'decision', label: 'Beslutning' },
  { shape: 'data', label: 'Input / Output' },
  { shape: 'document', label: 'Dokument' },
  { shape: 'database', label: 'Database' },
]

const BOARD_EXCLUDED_TOOL_SLUGS = new Set<string>(['kanban', 'gantt-chart'])

function getCardColor(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length]
}

function getStableCursorColor(userId: string) {
  if (!userId) return CURSOR_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
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
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'board' | 'planning' | 'docs' | 'slides'>('board')
  const [showAddTool, setShowAddTool] = useState(false)
  const [addToolSearch, setAddToolSearch] = useState('')
  const [selectedAddToolCategory, setSelectedAddToolCategory] = useState<'all' | string>('all')
  const [showAllAddToolResults, setShowAllAddToolResults] = useState(false)
  const [showPanel, setShowPanel] = useState<'settings' | 'collaborate' | null>(null)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string>('Dig')
  const [liveCursors, setLiveCursors] = useState<Record<string, LiveCursor>>({})

  // ── Canvas state ──────────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [zoom, setZoom] = useState(1)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanningActive, setIsPanningActive] = useState(false)
  const [showFlowPanel, setShowFlowPanel] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPointerOverCanvasRef = useRef(false)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })

  // ── Card positions ─────────────────────────────────────────────────
  const [cardPositions, setCardPositions] = useState<Record<string, CardPosition>>({})
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([])
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([])
  const [linkingFromNodeId, setLinkingFromNodeId] = useState<string | null>(null)
  const [selectedFlowNodeId, setSelectedFlowNodeId] = useState<string | null>(null)
  const [draggingPaletteShape, setDraggingPaletteShape] = useState<FlowShape | null>(null)
  const [edgeDraft, setEdgeDraft] = useState<FlowEdgeDraft | null>(null)
  const dragging = useRef<string | null>(null)
  const draggingFlowNode = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flowSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorChannelRef = useRef<any>(null)
  const lastCursorSendAtRef = useRef(0)

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!data?.authenticated) return
        if (typeof data.userId === 'string' && data.userId.trim()) {
          setCurrentUserId(data.userId)
        }
        if (typeof data.username === 'string' && data.username.trim()) {
          setCurrentUsername(data.username.trim())
        }
      } catch (error) {
        console.warn('Kunne ikke hente current user til live cursor:', error)
      }
    }
    void loadCurrentUser()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (event.code === 'Space' && !isTypingTarget) {
        event.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setIsSpacePressed(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const blockBrowserZoomWhileOnCanvas = (event: WheelEvent) => {
      if (!isPointerOverCanvasRef.current) return
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }
    }

    // Some browsers (especially Safari/trackpad pinch) need native non-passive listeners
    window.addEventListener('wheel', blockBrowserZoomWhileOnCanvas, { passive: false })
    return () => {
      window.removeEventListener('wheel', blockBrowserZoomWhileOnCanvas)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (flowSaveTimer.current) clearTimeout(flowSaveTimer.current)
    }
  }, [])

  const broadcastCursor = useCallback(
    async (worldX: number, worldY: number, visible: boolean) => {
      const channel = cursorChannelRef.current
      if (!channel || !currentUserId || activeWorkspaceTab !== 'board') return
      const now = Date.now()
      if (visible && now - lastCursorSendAtRef.current < CURSOR_SEND_INTERVAL_MS) return
      lastCursorSendAtRef.current = now
      const payload: LiveCursorPayload = {
        userId: currentUserId,
        username: currentUsername,
        x: worldX,
        y: worldY,
        visible,
        ts: now,
      }
      await channel.send({ type: 'broadcast', event: 'cursor_move', payload })
    },
    [activeWorkspaceTab, currentUserId, currentUsername]
  )

  useEffect(() => {
    if (activeWorkspaceTab !== 'board' || !projectId || !currentUserId) return

    const channel: any = supabase.channel(`project-live-cursors:${projectId}`, {
      config: { broadcast: { self: false } },
    })
    channel
      .on('broadcast', { event: 'cursor_move' }, (message: { payload?: LiveCursorPayload }) => {
        const payload = message?.payload
        if (!payload || !payload.userId || payload.userId === currentUserId) return
        const now = Date.now()
        const color = getStableCursorColor(payload.userId)
        setLiveCursors(prev => ({
          ...prev,
          [payload.userId]: {
            ...payload,
            color,
            updatedAt: now,
          },
        }))
      })
      .subscribe()

    cursorChannelRef.current = channel
    setLiveCursors({})

    const staleCleanup = window.setInterval(() => {
      const now = Date.now()
      setLiveCursors(prev => {
        const next: Record<string, LiveCursor> = {}
        for (const [userId, cursor] of Object.entries(prev)) {
          if (now - cursor.updatedAt <= CURSOR_STALE_MS) {
            next[userId] = cursor
          }
        }
        return next
      })
    }, 2000)

    return () => {
      window.clearInterval(staleCleanup)
      void channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: currentUserId,
          username: currentUsername,
          x: 0,
          y: 0,
          visible: false,
          ts: Date.now(),
        } satisfies LiveCursorPayload,
      })
      cursorChannelRef.current = null
      void channel.unsubscribe()
    }
  }, [activeWorkspaceTab, currentUserId, currentUsername, projectId])

  useEffect(() => {
    const onKeyDownDeleteFlowNode = (event: KeyboardEvent) => {
      const isEditable = project?.role === 'owner' || project?.role === 'editor'
      if (!isEditable || !selectedFlowNodeId) return
      if (event.key !== 'Backspace' && event.key !== 'Delete') return

      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isTypingTarget) return

      event.preventDefault()
      removeFlowNode(selectedFlowNodeId)
    }

    window.addEventListener('keydown', onKeyDownDeleteFlowNode)
    return () => {
      window.removeEventListener('keydown', onKeyDownDeleteFlowNode)
    }
  }, [project?.role, selectedFlowNodeId])

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

  useEffect(() => {
    const onReloadProjectTools = () => {
      void loadProject()
    }
    window.addEventListener('forgelab-reload-project-tools', onReloadProjectTools)
    return () => {
      window.removeEventListener('forgelab-reload-project-tools', onReloadProjectTools)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const defaultPos = useCallback(
    (slug: string, idx: number): CardPosition => {
      if (cardPositions[slug]) return cardPositions[slug]
      const col = idx % 3
      const row = Math.floor(idx / 3)
      return { x: 60 + col * 320, y: 60 + row * 230 }
    },
    [cardPositions]
  )

  useEffect(() => {
    let mounted = true
    const loadFlowchart = async () => {
      try {
        const raw = await getProjectToolData(projectId, FLOWCHART_TOOL_SLUG)
        if (!mounted) return
        const nodes = Array.isArray(raw?.nodes) ? raw.nodes : []
        const edges = Array.isArray(raw?.edges) ? raw.edges : []
        setFlowNodes(
          nodes
            .filter((n: any) => n && typeof n.id === 'string')
            .map((n: any) => ({
              id: n.id,
              x: typeof n.x === 'number' ? n.x : 100,
              y: typeof n.y === 'number' ? n.y : 100,
              label: typeof n.label === 'string' && n.label.trim() ? n.label : 'Trin',
              shape: (['terminator', 'process', 'decision', 'data', 'document', 'database'] as const).includes(n.shape)
                ? n.shape
                : 'process',
            }))
        )
        setFlowEdges(
          edges
            .filter((e: any) => e && typeof e.id === 'string' && typeof e.from === 'string' && typeof e.to === 'string')
            .map((e: any) => ({
              id: e.id,
              from: e.from,
              to: e.to,
              fromSide: (e.fromSide === 'left' || e.fromSide === 'top' || e.fromSide === 'bottom') ? e.fromSide : undefined,
              toSide: (e.toSide === 'left' || e.toSide === 'top' || e.toSide === 'bottom') ? e.toSide : undefined,
            }))
        )
      } catch {
        // ignore load errors and start with empty flowchart
      }
    }
    loadFlowchart()
    return () => {
      mounted = false
    }
  }, [projectId])

  const persistFlowchart = useCallback(
    (nextNodes: FlowNode[], nextEdges: FlowEdge[]) => {
      if (flowSaveTimer.current) clearTimeout(flowSaveTimer.current)
      flowSaveTimer.current = setTimeout(() => {
        saveProjectToolData(projectId, FLOWCHART_TOOL_SLUG, {
          nodes: nextNodes,
          edges: nextEdges,
          updatedAt: Date.now(),
        }).catch(console.error)
      }, 400)
    },
    [projectId]
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
    setSelectedFlowNodeId(null)
    const target = e.target as HTMLElement
    const middleMousePan = e.button === 1
    const leftMousePan = e.button === 0 && isSpacePressed

    if (middleMousePan || leftMousePan) {
      isPanning.current = true
      setIsPanningActive(true)
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      return
    }

    // only start panning if clicking the canvas background itself
    if (!target.classList.contains('canvas-bg') && target !== canvasRef.current) return
    isPanning.current = true
    setIsPanningActive(true)
    lastPanPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY)
    void broadcastCursor(worldPoint.x, worldPoint.y, true)
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x
      const dy = e.clientY - lastPanPos.current.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      lastPanPos.current = { x: e.clientX, y: e.clientY }
    }
    if (dragging.current) {
      const newPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      setCardPositions(prev => ({ ...prev, [dragging.current!]: newPos }))
    }
    if (draggingFlowNode.current) {
      const nodeId = draggingFlowNode.current
      setFlowNodes(prev =>
        prev.map(node =>
          node.id === nodeId ? { ...node, x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y } : node
        )
      )
    }
    if (edgeDraft) {
      const hit = getConnectorHitAtWorldPoint(worldPoint.x, worldPoint.y, edgeDraft.fromNodeId)
      const nextPoint =
        hit
          ? { x: hit.anchor.x, y: hit.anchor.y }
          : { x: worldPoint.x, y: worldPoint.y }
      setEdgeDraft(prev => (prev ? { ...prev, currentX: nextPoint.x, currentY: nextPoint.y } : prev))
    }
  }

  const onCanvasMouseUp = (e?: React.MouseEvent<HTMLDivElement>) => {
    isPanning.current = false
    setIsPanningActive(false)
    if (dragging.current) {
      const slug = dragging.current
      dragging.current = null
      setCardPositions(prev => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => persistLayout(prev), 800)
        return { ...prev }
      })
    }
    if (draggingFlowNode.current) {
      draggingFlowNode.current = null
      persistFlowchart(flowNodes, flowEdges)
    }
    if (edgeDraft) {
      const worldPoint = e ? getCanvasWorldPoint(e.clientX, e.clientY) : { x: edgeDraft.currentX, y: edgeDraft.currentY }
      const hit = getConnectorHitAtWorldPoint(worldPoint.x, worldPoint.y, edgeDraft.fromNodeId)
      if (hit) {
        const edge: FlowEdge = {
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: edgeDraft.fromNodeId,
          to: hit.node.id,
          fromSide: edgeDraft.fromSide,
          toSide: hit.side,
        }
        setFlowEdges(prev => {
          const exists = prev.some(item => item.from === edge.from && item.to === edge.to)
          const next = exists ? prev : [...prev, edge]
          persistFlowchart(flowNodes, next)
          return next
        })
      }
      setEdgeDraft(null)
    }
  }

  const zoomAtPoint = (clientX: number, clientY: number, factor: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const nextZoom = Math.min(2.5, Math.max(0.25, zoom * factor))
    if (nextZoom === zoom) return

    const worldX = (clientX - rect.left - pan.x) / zoom
    const worldY = (clientY - rect.top - pan.y) / zoom

    setZoom(nextZoom)
    setPan({
      x: clientX - rect.left - worldX * nextZoom,
      y: clientY - rect.top - worldY * nextZoom,
    })
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const shouldZoom = e.ctrlKey || e.metaKey
    if (shouldZoom) {
      zoomAtPoint(e.clientX, e.clientY, e.deltaY > 0 ? 0.95 : 1.05)
      return
    }
    setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
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

  const addFlowNode = (shape: FlowShape, at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const centerX = at ? at.x : rect ? (rect.width / 2 - pan.x) / zoom : 160
    const centerY = at ? at.y : rect ? (rect.height / 2 - pan.y) / zoom : 160
    const nodeStyle = getFlowNodeStyle(shape)
    const newNode: FlowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: centerX - nodeStyle.width / 2,
      y: centerY - nodeStyle.height / 2,
      label: FLOW_SHAPE_LIBRARY.find(s => s.shape === shape)?.label || 'Trin',
      shape,
    }
    setFlowNodes(prev => {
      const next = [...prev, newNode]
      persistFlowchart(next, flowEdges)
      return next
    })
  }

  const onFlowNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    setSelectedFlowNodeId(nodeId)
    const rect = canvasRef.current!.getBoundingClientRect()
    const node = flowNodes.find(n => n.id === nodeId)
    if (!node) return
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - node.x, y: my - node.y }
    draggingFlowNode.current = nodeId
    e.preventDefault()
  }

  const startEdgeDrag = (e: React.MouseEvent, nodeId: string, fromSide: FlowConnectorSide) => {
    if (!canEdit) return
    e.stopPropagation()
    const node = flowNodes.find(n => n.id === nodeId)
    if (!node) return
    const from = getFlowNodeAnchor(node, fromSide)
    setEdgeDraft({
      fromNodeId: nodeId,
      fromSide,
      startX: from.x,
      startY: from.y,
      currentX: from.x,
      currentY: from.y,
    })
  }

  const connectFlowNode = (nodeId: string) => {
    if (!canEdit) return
    if (!linkingFromNodeId) {
      setLinkingFromNodeId(nodeId)
      return
    }
    if (linkingFromNodeId === nodeId) {
      setLinkingFromNodeId(null)
      return
    }
    const edge: FlowEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: linkingFromNodeId,
      to: nodeId,
    }
    setFlowEdges(prev => {
      const exists = prev.some(e => e.from === edge.from && e.to === edge.to)
      const next = exists ? prev : [...prev, edge]
      persistFlowchart(flowNodes, next)
      return next
    })
    setLinkingFromNodeId(null)
  }

  const removeFlowNode = (nodeId: string) => {
    if (!canEdit) return
    setFlowNodes(prevNodes => {
      const nextNodes = prevNodes.filter(n => n.id !== nodeId)
      setFlowEdges(prevEdges => {
        const nextEdges = prevEdges.filter(e => e.from !== nodeId && e.to !== nodeId)
        persistFlowchart(nextNodes, nextEdges)
        return nextEdges
      })
      return nextNodes
    })
    if (linkingFromNodeId === nodeId) setLinkingFromNodeId(null)
    if (selectedFlowNodeId === nodeId) setSelectedFlowNodeId(null)
  }

  const getCanvasWorldPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    }
  }

  const getNodeAtWorldPoint = (x: number, y: number, excludeNodeId?: string) => {
    for (let i = flowNodes.length - 1; i >= 0; i--) {
      const node = flowNodes[i]
      if (excludeNodeId && node.id === excludeNodeId) continue
      const style = getFlowNodeStyle(node.shape)
      if (x >= node.x && x <= node.x + style.width && y >= node.y && y <= node.y + style.height) {
        return node
      }
    }
    return null
  }

  const getClosestConnectorAtWorldPoint = (
    x: number,
    y: number,
    excludeNodeId?: string
  ): { node: FlowNode; side: FlowConnectorSide; anchor: { x: number; y: number }; distance: number } | null => {
    let best: { node: FlowNode; side: FlowConnectorSide; anchor: { x: number; y: number }; distance: number } | null = null
    for (let i = flowNodes.length - 1; i >= 0; i--) {
      const node = flowNodes[i]
      if (excludeNodeId && node.id === excludeNodeId) continue
      const sides: FlowConnectorSide[] = ['left', 'top', 'bottom']
      for (const side of sides) {
        const anchor = getFlowNodeAnchor(node, side)
        const distance = Math.hypot(anchor.x - x, anchor.y - y)
        if (!best || distance < best.distance) {
          best = { node, side, anchor, distance }
        }
      }
    }
    return best
  }

  const getConnectorHitAtWorldPoint = (
    x: number,
    y: number,
    excludeNodeId?: string
  ): { node: FlowNode; side: FlowConnectorSide; anchor: { x: number; y: number }; distance: number } | null => {
    const hit = getClosestConnectorAtWorldPoint(x, y, excludeNodeId)
    const connectorHitRadius = 10
    if (!hit || hit.distance > connectorHitRadius) return null
    return hit
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
    if (!isOwner || !inviteEmail.trim()) return
    try {
      setModifying(true)
      await inviteProjectMember(projectId, inviteEmail.trim(), inviteRole)
      setInviteEmail('')
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
  const boardTools = projectTools.filter(({ slug }) => !BOARD_EXCLUDED_TOOL_SLUGS.has(slug))
  const planningTools = projectTools.filter(({ slug }) => BOARD_EXCLUDED_TOOL_SLUGS.has(slug))
  // In offline/demo mode allow all tools, not just allowed slugs
  const toAdd = VAERKTOEJER.filter(t =>
    (isOffline || allowed.has(t.slug)) && !project.toolIds.includes(t.slug)
  )
  const byKategori = getVaerktoejerGroupedByKategori(
    t => (isOffline || allowed.has(t.slug)) && !project.toolIds.includes(t.slug)
  )
  const categoryMetaBySlug = new Map<string, { id: string; label: string }>()
  byKategori.forEach(({ kategori, tools }) => {
    tools.forEach(tool => categoryMetaBySlug.set(tool.slug, { id: kategori.id, label: kategori.label }))
  })
  const phaseMetaBySlug = new Map<string, { id: string; label: string }>()
  const framework = project?.framework || 'none'
  const frameworkPhases = getFrameworkPhases(framework)
  const activeAddToolCategory =
    selectedAddToolCategory === 'all' || frameworkPhases.some(phase => phase.id === selectedAddToolCategory)
      ? selectedAddToolCategory
      : 'all'
  toAdd.forEach(tool => {
    const phaseId = getDefaultPhaseForTool(framework, tool.slug)
    const phase = frameworkPhases.find(p => p.id === phaseId)
    if (phase) phaseMetaBySlug.set(tool.slug, { id: phase.id, label: phase.label })
  })
  const searchQuery = addToolSearch.trim().toLowerCase()
  const filteredAddTools = toAdd
    .filter(tool => {
      const categoryMeta = categoryMetaBySlug.get(tool.slug)
      const phaseMeta = phaseMetaBySlug.get(tool.slug)
      const categoryMatch =
        activeAddToolCategory === 'all' ||
        categoryMeta?.id === activeAddToolCategory ||
        phaseMeta?.id === activeAddToolCategory

      if (!categoryMatch) return false
      if (!searchQuery) return true

      const searchable = `${tool.title} ${tool.slug} ${tool.shortDescription}`.toLowerCase()
      return searchable.includes(searchQuery)
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const aStarts = searchQuery ? (aTitle.startsWith(searchQuery) || a.slug.startsWith(searchQuery) ? 1 : 0) : 0
      const bStarts = searchQuery ? (bTitle.startsWith(searchQuery) || b.slug.startsWith(searchQuery) ? 1 : 0) : 0
      if (aStarts !== bStarts) return bStarts - aStarts
      return a.title.localeCompare(b.title, 'da')
    })
  const quickCategoryFilters = [
    { id: 'all', label: 'Alle', count: toAdd.length },
    ...frameworkPhases.map(phase => ({
      id: phase.id,
      label: phase.label,
      count: toAdd.filter(tool => getDefaultPhaseForTool(framework, tool.slug) === phase.id).length,
    })).filter(filter => filter.count > 0),
  ]
  const visibleAddTools = showAllAddToolResults ? filteredAddTools : filteredAddTools.slice(0, 9)
  const visibleToolsByPhase = frameworkPhases.map(phase => ({
    phase,
    tools: visibleAddTools.filter(
      tool => getDefaultPhaseForTool(framework, tool.slug) === phase.id
    ),
  })).filter(group => group.tools.length > 0)
  const selectedPhaseForDiagram =
    framework === 'google-design-sprint'
      ? (GOOGLE_DESIGN_SPRINT_PHASES.some(phase => phase.id === activeAddToolCategory)
          ? (activeAddToolCategory as GoogleDesignSprintPhase)
          : 'understand')
      : framework === 'design-thinking'
        ? (DESIGN_THINKING_PHASES.some(phase => phase.id === activeAddToolCategory)
            ? (activeAddToolCategory as DesignThinkingPhase)
            : 'empathize')
      : (DOUBLE_DIAMOND_PHASES.some(phase => phase.id === activeAddToolCategory)
          ? (activeAddToolCategory as DoubleDiamondPhase)
          : 'discover')

  const toolCount = projectTools.length
  const canEdit = project.role === 'owner' || project.role === 'editor'
  const isOwner = project.role === 'owner'
  const toolPhases = project.toolPhases || {}
  const lastUpdated = project.updatedAt ? new Date(project.updatedAt).toLocaleString('da-DK') : '–'
  const flowNodeMap = new Map(flowNodes.map(node => [node.id, node]))
  const visibleFlowEdges = flowEdges.filter(edge => flowNodeMap.has(edge.from) && flowNodeMap.has(edge.to))
  const hasKanbanTool = planningTools.some(tool => tool.slug === 'kanban')
  const hasGanttTool = planningTools.some(tool => tool.slug === 'gantt-chart')
  const KanbanComponent = getToolComponent('kanban')
  const GanttComponent = getToolComponent('gantt-chart')

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#ECEAE5', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

      {/* Offline / demo mode banner */}
      {isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 550,
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
        <div style={{ ...S.zoomBar, padding: '4px', gap: 4 }}>
          <button
            style={{
              ...S.zoomBtn,
              minWidth: 72,
              fontSize: 12,
              fontWeight: 700,
              background: activeWorkspaceTab === 'board' ? '#111827' : 'transparent',
              color: activeWorkspaceTab === 'board' ? '#fff' : '#6B7280',
            }}
            onClick={() => setActiveWorkspaceTab('board')}
          >
            Board
          </button>
          <button
            style={{
              ...S.zoomBtn,
              minWidth: 74,
              fontSize: 12,
              fontWeight: 700,
              background: activeWorkspaceTab === 'planning' ? '#111827' : 'transparent',
              color: activeWorkspaceTab === 'planning' ? '#fff' : '#6B7280',
            }}
            onClick={() => setActiveWorkspaceTab('planning')}
          >
            Plan
          </button>
          <button
            style={{
              ...S.zoomBtn,
              minWidth: 112,
              height: 30,
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              background: activeWorkspaceTab === 'docs' ? '#111827' : 'transparent',
              color: activeWorkspaceTab === 'docs' ? '#fff' : '#6B7280',
            }}
            onClick={() => setActiveWorkspaceTab('docs')}
          >
            Docs
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.02em',
                background: activeWorkspaceTab === 'docs' ? 'rgba(255,255,255,0.2)' : '#FEF3C7',
                color: activeWorkspaceTab === 'docs' ? '#FDE68A' : '#92400E',
                border: activeWorkspaceTab === 'docs' ? '1px solid rgba(255,255,255,0.28)' : '1px solid #FCD34D',
              }}
            >
              WIP
            </span>
          </button>
          <button
            style={{
              ...S.zoomBtn,
              minWidth: 116,
              height: 30,
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              background: activeWorkspaceTab === 'slides' ? '#111827' : 'transparent',
              color: activeWorkspaceTab === 'slides' ? '#fff' : '#6B7280',
            }}
            onClick={() => setActiveWorkspaceTab('slides')}
          >
            Slides
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.02em',
                background: activeWorkspaceTab === 'slides' ? 'rgba(255,255,255,0.2)' : '#FEF3C7',
                color: activeWorkspaceTab === 'slides' ? '#FDE68A' : '#92400E',
                border: activeWorkspaceTab === 'slides' ? '1px solid rgba(255,255,255,0.28)' : '1px solid #FCD34D',
              }}
            >
              WIP
            </span>
          </button>
          {activeWorkspaceTab === 'board' && (
            <>
              <button
                style={S.zoomBtn}
                onClick={() => {
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (!rect) return
                  zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.9)
                }}
              >
                −
              </button>
              <button style={{ ...S.zoomBtn, minWidth: 52, fontSize: 12, fontWeight: 700 }} onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }) }}>
                {Math.round(zoom * 100)}%
              </button>
              <button
                style={S.zoomBtn}
                onClick={() => {
                  const rect = canvasRef.current?.getBoundingClientRect()
                  if (!rect) return
                  zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.1)
                }}
              >
                +
              </button>
            </>
          )}
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
      {activeWorkspaceTab === 'board' && (
        <>
          <button
            type="button"
            onClick={() => setShowFlowPanel(v => !v)}
            style={{
              position: 'fixed',
              top: isOffline ? 104 : 70,
              left: 14,
              zIndex: 140,
              border: '1.5px solid #D1D5DB',
              background: showFlowPanel ? '#111827' : '#fff',
              color: showFlowPanel ? '#fff' : '#374151',
              borderRadius: 10,
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 10px 24px rgba(15,23,42,0.10)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14 }}>🧩</span>
            Flowchart
          </button>

          {showFlowPanel && (
            <div
              style={{
                position: 'fixed',
                top: isOffline ? 142 : 108,
                left: 14,
                width: 248,
                maxHeight: 'calc(100vh - 170px)',
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                padding: 10,
                zIndex: 130,
                boxShadow: '0 14px 36px rgba(0,0,0,0.12)',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Standard former
              </p>
              <div style={{ display: 'grid', gap: 7 }}>
                {FLOW_SHAPE_LIBRARY.map(item => (
                  <div
                    key={item.shape}
                    draggable={canEdit}
                    onDragStart={e => {
                      if (!canEdit) return
                      e.dataTransfer.setData('text/forgelab-flow-shape', item.shape)
                      e.dataTransfer.effectAllowed = 'copy'
                      setDraggingPaletteShape(item.shape)
                    }}
                    onDragEnd={() => setDraggingPaletteShape(null)}
                    style={{
                      border: '1.5px solid #E5E7EB',
                      borderRadius: 10,
                      padding: '8px 10px',
                      color: '#374151',
                      background: '#fff',
                      cursor: canEdit ? 'grab' : 'not-allowed',
                      opacity: canEdit ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 20,
                        border: '2px solid #9CA3AF',
                        borderRadius: getFlowNodeStyle(item.shape).borderRadius > 20 ? 999 : 6,
                        clipPath: getFlowNodeStyle(item.shape).clipPath,
                        background: draggingPaletteShape === item.shape ? '#FEF3C7' : '#F9FAFB',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>Træk ud på boardet</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9CA3AF', lineHeight: 1.45 }}>
                Træk fra den lille cirkel på højre side af en form for at lave en pil direkte til en anden form.
              </p>
            </div>
          )}
        </>
      )}
      {activeWorkspaceTab === 'docs' ? (
        <ProjectDocsTab projectId={projectId} canEdit={canEdit} />
      ) : activeWorkspaceTab === 'slides' ? (
        <ProjectSlidesTab projectId={projectId} canEdit={canEdit} />
      ) : activeWorkspaceTab === 'planning' ? (
      <ToolEmbedProvider projectId={projectId}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: isOffline ? 89 : 56,
            background: '#EEF2F7',
            padding: 14,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 1680,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              minHeight: 'calc(100vh - 110px)',
            }}
          >
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Kanban
              </div>
              <div style={{ flex: 1, minHeight: 520, overflow: 'auto' }}>
                {hasKanbanTool && KanbanComponent ? (
                  <KanbanComponent />
                ) : (
                  <p style={{ margin: 12, fontSize: 13, color: '#6B7280' }}>
                    Tilføj værktøjet <strong>Kanban</strong> for at arbejde her.
                  </p>
                )}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Gantt
              </div>
              <div style={{ flex: 1, minHeight: 520, overflow: 'auto' }}>
                {hasGanttTool && GanttComponent ? (
                  <GanttComponent />
                ) : (
                  <p style={{ margin: 12, fontSize: 13, color: '#6B7280' }}>
                    Tilføj værktøjet <strong>Gantt</strong> for at arbejde her.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolEmbedProvider>
      ) : (
      <ToolEmbedProvider projectId={projectId}>
        <div
        ref={canvasRef}
        className="canvas-bg"
        style={{
          position: 'fixed',
          inset: 0,
          top: isOffline ? 89 : 56,
          cursor: isPanningActive ? 'grabbing' : (isSpacePressed ? 'grab' : 'default'),
          backgroundImage: 'radial-gradient(circle, #C5C1BB 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x % (24 * zoom)}px ${pan.y % (24 * zoom)}px`,
          touchAction: 'none',
        }}
        onMouseEnter={() => {
          isPointerOverCanvasRef.current = true
        }}
        onMouseLeave={() => {
          isPointerOverCanvasRef.current = false
          void broadcastCursor(0, 0, false)
          onCanvasMouseUp()
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onDragOver={e => {
          if (!canEdit) return
          const shape = e.dataTransfer.getData('text/forgelab-flow-shape')
          if (shape) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
        onDrop={e => {
          if (!canEdit) return
          const shape = e.dataTransfer.getData('text/forgelab-flow-shape') as FlowShape
          if (!shape) return
          e.preventDefault()
          const point = getCanvasWorldPoint(e.clientX, e.clientY)
          addFlowNode(shape, point)
          setDraggingPaletteShape(null)
        }}
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
          {boardTools.length === 0 && (
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

          {/* ── Flowchart edges + noder ─────────────────── */}
          {flowNodes.length > 0 && (
            <>
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <defs>
                  <marker id="flow-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L10,4 L0,8 z" fill="#4B5563" />
                  </marker>
                </defs>
                {visibleFlowEdges.map(edge => {
                  const fromNode = flowNodeMap.get(edge.from)!
                  const toNode = flowNodeMap.get(edge.to)!
                  const from = getFlowNodeAnchor(fromNode, edge.fromSide || 'left')
                  const to = getFlowNodeAnchor(toNode, edge.toSide || 'left')
                  return (
                    <path
                      key={edge.id}
                      d={buildOrthogonalPath(from, to)}
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth="2.2"
                      markerEnd="url(#flow-arrow)"
                    />
                  )
                })}
                {edgeDraft && (
                  <path
                    d={buildOrthogonalPath(
                      { x: edgeDraft.startX, y: edgeDraft.startY },
                      { x: edgeDraft.currentX, y: edgeDraft.currentY }
                    )}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                    markerEnd="url(#flow-arrow)"
                  />
                )}
              </svg>

              {flowNodes.map(node => {
                const isLinkSource = linkingFromNodeId === node.id
                const isSelected = selectedFlowNodeId === node.id
                const style = getFlowNodeStyle(node.shape)
                return (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: style.width,
                      height: style.height,
                      background: '#fff',
                      border: isLinkSource ? '2px solid #F59E0B' : isSelected ? '2px solid #2563EB' : '2px solid #9CA3AF',
                      borderRadius: style.borderRadius,
                      clipPath: style.clipPath,
                      transform: 'translateZ(0)',
                      boxShadow: isLinkSource
                        ? '0 0 0 3px rgba(245,158,11,0.22), 0 8px 20px rgba(0,0,0,0.12)'
                        : isSelected
                          ? '0 0 0 3px rgba(37,99,235,0.2), 0 8px 20px rgba(0,0,0,0.12)'
                          : '0 8px 20px rgba(0,0,0,0.09)',
                      padding: 10,
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      userSelect: 'none',
                    }}
                    onMouseDown={e => onFlowNodeMouseDown(e, node.id)}
                  >
                    <input
                      value={node.label}
                      onMouseDown={e => e.stopPropagation()}
                      onChange={e => {
                        const nextLabel = e.target.value
                        setFlowNodes(prev => {
                          const next = prev.map(n => (n.id === node.id ? { ...n, label: nextLabel } : n))
                          persistFlowchart(next, flowEdges)
                          return next
                        })
                      }}
                      disabled={!canEdit}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        width: '100%',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1F2937',
                        outline: 'none',
                        marginTop: 'auto',
                        marginBottom: 'auto',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      {canEdit && (
                        <button
                          type="button"
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation()
                            removeFlowNode(node.id)
                          }}
                          title="Slet"
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#B91C1C',
                            fontSize: 12,
                            fontWeight: 800,
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          ×
                        </button>
                      )}
                      <button
                        type="button"
                        onMouseDown={e => startEdgeDrag(e, node.id, 'left')}
                        title="Træk pil fra venstre"
                        style={{
                          position: 'absolute',
                          left: -7,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          background: '#F59E0B',
                          cursor: 'crosshair',
                          boxShadow: '0 2px 7px rgba(0,0,0,0.22)',
                        }}
                      />
                      <button
                        type="button"
                        onMouseDown={e => startEdgeDrag(e, node.id, 'top')}
                        title="Træk pil fra top"
                        style={{
                          position: 'absolute',
                          top: -7,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          background: '#F59E0B',
                          cursor: 'crosshair',
                          boxShadow: '0 2px 7px rgba(0,0,0,0.22)',
                        }}
                      />
                      <button
                        type="button"
                        onMouseDown={e => startEdgeDrag(e, node.id, 'bottom')}
                        title="Træk pil fra bund"
                        style={{
                          position: 'absolute',
                          bottom: -7,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          background: '#F59E0B',
                          cursor: 'crosshair',
                          boxShadow: '0 2px 7px rgba(0,0,0,0.22)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {Object.values(liveCursors)
            .filter(cursor => cursor.visible)
            .map(cursor => {
              const initial = (cursor.username || 'U').trim().charAt(0).toUpperCase()
              return (
                <div
                  key={cursor.userId}
                  style={{
                    position: 'absolute',
                    left: cursor.x,
                    top: cursor.y,
                    transform: 'translate(-1px, -1px)',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: `14px solid ${cursor.color}`,
                      transform: 'rotate(-35deg)',
                      transformOrigin: '50% 80%',
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.22))',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 2,
                      marginLeft: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: cursor.color,
                      color: 'white',
                      borderRadius: 999,
                      padding: '2px 8px 2px 6px',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.22)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                      }}
                    >
                      {initial}
                    </span>
                    {cursor.username || 'Bruger'}
                  </div>
                </div>
              )
            })}

          {/* ── Tool cards ─────────────────────────────── */}
          {boardTools.map(({ slug, tool }, idx) => {
            if (!tool) return null
            const { Icon } = getToolIcon(slug)
            const c = getCardColor(slug)
            const pos = cardPositions[slug] || defaultPos(slug, idx)
            const isDragging = dragging.current === slug
            const phase = toolPhases[slug] || null
            const phaseLabel = phase ? frameworkPhases.find(p => p.id === phase)?.label : null

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
                  width: 'calc(100vw - 180px)',
                  maxWidth: 'calc(100vw - 180px)',
                  minWidth: 680,
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
                  style={{
                    flex: 1,
                    padding: '0 0 12px 0',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    pointerEvents: isDragging ? 'none' : 'auto',
                    userSelect: 'auto',
                    position: 'relative',
                  }}
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
          background: 'white', borderLeft: '1px solid #E5E7EB', zIndex: 560,
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
                    <option value="google-design-sprint">Google Design Sprint</option>
                    <option value="design-thinking">Design Thinking</option>
                  </select>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                    Vælg framework for automatisk faseinddeling af værktøjer.
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
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Email (fx navn@firma.dk)"
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
                        disabled={modifying || !inviteEmail.trim()}
                        style={{
                          padding: '0 16px', borderRadius: 10, border: 'none',
                          background: '#111827', color: 'white',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          opacity: inviteEmail.trim() ? 1 : 0.4,
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
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.email || m.username || m.user_id}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                          {m.role}{m.username ? ` · ${m.username}` : ''}
                        </p>
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
          onClick={() => {
            setShowAddTool(false)
            setAddToolSearch('')
            setSelectedAddToolCategory('all')
            setShowAllAddToolResults(false)
          }}
        >
          <div
            style={{ width: '100%', maxWidth: 500, maxHeight: '82vh', background: 'white', borderRadius: 22, boxShadow: '0 32px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>+ Tilføj værktøj</h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9CA3AF' }}>
                Find hurtigt det rigtige værktøj med søgning og faser fra valgt framework.
              </p>
            </div>

            <div style={{ padding: '12px 16px 0', borderBottom: '1px solid #F9FAFB' }}>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', padding: 8, overflow: 'hidden', marginBottom: 10 }}>
                {framework === 'google-design-sprint' ? (
                  <GoogleDesignSprintDiagram
                    activeSelection={selectedPhaseForDiagram as GoogleDesignSprintPhase}
                    onSelect={selection => {
                      setSelectedAddToolCategory(selection)
                      setShowAllAddToolResults(false)
                    }}
                  />
                ) : framework === 'design-thinking' ? (
                  <DesignThinkingDiagram
                    activeSelection={selectedPhaseForDiagram as DesignThinkingPhase}
                    onSelect={selection => {
                      setSelectedAddToolCategory(selection)
                      setShowAllAddToolResults(false)
                    }}
                  />
                ) : (
                  <div style={{ width: 504, height: 292, overflow: 'hidden' }}>
                    <div style={{ transform: 'scale(0.39)', transformOrigin: 'top left', width: 1200, height: 650 }}>
                      <DoubleDiamondDiagram
                        activeSelection={selectedPhaseForDiagram as DoubleDiamondPhase}
                        onSelect={selection => {
                          if (selection === 'hmw') return
                          setSelectedAddToolCategory(selection)
                          setShowAllAddToolResults(false)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  value={addToolSearch}
                  onChange={e => {
                    setAddToolSearch(e.target.value)
                    setShowAllAddToolResults(false)
                  }}
                  placeholder="Søg på navn, kategori eller slug..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #E5E7EB',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 0 12px' }}>
                {quickCategoryFilters.map(filter => {
                  const isActive = activeAddToolCategory === filter.id
                  return (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setSelectedAddToolCategory(filter.id)
                        setShowAllAddToolResults(false)
                      }}
                      style={{
                        border: isActive ? '1.5px solid #F59E0B' : '1.5px solid #E5E7EB',
                        background: isActive ? '#FFFBEB' : 'white',
                        color: isActive ? '#92400E' : '#4B5563',
                        borderRadius: 999,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {toAdd.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>🎉 Alle værktøjer er tilføjet!</p>
              ) : filteredAddTools.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>Ingen værktøjer matcher din søgning.</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>Prøv et andet søgeord eller vælg filteret "Alle".</p>
                </div>
              ) : (
                <>
                  {visibleToolsByPhase.map(({ phase, tools }) => (
                    <div key={phase.id} style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                        {phase.label}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 10,
                        }}
                      >
                        {tools.map(tool => (
                          <ToolPickerCard key={tool.slug} tool={tool} onAdd={() => handleAddTool(tool.slug)} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {!showAllAddToolResults && filteredAddTools.length > visibleAddTools.length && (
                    <button
                      onClick={() => setShowAllAddToolResults(true)}
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '10px',
                        borderRadius: 12,
                        border: '1.5px dashed #FCD34D',
                        background: '#FFFBEB',
                        color: '#92400E',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Vis flere ({filteredAddTools.length - visibleAddTools.length} flere)
                    </button>
                  )}
                </>
              )}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => {
                  setShowAddTool(false)
                  setAddToolSearch('')
                  setSelectedAddToolCategory('all')
                  setShowAllAddToolResults(false)
                }}
                style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 14, color: '#374151', cursor: 'pointer', fontWeight: 500 }}
              >
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
      )}

      {/* ── AI Chat Assistant (Board / Docs / Slides — separat samtale pr. fane) ── */}
      {canEdit && (
        <AiChatCompanion
          projectId={projectId}
          projectTools={projectTools}
          availableToolSlugs={toAdd.map(tool => tool.slug)}
          projectName={project.name}
          workspaceTab={activeWorkspaceTab}
          framework={framework}
          role={project.role || ''}
          onAddTool={handleAddTool}
        />
      )}
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────
function getFlowNodeStyle(shape: FlowShape): { width: number; height: number; borderRadius: number; clipPath?: string } {
  switch (shape) {
    case 'terminator':
      return { width: 176, height: 76, borderRadius: 999 }
    case 'decision':
      return { width: 170, height: 90, borderRadius: 10, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }
    case 'data':
      return { width: 180, height: 78, borderRadius: 10, clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }
    case 'document':
      return { width: 176, height: 82, borderRadius: 10, clipPath: 'polygon(0% 0%, 100% 0%, 100% 82%, 84% 100%, 0% 86%)' }
    case 'database':
      return { width: 170, height: 94, borderRadius: 34 }
    default:
      return { width: 176, height: 78, borderRadius: 10 }
  }
}

function getFlowNodeAnchor(node: FlowNode, side: 'left' | 'top' | 'bottom' | 'right') {
  const style = getFlowNodeStyle(node.shape)
  if (side === 'top') {
    return { x: node.x + style.width / 2, y: node.y }
  }
  if (side === 'bottom') {
    return { x: node.x + style.width / 2, y: node.y + style.height }
  }
  return {
    x: side === 'left' ? node.x : node.x + style.width,
    y: node.y + style.height / 2,
  }
}

function getClosestTargetSide(node: FlowNode, point: { x: number; y: number }): FlowConnectorSide {
  const left = getFlowNodeAnchor(node, 'left')
  const top = getFlowNodeAnchor(node, 'top')
  const bottom = getFlowNodeAnchor(node, 'bottom')

  const distances = [
    { side: 'left' as FlowConnectorSide, d: Math.hypot(point.x - left.x, point.y - left.y) },
    { side: 'top' as FlowConnectorSide, d: Math.hypot(point.x - top.x, point.y - top.y) },
    { side: 'bottom' as FlowConnectorSide, d: Math.hypot(point.x - bottom.x, point.y - bottom.y) },
  ]
  distances.sort((a, b) => a.d - b.d)
  return distances[0].side
}

function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const sameX = Math.abs(from.x - to.x) < 0.5
  const sameY = Math.abs(from.y - to.y) < 0.5
  if (sameX || sameY) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }

  // One clean 90-degree turn (horizontal first).
  return `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`
}

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

function ToolPickerCard({ tool, onAdd }: { tool: { slug: string; title: string; shortDescription: string }; onAdd: () => void }) {
  const { Icon, bg, text } = getToolIcon(tool.slug)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        minHeight: 132,
        borderRadius: 14,
        border: hovered ? '1.5px solid #FCD34D' : '1.5px solid #F3F4F6',
        background: hovered ? '#FFFBF0' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        padding: '12px 12px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          className={`${bg} ${text}`}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 17, height: 17 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.25 }}>
            {tool.title}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#9CA3AF',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {tool.shortDescription}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>
        + Tilføj
      </div>
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
    position: 'fixed', left: 0, right: 0, height: 56, zIndex: 540,
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
