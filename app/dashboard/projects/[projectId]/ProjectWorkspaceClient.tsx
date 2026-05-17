'use client'

import { useState, useEffect, useCallback, useRef, memo, type ReactNode, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'

import Link from 'next/link'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
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
import BrugerrejsePreviewCard from '@/components/BrugerrejsePreviewCard'
import ServiceBlueprintPreviewCard from '@/components/ServiceBlueprintPreviewCard'
import SurveyPreviewCard from '@/components/SurveyPreviewCard'
import CardSortingPreviewCard from '@/components/CardSortingPreviewCard'
import QrGeneratorPreviewCard from '@/components/QrGeneratorPreviewCard'
import ProjectBoardSidebar from '@/components/ProjectBoardSidebar'
// (hasDedicatedPageTools-helperen er ikke længere nødvendig — sidebaren er nu permanent.)
import AiChatCompanion from '@/components/AiChatCompanion'
import DoubleDiamondDiagram from '@/components/dashboard/DoubleDiamondDiagram'
import DesignThinkingDiagram from '@/components/dashboard/DesignThinkingDiagram'
import GoogleDesignSprintDiagram from '@/components/dashboard/GoogleDesignSprintDiagram'
import ProjectSlidesTab from '@/components/ProjectSlidesTab'
import ProjectFilesTab from '@/components/ProjectFilesTab'
import ProjectComments from '@/components/ProjectComments'
import type { ProjectComment } from '@/lib/comments'
import { fetchProjectCommentsApi } from '@/lib/comments-api'
import type { ProjectToolEntry } from '@/components/ProjectBoardSidebar'
import StickyNoteBodyEditor from '@/components/StickyNoteBodyEditor'
import StickyRichToolbar from '@/components/StickyRichToolbar'
import type { StickyNoteFormat } from '@/lib/stickyNoteRichText'
import {
  DEFAULT_STICKY_NOTE_FORMAT,
  mergeStickyFormat,
  parseStickyFormat,
  migratePlainStickyTextToHtml,
  sanitizeStickyHtml,
  applyInlineStyleToSelection,
  stickyFontStack,
} from '@/lib/stickyNoteRichText'
import { extractMentionUserIdsFromText, htmlToPlainText } from '@/lib/mentions'
import {
  BOARD_ALIGN_THRESHOLD,
  computeAlignmentSnap,
  type AlignmentGuide,
  type BoardSnapExclude,
  type SnapRect,
} from '@/lib/board-alignment-guides'
import {
  AlertTriangle,
  FlaskConical,
  LayoutTemplate,
  MessageCircle,
  MessageSquare,
  PartyPopper,
  SearchX,
  Settings,
  Toolbox,
} from 'lucide-react'

interface ProjectWorkspaceClientProps {
  projectId: string
}

type CardPosition = { x: number; y: number }
type FlowShape = 'terminator' | 'process' | 'decision' | 'data' | 'document' | 'database'
type FlowNode = {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** HTML som sticky notes; ren tekst migreres ved visning */
  label: string
  shape: FlowShape
  /** Fill inde i figuren — typiske flowchart-pasteller */
  fillColor?: string
  format?: StickyNoteFormat
}

/** ISO/visio-lignende lyse diagramfarver til flow-former */
const FLOWCHART_SHAPE_COLORS = [
  '#FFFFFF',
  '#E3F2FD',
  '#FFF9C4',
  '#E8F5E9',
  '#FFEBEE',
  '#F3E5F5',
  '#E0F7FA',
  '#FFF3E0',
  '#ECEFF1',
  '#FCE4EC',
] as const

type RichToolbarUiState =
  | {
      kind: 'sticky'
      noteId: string
      rect: { left: number; top: number; width: number; height: number }
      bold: boolean
      italic: boolean
      strike: boolean
    }
  | {
      kind: 'flow'
      nodeId: string
      rect: { left: number; top: number; width: number; height: number }
      bold: boolean
      italic: boolean
      strike: boolean
    }
type StickyNote = {
  id: string
  x: number
  y: number
  title: string
  text: string
  color: string
  createdBy?: string
  width?: number
  height?: number
  /** Seneste typografi til plus-kopiering og toolbar (rig tekst gemmes i `text` som HTML) */
  format?: StickyNoteFormat
}
type BoardSection = { id: string; x: number; y: number; width: number; height: number; title: string; color: string }
type BoardImage = { id: string; x: number; y: number; width: number; height: number; src: string }

type SectionResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const BOARD_IMAGE_DEFAULT_W = 380
const BOARD_IMAGE_DEFAULT_H = 240

const SECTION_MIN_W = 160
const SECTION_MIN_H = 100
const SECTION_FRAME_PADDING = 24
const BOARD_COMMENT_PIN_SIZE = 42
/** Ved zoom ≥ denne vises titel + ikon over sektionen (som FigJam); ellers inde i venstre top. */
const SECTION_TITLE_EXTERNAL_ZOOM = 1.16

function applyRectResize(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  minW: number,
  minH: number
) {
  let { x, y, w, h } = start
  switch (edge) {
    case 'e':
      w = Math.max(minW, start.w + dx)
      break
    case 's':
      h = Math.max(minH, start.h + dy)
      break
    case 'se':
      w = Math.max(minW, start.w + dx)
      h = Math.max(minH, start.h + dy)
      break
    case 'w':
      w = Math.max(minW, start.w - dx)
      x = start.x + start.w - w
      break
    case 'n':
      h = Math.max(minH, start.h - dy)
      y = start.y + start.h - h
      break
    case 'nw':
      w = Math.max(minW, start.w - dx)
      h = Math.max(minH, start.h - dy)
      x = start.x + start.w - w
      y = start.y + start.h - h
      break
    case 'ne':
      w = Math.max(minW, start.w + dx)
      h = Math.max(minH, start.h - dy)
      y = start.y + start.h - h
      break
    case 'sw':
      w = Math.max(minW, start.w - dx)
      h = Math.max(minH, start.h + dy)
      x = start.x + start.w - w
      break
    default:
      break
  }
  return { x, y, w, h }
}

/** Shift-resize: bevar start.w / start.h (lige aspect). */
function applyAspectLockedRectResize(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  minW: number,
  minH: number
): { x: number; y: number; w: number; h: number } {
  const sx = start.x
  const sy = start.y
  const sw = start.w
  const sh = start.h
  if (sw <= 0 || sh <= 0) return applyRectResize(edge, start, dx, dy, minW, minH)
  const r = sw / sh

  const clampAspect = (w: number, h: number) => {
    let nw = Math.max(minW, w)
    let nh = Math.max(minH, h)
    nh = nw / r
    if (nh < minH) {
      nh = minH
      nw = nh * r
    }
    nw = Math.max(minW, nw)
    nh = Math.max(minH, nw / r)
    return { x: sx, y: sy, w: nw, h: nh }
  }

  const cornerScale = (tw: number, th: number) => {
    const s1 = tw / sw
    const s2 = th / sh
    const growing = tw >= sw && th >= sh
    let s = growing ? Math.max(s1, s2) : Math.min(s1, s2)
    if (!Number.isFinite(s) || s <= 0) s = 1
    return clampAspect(sw * s, sh * s)
  }

  switch (edge) {
    case 'e': {
      const tw = sw + dx
      const w = Math.max(minW, tw)
      const h = Math.max(minH, w / r)
      return clampAspect(w, h)
    }
    case 'w': {
      const tw = sw - dx
      const w = Math.max(minW, tw)
      const h = Math.max(minH, w / r)
      const out = clampAspect(w, h)
      return { ...out, x: sx + sw - out.w }
    }
    case 's': {
      const th = sh + dy
      const h = Math.max(minH, th)
      const w = Math.max(minW, h * r)
      return clampAspect(w, h)
    }
    case 'n': {
      const th = sh - dy
      const h = Math.max(minH, th)
      const w = Math.max(minW, h * r)
      const out = clampAspect(w, h)
      return { ...out, y: sy + sh - out.h }
    }
    case 'se':
      return cornerScale(sw + dx, sh + dy)
    case 'nw': {
      const out = cornerScale(sw - dx, sh - dy)
      return { ...out, x: sx + sw - out.w, y: sy + sh - out.h }
    }
    case 'ne': {
      const out = cornerScale(sw + dx, sh - dy)
      return { ...out, y: sy + sh - out.h }
    }
    case 'sw': {
      const out = cornerScale(sw - dx, sh + dy)
      return { ...out, x: sx + sw - out.w }
    }
    default:
      return applyRectResize(edge, start, dx, dy, minW, minH)
  }
}

function applySectionResize(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number
) {
  return applyRectResize(edge, start, dx, dy, SECTION_MIN_W, SECTION_MIN_H)
}
type BoardComment = {
  id: string
  x: number
  y: number
  text: string
  createdAt: number
  createdBy: string
  resolved?: boolean
  resolvedAt?: number
  replies?: BoardComment[]
  parentId?: string
  images?: string[]
  mentions?: string[]
}
/** Frit placerbart tekstfelt på boardet (lige som sticky, men uden sticky-styling) */
type BoardFreeText = {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  /** Skriftstørrelse i px (8–128) */
  fontSizePx?: number
}
type FlowConnectorSide = 'left' | 'top' | 'right' | 'bottom'
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

type LiveCardSelectionPayload = {
  userId: string
  username: string
  color: string
  selectedCardSlugs: string[]
  visible: boolean
  ts: number
}

type LiveCardSelection = LiveCardSelectionPayload & {
  updatedAt: number
}

type ChatReaction = {
  emoji: string
  userId: string
  username: string
  createdAt: number
}

type ChatAttachment = {
  url: string
  name: string
  size: number
  mime: string
  isImage: boolean
}

type LiveChatMessagePayload = {
  id: string
  userId: string
  username: string
  avatarUrl?: string | null
  color?: string
  text: string
  createdAt: number
  reactions?: ChatReaction[]
  attachments?: ChatAttachment[]
}

type LiveChatMessage = LiveChatMessagePayload & {
  isMine: boolean
}

type BoardContextMenu =
  | { type: 'canvas'; x: number; y: number; worldX: number; worldY: number }
  | { type: 'card'; x: number; y: number; slug: string }
  | {
      type: 'boardShape'
      x: number
      y: number
      shapeKind: 'flow' | 'sticky' | 'section' | 'comment' | 'image' | 'freeText'
      id: string
    }

type MarqueeSelection = {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

type BoardClipboardPayload = {
  copiedAt: number
  flowNodes: FlowNode[]
  flowEdges: FlowEdge[]
  stickyNotes: StickyNote[]
  sections: BoardSection[]
  comments: BoardComment[]
  images: BoardImage[]
  freeTexts: BoardFreeText[]
}

type BoardUndoSnapshot = {
  toolIds: string[]
  toolPhases: NonNullable<Project['toolPhases']>
  cardPositions: Record<string, CardPosition>
  cardZOrder: Record<string, number>
  lockedCardSlugs: string[]
  flowNodes: FlowNode[]
  flowEdges: FlowEdge[]
  stickyNotes: StickyNote[]
  sections: BoardSection[]
  comments: BoardComment[]
  images: BoardImage[]
  freeTexts: BoardFreeText[]
}

const FLOWCHART_TOOL_SLUG = 'project-board-flowchart'
const BOARD_CLIPBOARD_MIME = 'application/x-forgelab-board-items'
/** Standard sticky-størrelse når width/height ikke er sat */
const STICKY_NOTE_SIZE = 200
const STICKY_NOTE_MIN_W = 100
const STICKY_NOTE_MIN_H = 100
const STICKY_CLONE_GAP = 16
/** Alt/Option + træk: samme offset som kontekstmenu-duplikering */
const BOARD_ALT_DUPLICATE_OFFSET = 28
/** Når sticky er valgt: træk fra tekstområdet først efter så mange px bevægelse (så klik stadig sætter markør). */
const STICKY_EDITOR_DRAG_THRESHOLD_PX = 6
const FLOW_NODE_MIN_W = 72
const FLOW_NODE_MIN_H = 36
const FREE_TEXT_DEFAULT_W = 192
const FREE_TEXT_DEFAULT_H = 72
const FREE_TEXT_MIN_W = 96
const FREE_TEXT_MIN_H = 48
const FREE_TEXT_FONT_SIZE_MIN = 8
const FREE_TEXT_FONT_SIZE_MAX = 128
const FREE_TEXT_FONT_SIZE_DEFAULT = 14

function snapStickyDimensionToGrid(px: number, grid: number, min: number): number {
  return Math.max(min, Math.round(px / grid) * grid)
}

/** Resize med løbende snap til board-gitter (fast hjørne/kant bevares) */
function applyStickyResizeWithGrid(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  grid: number,
  lockAspect: boolean
): { x: number; y: number; w: number; h: number } {
  const raw = lockAspect
    ? applyAspectLockedRectResize(edge, start, dx, dy, STICKY_NOTE_MIN_W, STICKY_NOTE_MIN_H)
    : applyStickyNoteResize(edge, start, dx, dy)
  const snapW = (px: number) => snapStickyDimensionToGrid(px, grid, STICKY_NOTE_MIN_W)
  const snapH = (px: number) => snapStickyDimensionToGrid(px, grid, STICKY_NOTE_MIN_H)

  const sx = start.x
  const sy = start.y
  const right = sx + start.w
  const bottom = sy + start.h

  let gw = raw.w
  let gh = raw.h
  if (edge === 'e' || edge === 'w' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gw = snapW(raw.w)
  }
  if (edge === 's' || edge === 'n' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gh = snapH(raw.h)
  }

  switch (edge) {
    case 'e':
      return { x: sx, y: sy, w: gw, h: gh }
    case 's':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'w':
      return { x: right - gw, y: sy, w: gw, h: gh }
    case 'n':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'se':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'nw':
      return { x: right - gw, y: bottom - gh, w: gw, h: gh }
    case 'ne':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'sw':
      return { x: right - gw, y: sy, w: gw, h: gh }
    default:
      return { x: raw.x, y: raw.y, w: gw, h: gh }
  }
}

/** Flowchart-form: resize med snap til board-gitter (samme logik som sticky notes). */
function applyFlowNodeResizeWithGrid(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  grid: number,
  lockAspect: boolean
): { x: number; y: number; w: number; h: number } {
  const raw = lockAspect
    ? applyAspectLockedRectResize(edge, start, dx, dy, FLOW_NODE_MIN_W, FLOW_NODE_MIN_H)
    : applyRectResize(edge, start, dx, dy, FLOW_NODE_MIN_W, FLOW_NODE_MIN_H)
  const snapW = (px: number) => snapStickyDimensionToGrid(px, grid, FLOW_NODE_MIN_W)
  const snapH = (px: number) => snapStickyDimensionToGrid(px, grid, FLOW_NODE_MIN_H)

  const sx = start.x
  const sy = start.y
  const right = sx + start.w
  const bottom = sy + start.h

  let gw = raw.w
  let gh = raw.h
  if (edge === 'e' || edge === 'w' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gw = snapW(raw.w)
  }
  if (edge === 's' || edge === 'n' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gh = snapH(raw.h)
  }

  switch (edge) {
    case 'e':
      return { x: sx, y: sy, w: gw, h: gh }
    case 's':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'w':
      return { x: right - gw, y: sy, w: gw, h: gh }
    case 'n':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'se':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'nw':
      return { x: right - gw, y: bottom - gh, w: gw, h: gh }
    case 'ne':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'sw':
      return { x: right - gw, y: sy, w: gw, h: gh }
    default:
      return { x: raw.x, y: raw.y, w: gw, h: gh }
  }
}

/** Fritekst-felter: resize med gitter-snap */
function applyFreeTextResizeWithGrid(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  grid: number,
  lockAspect: boolean
): { x: number; y: number; w: number; h: number } {
  const raw = lockAspect
    ? applyAspectLockedRectResize(edge, start, dx, dy, FREE_TEXT_MIN_W, FREE_TEXT_MIN_H)
    : applyRectResize(edge, start, dx, dy, FREE_TEXT_MIN_W, FREE_TEXT_MIN_H)
  const snapW = (px: number) => snapStickyDimensionToGrid(px, grid, FREE_TEXT_MIN_W)
  const snapH = (px: number) => snapStickyDimensionToGrid(px, grid, FREE_TEXT_MIN_H)

  const sx = start.x
  const sy = start.y
  const right = sx + start.w
  const bottom = sy + start.h

  let gw = raw.w
  let gh = raw.h
  if (edge === 'e' || edge === 'w' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gw = snapW(raw.w)
  }
  if (edge === 's' || edge === 'n' || edge === 'nw' || edge === 'ne' || edge === 'sw' || edge === 'se') {
    gh = snapH(raw.h)
  }

  switch (edge) {
    case 'e':
      return { x: sx, y: sy, w: gw, h: gh }
    case 's':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'w':
      return { x: right - gw, y: sy, w: gw, h: gh }
    case 'n':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'se':
      return { x: sx, y: sy, w: gw, h: gh }
    case 'nw':
      return { x: right - gw, y: bottom - gh, w: gw, h: gh }
    case 'ne':
      return { x: sx, y: bottom - gh, w: gw, h: gh }
    case 'sw':
      return { x: right - gw, y: sy, w: gw, h: gh }
    default:
      return { x: raw.x, y: raw.y, w: gw, h: gh }
  }
}

function getStickyNoteSize(note: Pick<StickyNote, 'width' | 'height'>) {
  const w =
    typeof note.width === 'number' && note.width >= STICKY_NOTE_MIN_W ? note.width : STICKY_NOTE_SIZE
  const h =
    typeof note.height === 'number' && note.height >= STICKY_NOTE_MIN_H ? note.height : STICKY_NOTE_SIZE
  return { w, h }
}

function getFreeTextSize(ft: Pick<BoardFreeText, 'width' | 'height'>) {
  const w =
    typeof ft.width === 'number' && Number.isFinite(ft.width) && ft.width >= FREE_TEXT_MIN_W
      ? ft.width
      : FREE_TEXT_DEFAULT_W
  const h =
    typeof ft.height === 'number' && Number.isFinite(ft.height) && ft.height >= FREE_TEXT_MIN_H
      ? ft.height
      : FREE_TEXT_DEFAULT_H
  return { w, h }
}

type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number }

function worldBoundsFromRect(x: number, y: number, w: number, h: number): WorldBounds {
  return { minX: x, minY: y, maxX: x + w, maxY: y + h }
}

function unionWorldBounds(a: WorldBounds | null, b: WorldBounds | null): WorldBounds | null {
  if (!a) return b
  if (!b) return a
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

function padWorldBounds(b: WorldBounds, pad: number): WorldBounds {
  return { minX: b.minX - pad, minY: b.minY - pad, maxX: b.maxX + pad, maxY: b.maxY + pad }
}

function worldBoundsIntersect(a: WorldBounds, b: WorldBounds): boolean {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY
}

function worldBoundsForBoardSection(section: BoardSection): WorldBounds {
  return worldBoundsFromRect(section.x, section.y, section.width, section.height)
}

function isWideBoardPreviewSlug(slug: string): boolean {
  return slug === 'service-blueprint' || slug === 'brugerrejse'
}

const SECTION_RESIZE_HANDLE_SIZE = 11

function sectionResizeCursor(edge: SectionResizeEdge): CSSProperties['cursor'] {
  switch (edge) {
    case 'n':
    case 's':
      return 'ns-resize'
    case 'e':
    case 'w':
      return 'ew-resize'
    case 'ne':
    case 'sw':
      return 'nesw-resize'
    case 'nw':
    case 'se':
      return 'nwse-resize'
    default:
      return 'default'
  }
}

function getSectionResizeHandleStyle(section: BoardSection, edge: SectionResizeEdge): CSSProperties {
  const hs = SECTION_RESIZE_HANDLE_SIZE
  const half = hs / 2
  const { x, y, width: w, height: h } = section
  const base: CSSProperties = {
    position: 'absolute',
    width: hs,
    height: hs,
    borderRadius: 3,
    background: '#fff',
    border: '2px solid #2563EB',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    cursor: sectionResizeCursor(edge),
    zIndex: 2,
  }
  switch (edge) {
    case 'nw':
      return { ...base, left: x - 6, top: y - 6 }
    case 'n':
      return { ...base, left: x + w / 2 - half, top: y - 6 }
    case 'ne':
      return { ...base, left: x + w - half + 1, top: y - 6 }
    case 'e':
      return { ...base, left: x + w - half + 1, top: y + h / 2 - half }
    case 'se':
      return { ...base, left: x + w - half + 1, top: y + h - half + 1 }
    case 's':
      return { ...base, left: x + w / 2 - half, top: y + h - half + 1 }
    case 'sw':
      return { ...base, left: x - 6, top: y + h - half + 1 }
    case 'w':
      return { ...base, left: x - 6, top: y + h / 2 - half }
    default:
      return base
  }
}

/** Sektioner ligger under board-indhold; indhold i sektion får mindst sectionZ + offset. */
const BOARD_SECTION_Z_BASE = 1
const BOARD_SECTION_CONTENT_Z_OFFSET = 2

function getBoardSectionZIndex(sectionIndex: number): number {
  return BOARD_SECTION_Z_BASE + sectionIndex
}

function resolveBoardZIndex(baseZ: number, sectionContentFloor: number | null): number {
  if (sectionContentFloor == null) return baseZ
  return Math.max(baseZ, sectionContentFloor)
}

type SectionDragContents = {
  sectionStart: { x: number; y: number }
  cards: Record<string, { x: number; y: number }>
  flowNodes: Record<string, { x: number; y: number }>
  stickyNotes: Record<string, { x: number; y: number }>
  comments: Record<string, { x: number; y: number }>
  freeTexts: Record<string, { x: number; y: number }>
  images: Record<string, { x: number; y: number }>
}

function clampFreeTextFontSizePx(px: number): number {
  if (!Number.isFinite(px)) return FREE_TEXT_FONT_SIZE_DEFAULT
  return Math.min(FREE_TEXT_FONT_SIZE_MAX, Math.max(FREE_TEXT_FONT_SIZE_MIN, Math.round(px)))
}

function cloneBoardUndoSnapshot(snapshot: BoardUndoSnapshot): BoardUndoSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as BoardUndoSnapshot
}

function getFreeTextFontSizePx(ft: Pick<BoardFreeText, 'fontSizePx'>): number {
  return clampFreeTextFontSizePx(
    typeof ft.fontSizePx === 'number' && Number.isFinite(ft.fontSizePx)
      ? ft.fontSizePx
      : FREE_TEXT_FONT_SIZE_DEFAULT
  )
}

function applyStickyNoteResize(
  edge: SectionResizeEdge,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number
) {
  return applyRectResize(edge, start, dx, dy, STICKY_NOTE_MIN_W, STICKY_NOTE_MIN_H)
}

/** I contentEditable er target ofte en tekst-node — den har ikke .closest */
function boardPointerTargetElement(target: EventTarget | null): Element | null {
  if (target == null || !(target instanceof Node)) return null
  return target instanceof Element ? target : target.parentElement
}

/** Sandt når mousedown på værktøjskortets indhold må starte træk (ikke i input/knap osv.). */
function boardPointerAllowsToolCardBodyDrag(target: EventTarget | null): boolean {
  const el = boardPointerTargetElement(target)
  if (!el) return false
  if (el.closest('button, a[href], input, textarea, select, option')) return false
  if (el.closest('[contenteditable="true"]')) return false
  return true
}
const STICKY_NOTE_COLORS = [
  '#F2B0A1',
  '#FFF9C4',
  '#FCE7F3',
  '#E0F2FE',
  '#DCFCE7',
  '#FEE2E2',
  '#EDE9FE',
]
const CURSOR_STALE_MS = 12000
/** ~15 Hz — mindre pakker end 20 Hz; modtageren glatter alligevel bevægelsen. */
const CURSOR_SEND_INTERVAL_MS = 66
/** Lerp pr. frame mod seneste netværks-mål — dæmper ujævn ankomst (hak). */
const CURSOR_SMOOTHING = 0.28
/** Fortsæt animation inden for denne afstand (world px) til målet. */
const CURSOR_SMOOTH_STOP_PX = 0.35
const CURSOR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#4F46E5']
const ORBIT_WINDOW_MS = 2200
const ORBIT_MIN_RADIUS = 26
const ORBIT_MAX_RADIUS = 220
const ORBIT_MIN_SWEEP_PER_LOOP = Math.PI * 1.8
const ORBIT_MAX_CENTER_JUMP = 90
const HIGH_FIVE_PROXIMITY_PX = 38
const HIGH_FIVE_HOLD_MS = 700
const HIGH_FIVE_COOLDOWN_MS = 3500
const HIGH_FIVE_SHAKE_SIGN_CHANGES = 4
const HIGH_FIVE_SHAKE_MIN_DELTA_PX = 2.2
const STICKY_HOVER_RADIUS = 28
const STICKY_COLLAB_WINDOW_MS = 2000
const STICKY_GLOW_MS = 5200
const SOLO_SHAKE_SIGN_CHANGES = 5
const SOLO_SHAKE_MIN_DELTA_PX = 2.5
const SOLO_SHAKE_COOLDOWN_MS = 2600
const SOLO_ORBIT_SWEEP = Math.PI * 1.65
const SOLO_ORBIT_WINDOW_MS = 1900
const NIGHT_CREATURE_MIN_HOUR = 22
const NIGHT_CREATURE_DURATION_MS = 3200
const NIGHT_CREATURE_COOLDOWN_MS = 1200
const FRIDAY_CELEBRATION_START_HOUR = 12
const FRIDAY_CELEBRATION_END_HOUR = 18
const FRIDAY_CELEBRATION_MS = 2100
const BOARD_COMMENT_CARD_WIDTH = 320

type OrbitPortalEffect = { id: string; x: number; y: number; createdAt: number }
type HighFiveEffect = { id: string; x: number; y: number; createdAt: number; users: [string, string] }
type SoloSparkEffect = { id: string; x: number; y: number; createdAt: number }
type SoloOrbitEffect = { id: string; x: number; y: number; createdAt: number }
type NightCreatureEffect = {
  id: string
  userId: string
  x: number
  y: number
  createdAt: number
  expiresAt: number
  emoji: '🦉' | '🦇' | '✨'
}
type FridayCelebrationEffect = { id: string; x: number; y: number; createdAt: number }

function isNightModeHour(d = new Date()) {
  return d.getHours() >= NIGHT_CREATURE_MIN_HOUR
}

function isFridayAfternoon(d = new Date()) {
  const day = d.getDay()
  const hour = d.getHours()
  return day === 5 && hour >= FRIDAY_CELEBRATION_START_HOUR && hour <= FRIDAY_CELEBRATION_END_HOUR
}

function shouldTriggerFridayCelebration() {
  if (process.env.NODE_ENV !== 'production') return true
  return isFridayAfternoon()
}

const FLOW_SHAPE_LIBRARY: Array<{ shape: FlowShape; label: string }> = [
  { shape: 'terminator', label: 'Start / Slut' },
  { shape: 'process', label: 'Proces' },
  { shape: 'decision', label: 'Beslutning' },
  { shape: 'data', label: 'Input / Output' },
  { shape: 'document', label: 'Dokument' },
  { shape: 'database', label: 'Database' },
]

const BOARD_EXCLUDED_TOOL_SLUGS = new Set<string>([
  'kanban',
  'gantt-chart',
])
const BOARD_ADD_TOOL_EXCLUDED_SLUGS = new Set<string>([])

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

type CommentReplyInputProps = {
  commentId: string
  commentX: number
  commentY: number
  currentUsername: string
  currentUserId: string | null
  members: { user_id: string; username?: string }[]
  onSubmit: (commentId: string, text: string, images: string[]) => void
}

const CommentReplyInput = memo(function CommentReplyInput({
  commentId, commentX, commentY, currentUsername, currentUserId, members, onSubmit
}: CommentReplyInputProps) {
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')

  const EMOJIS = ['😀','😂','❤️','👍','🎉','🔥','😮','😢','👏','🤔','✅','💡']
  const mentionResults = members.filter(m =>
    (m.username || '').toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5)
  const hasContent = text.trim() || images.length > 0

  const submit = () => {
    if (!hasContent) return
    onSubmit(commentId, text, images)
    setText('')
    setImages([])
    setEmojiOpen(false)
    setMentionOpen(false)
  }

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 14px 12px' }}>
      {/* Pending image previews */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <img src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
              <button type="button"
                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5B6E9B', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
          {(currentUsername || currentUserId || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Mentions dropdown */}
          {mentionOpen && mentionResults.length > 0 && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
              {mentionResults.map(m => (
                <button key={m.user_id} type="button"
                  onClick={() => {
                    const before = text.slice(0, text.lastIndexOf('@'))
                    setText(`${before}@${m.username} `)
                    setMentionOpen(false)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#111827', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5B6E9B', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                    {(m.username || '?').charAt(0).toUpperCase()}
                  </div>
                  {m.username}
                </button>
              ))}
            </div>
          )}
          {/* Emoji picker */}
          {emojiOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {EMOJIS.map(emoji => (
                <button key={emoji} type="button"
                  onClick={() => { setText(prev => prev + emoji); setEmojiOpen(false) }}
                  style={{ fontSize: 18, padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, lineHeight: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >{emoji}</button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={text}
            onChange={e => {
              const val = e.target.value
              setText(val)
              const atIdx = val.lastIndexOf('@')
              if (atIdx !== -1 && (atIdx === 0 || val[atIdx - 1] === ' ')) {
                setMentionQuery(val.slice(atIdx + 1))
                setMentionOpen(true)
              } else {
                setMentionOpen(false)
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); submit() }
              if (e.key === 'Escape') { setEmojiOpen(false); setMentionOpen(false) }
            }}
            placeholder="Reply"
            style={{ width: '100%', height: 34, padding: '0 38px 0 12px', borderRadius: 999, border: 'none', background: '#F3F4F6', color: '#111827', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={submit}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: hasContent ? '#6366F1' : '#D1D5DB', border: 'none', cursor: hasContent ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, marginTop: 6, paddingLeft: 36 }}>
        <button type="button" title="Emoji"
          onClick={() => setEmojiOpen(prev => !prev)}
          style={{ background: emojiOpen ? '#EEF2FF' : 'none', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 6px', fontSize: 15, lineHeight: 1, color: '#6B7280' }}
        >😊</button>
        <label title="Tilføj billede"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 6, color: '#6B7280' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => {
              Array.from(e.target.files || []).forEach(file => {
                const reader = new FileReader()
                reader.onload = ev => {
                  const src = ev.target?.result as string
                  if (src) setImages(prev => [...prev, src])
                }
                reader.readAsDataURL(file)
              })
              e.target.value = ''
            }}
          />
        </label>
        <button type="button" title="Nævn et medlem (@)"
          onClick={() => { setText(prev => prev + '@'); setMentionQuery(''); setMentionOpen(true) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 6px', fontSize: 12, fontWeight: 700, color: '#6B7280', lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >@</button>
      </div>
    </div>
  )
})

type CommentTextAreaProps = {
  initialText: string
  autoFocus?: boolean
  placeholder?: string
  onCommit: (text: string) => void
  onCancel: () => void
}

const CommentTextArea = memo(function CommentTextArea({
  initialText, autoFocus, placeholder, onCommit, onCancel
}: CommentTextAreaProps) {
  const [text, setText] = useState(initialText)
  return (
    <textarea
      autoFocus={autoFocus}
      value={text}
      onMouseDown={e => e.stopPropagation()}
      onChange={e => setText(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCommit(text) }
        if (e.key === 'Escape') { onCancel() }
      }}
      onBlur={() => onCommit(text)}
      placeholder={placeholder}
      style={{
        width: '100%', minHeight: 60, padding: '6px 0',
        border: 'none', background: 'transparent', color: '#1F2937',
        resize: 'none', outline: 'none', fontSize: 13, lineHeight: 1.5,
        boxSizing: 'border-box', fontFamily: 'inherit',
      }}
    />
  )
})

type PanelCommentCardProps = {
  comment: { id: string; text: string; createdBy: string; createdAt: number }
  replies: { id: string; text: string; createdBy: string; createdAt: number }[]
  canEdit: boolean
  onNavigate: () => void
  onResolve: () => void
  onReply: (text: string) => void
}

function PanelCommentCard({ comment, replies, canEdit, onNavigate, onResolve, onReply }: PanelCommentCardProps) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  const fmt = (ts: number) =>
    new Date(ts).toLocaleString('da-DK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const submitReply = () => {
    if (!replyText.trim()) return
    onReply(replyText)
    setReplyText('')
    setReplying(false)
  }

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
      {/* Parent comment */}
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <button
            type="button"
            onClick={onNavigate}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#0F172A', fontSize: 12, fontWeight: 700 }}
          >
            {comment.createdBy}
          </button>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{fmt(comment.createdAt)}</span>
        </div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
          {comment.text.trim() || '(Tom kommentar)'}
        </p>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {canEdit && (
            <button
              type="button"
              onClick={() => setReplying(r => !r)}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: replying ? '#4338CA' : '#64748B' }}
            >
              Svar
            </button>
          )}
          <span style={{ color: '#E2E8F0', fontSize: 11 }}>·</span>
          {canEdit && (
            <button
              type="button"
              onClick={onResolve}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#166534' }}
            >
              Løs
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
          {replies.map((reply, i) => (
            <div
              key={reply.id}
              style={{
                padding: '8px 12px 8px 20px',
                borderTop: i > 0 ? '1px solid #F1F5F9' : undefined,
                borderLeft: '3px solid #E0E7FF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{reply.createdBy}</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{fmt(reply.createdAt)}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                {reply.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {replying && (
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Skriv et svar..."
            autoFocus
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply() } }}
            style={{
              flex: 1, fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 8,
              padding: '6px 8px', resize: 'none', outline: 'none', fontFamily: 'inherit',
              background: '#F8FAFC', color: '#1F2937', lineHeight: 1.4,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={submitReply}
              disabled={!replyText.trim()}
              style={{
                border: 'none', borderRadius: 7, background: '#4338CA', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '5px 10px', cursor: 'pointer',
                opacity: replyText.trim() ? 1 : 0.4,
              }}
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => { setReplying(false); setReplyText('') }}
              style={{
                border: 'none', borderRadius: 7, background: '#F1F5F9', color: '#64748B',
                fontSize: 11, fontWeight: 600, padding: '5px 10px', cursor: 'pointer',
              }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectWorkspaceClient({ projectId }: ProjectWorkspaceClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  /** Skal være defineret før hooks/handlers der refererer til den (fx paste useEffect) */
  const canEdit =
    project != null && (project.role === 'owner' || project.role === 'editor')
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'board' | 'planning' | 'slides' | 'survey' | 'card-sorting' | 'qr' | 'files' | 'comments'
  >('board')
  // Venstre projekt-sidebar (kollapset/åbent). Lever i parent så fx flow-palette kan reagere.
  const [boardSidebarCollapsed, setBoardSidebarCollapsed] = useState(false)
  const [planningPane, setPlanningPane] = useState<'kanban' | 'gantt'>('kanban')
  const [showAddTool, setShowAddTool] = useState(false)
  const [addToolSearch, setAddToolSearch] = useState('')
  const [selectedAddToolCategory, setSelectedAddToolCategory] = useState<'all' | string>('all')
  const [showAllAddToolResults, setShowAllAddToolResults] = useState(false)
  const [showPanel, setShowPanel] = useState<'settings' | 'comments' | 'live-chat' | null>(null)
  const [loading, setLoading] = useState(true)
  const [modifying, setModifying] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [onlineMemberIds, setOnlineMemberIds] = useState<string[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [inviteLink, setInviteLink] = useState<{ id: string; token: string; role: 'editor' | 'viewer'; url: string } | null>(null)
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false)
  const [inviteLinkRole, setInviteLinkRole] = useState<'editor' | 'viewer'>('viewer')
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string>('Dig')
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [liveCursors, setLiveCursors] = useState<Record<string, LiveCursor>>({})
  const [liveCardSelections, setLiveCardSelections] = useState<Record<string, LiveCardSelection>>({})
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>([])
  const [liveChatInput, setLiveChatInput] = useState('')
  const [liveChatUploading, setLiveChatUploading] = useState(false)
  const chatFileInputRef = useRef<HTMLInputElement | null>(null)
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [orbitPortalEffects, setOrbitPortalEffects] = useState<OrbitPortalEffect[]>([])
  const [highFiveEffects, setHighFiveEffects] = useState<HighFiveEffect[]>([])
  const [soloSparkEffects, setSoloSparkEffects] = useState<SoloSparkEffect[]>([])
  const [soloOrbitEffects, setSoloOrbitEffects] = useState<SoloOrbitEffect[]>([])
  const [stickyGoldGlowIds, setStickyGoldGlowIds] = useState<Record<string, number>>({})
  const [nightCreatureEffects, setNightCreatureEffects] = useState<NightCreatureEffect[]>([])
  const [fridayCelebrationEffects, setFridayCelebrationEffects] = useState<FridayCelebrationEffect[]>([])
  const [boardSyncVersion, setBoardSyncVersion] = useState(0)

  // ── Canvas state ──────────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [zoom, setZoom] = useState(1)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanningActive, setIsPanningActive] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showFlowPanel, setShowFlowPanel] = useState(false)
  const [handPanTool, setHandPanTool] = useState(false)
  const [sectionDrawMode, setSectionDrawMode] = useState(false)
  const [sectionPlacementDraft, setSectionPlacementDraft] = useState<MarqueeSelection | null>(null)
  const [activeSectionDragId, setActiveSectionDragId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<BoardContextMenu | null>(null)
  const [marqueeSelection, setMarqueeSelection] = useState<MarqueeSelection | null>(null)
  const [richToolbarUi, setRichToolbarUi] = useState<RichToolbarUiState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const boardTransformLayerRef = useRef<HTMLDivElement>(null)
  const isPointerOverCanvasRef = useRef(false)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })

  // ── Card positions ─────────────────────────────────────────────────
  const [cardPositions, setCardPositions] = useState<Record<string, CardPosition>>({})
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([])
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([])
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [boardSections, setBoardSections] = useState<BoardSection[]>([])
  const [boardComments, setBoardComments] = useState<BoardComment[]>([])
  const [boardFreeTexts, setBoardFreeTexts] = useState<BoardFreeText[]>([])
  const [boardImages, setBoardImages] = useState<BoardImage[]>([])
  const [selectedCardSlugs, setSelectedCardSlugs] = useState<string[]>([])
  const [selectedFlowNodeIds, setSelectedFlowNodeIds] = useState<string[]>([])
  const [selectedStickyNoteIds, setSelectedStickyNoteIds] = useState<string[]>([])
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [selectedCommentIds, setSelectedCommentIds] = useState<string[]>([])
  const [selectedFreeTextIds, setSelectedFreeTextIds] = useState<string[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [lockedCardSlugs, setLockedCardSlugs] = useState<string[]>([])
  const [cardZOrder, setCardZOrder] = useState<Record<string, number>>({})
  const [linkingFromNodeId, setLinkingFromNodeId] = useState<string | null>(null)
  const [selectedFlowNodeId, setSelectedFlowNodeId] = useState<string | null>(null)
  const [hoveredFlowNodeId, setHoveredFlowNodeId] = useState<string | null>(null)
  const [draggingPaletteShape, setDraggingPaletteShape] = useState<FlowShape | null>(null)
  const [edgeDraft, setEdgeDraft] = useState<FlowEdgeDraft | null>(null)
  const dragging = useRef<string | null>(null)
  const cardDragGroupRef = useRef<{
    ids: string[]
    primaryId: string
    startById: Record<string, { x: number; y: number }>
  } | null>(null)
  const cardDragPointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const cardDragDidMoveRef = useRef(false)
  const suppressNextCardClickRef = useRef(false)
  const draggingStickyNote = useRef<string | null>(null)
  const stickyEditorRefs = useRef(new Map<string, HTMLDivElement>())
  const flowNodeEditorRefs = useRef(new Map<string, HTMLDivElement>())
  const richToolbarTargetRef = useRef<{ kind: 'sticky' | 'flow'; id: string } | null>(null)
  const draggingBoardSection = useRef<string | null>(null)
  const sectionDragContentsRef = useRef<SectionDragContents | null>(null)
  const alignmentDragMetaRef = useRef<{ w: number; h: number; exclude: BoardSnapExclude } | null>(null)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const sectionResizeRef = useRef<{
    id: string
    edge: SectionResizeEdge
    startWorld: { x: number; y: number }
    start: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const stickyResizeRef = useRef<{
    id: string
    edge: SectionResizeEdge
    startWorld: { x: number; y: number }
    start: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const flowResizeRef = useRef<{
    id: string
    edge: SectionResizeEdge
    startWorld: { x: number; y: number }
    start: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const freeTextResizeRef = useRef<{
    id: string
    edge: SectionResizeEdge
    startWorld: { x: number; y: number }
    start: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const stickyDragGroupRef = useRef<{
    ids: string[]
    primaryId: string
    startById: Record<string, { x: number; y: number }>
  } | null>(null)
  const flowDragGroupRef = useRef<{
    ids: string[]
    primaryId: string
    startById: Record<string, { x: number; y: number }>
  } | null>(null)
  const imageDragGroupRef = useRef<{
    ids: string[]
    primaryId: string
    startById: Record<string, { x: number; y: number }>
  } | null>(null)
  const freeTextDragGroupRef = useRef<{
    ids: string[]
    primaryId: string
    startById: Record<string, { x: number; y: number }>
  } | null>(null)
  const draggingBoardComment = useRef<string | null>(null)
  const draggingBoardFreeText = useRef<string | null>(null)
  const draggingBoardImage = useRef<string | null>(null)
  const sectionExportRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const boardImageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const stickyExportRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const flowNodeExportRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const boardClipboardRef = useRef<BoardClipboardPayload | null>(null)
  const boardPasteCountRef = useRef(0)
  const boardUndoPastRef = useRef<BoardUndoSnapshot[]>([])
  const boardUndoFutureRef = useRef<BoardUndoSnapshot[]>([])
  const boardUndoLastSnapshotRef = useRef<BoardUndoSnapshot | null>(null)
  const boardUndoIsApplyingRef = useRef(false)
  const boardUndoReadyRef = useRef(false)
  const BOARD_UNDO_LIMIT = 250
  const boardImageFileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingImageWorldRef = useRef<{ x: number; y: number } | null>(null)
  const isMarqueeSelecting = useRef(false)
  const isSectionPlacementDragging = useRef(false)
  const sectionPlacementStartRef = useRef<{ x: number; y: number } | null>(null)
  const sectionPlacementEndRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const marqueeIsAdditiveRef = useRef(false)
  const draggingFlowNode = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flowSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadToolsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextCardZIndexRef = useRef(10)
  const cardElementRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const GRID_SIZE = 24
  const cursorChannelRef = useRef<any>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const onlineMemberIdSet = new Set(onlineMemberIds)
  const onlineMembers = members.filter((member) => onlineMemberIdSet.has(member.user_id))
  const lastCardSelectionSignatureRef = useRef<string>('')
  const lastCursorSendAtRef = useRef(0)
  const liveCursorTargetsRef = useRef<Record<string, LiveCursor>>({})
  const liveCursorSmoothedRef = useRef<Record<string, { x: number; y: number }>>({})
  const liveCursorRafRef = useRef<number | null>(null)
  const localCursorPointRef = useRef<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })
  const orbitTrackRef = useRef<
    Record<string, { targetUserId: string; centerX: number; centerY: number; lastAngle: number; sweep: number; loops: number; startedAt: number }>
  >({})
  const lastOrbitTriggerRef = useRef<Record<string, number>>({})
  const stickyHoverTrackerRef = useRef<Record<string, Record<string, number>>>({})
  const stickyHoverCooldownRef = useRef<Record<string, number>>({})
  const lastCreatureSpawnByUserRef = useRef<Record<string, number>>({})
  const highFivePairStartRef = useRef<Record<string, number>>({})
  const highFiveCooldownRef = useRef<Record<string, number>>({})
  const highFivePairMotionRef = useRef<
    Record<string, { lastDist: number; lastDelta: number; shakeCount: number; updatedAt: number }>
  >({})
  const soloShakeRef = useRef<{ lastX: number; dx: number; count: number; updatedAt: number } | null>(null)
  const soloShakeCooldownRef = useRef(0)
  const soloOrbitRef = useRef<{
    centerX: number
    centerY: number
    startedAt: number
    lastAngle: number
    sweep: number
  } | null>(null)
  const sectionDrawModeRef = useRef(false)
  const sentMentionKeysRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    sectionDrawModeRef.current = sectionDrawMode
  }, [sectionDrawMode])

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    sentMentionKeysRef.current = new Set()
  }, [projectId])

  const notifyMentions = useCallback(
    async (sourceType: 'comment' | 'board', sourceId: string, text: string) => {
      if (!projectId || !currentUserId) return
      const plainText = text.trim()
      if (!plainText) return
      const mentionedUserIds = extractMentionUserIdsFromText(plainText, members, currentUserId)
      if (mentionedUserIds.length === 0) return

      const mentionSignature = `${sourceType}:${sourceId}:${mentionedUserIds.sort().join(',')}:${plainText}`
      if (sentMentionKeysRef.current.has(mentionSignature)) return
      sentMentionKeysRef.current.add(mentionSignature)

      try {
        await fetch(`/api/projects/${projectId}/mentions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sourceType,
            sourceId,
            mentionText: plainText.slice(0, 1200),
            mentionContext: plainText.slice(0, 220),
            mentionedUserIds,
          }),
        })
      } catch (error) {
        console.warn('Kunne ikke sende mentions:', error)
      }
    },
    [currentUserId, members, projectId]
  )

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
        if (typeof data.avatarUrl === 'string' && data.avatarUrl.trim()) {
          setCurrentUserAvatar(data.avatarUrl.trim())
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
    if (activeWorkspaceTab !== 'board') return
    const onEscapeSectionMode = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }
      if (!sectionDrawModeRef.current && !isSectionPlacementDragging.current) return
      event.preventDefault()
      isSectionPlacementDragging.current = false
      sectionPlacementStartRef.current = null
      setSectionPlacementDraft(null)
      setSectionDrawMode(false)
    }
    window.addEventListener('keydown', onEscapeSectionMode)
    return () => window.removeEventListener('keydown', onEscapeSectionMode)
  }, [activeWorkspaceTab])

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

  /** Mac trackpad two-finger swipe L/R otherwise triggers browser back/forward; disable on board tab. */
  useEffect(() => {
    if (activeWorkspaceTab !== 'board') return
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlX: html.style.overscrollBehaviorX,
      bodyX: body.style.overscrollBehaviorX,
    }
    html.style.overscrollBehaviorX = 'none'
    body.style.overscrollBehaviorX = 'none'

    const blockHistorySwipeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, select, [contenteditable]')) return
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      if (Math.abs(e.deltaX) < 2) return
      e.preventDefault()
    }
    window.addEventListener('wheel', blockHistorySwipeWheel, { passive: false, capture: true })

    return () => {
      html.style.overscrollBehaviorX = prev.htmlX
      body.style.overscrollBehaviorX = prev.bodyX
      window.removeEventListener('wheel', blockHistorySwipeWheel, { capture: true })
    }
  }, [activeWorkspaceTab])

  useEffect(() => {
    return () => {
      if (flowSaveTimer.current) clearTimeout(flowSaveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const onWindowClick = () => setContextMenu(null)
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', onWindowClick)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('click', onWindowClick)
      window.removeEventListener('keydown', onEscape)
    }
  }, [contextMenu])

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

  const broadcastCardSelection = useCallback(
    async (slugs: string[], visible: boolean) => {
      const channel = cursorChannelRef.current
      if (!channel || !currentUserId || activeWorkspaceTab !== 'board') return
      const payload: LiveCardSelectionPayload = {
        userId: currentUserId,
        username: currentUsername,
        color: getStableCursorColor(currentUserId),
        selectedCardSlugs: slugs,
        visible,
        ts: Date.now(),
      }
      await channel.send({ type: 'broadcast', event: 'card_selection', payload })
    },
    [activeWorkspaceTab, currentUserId, currentUsername]
  )

  const broadcastBoardRefresh = useCallback(async () => {
    const channel = cursorChannelRef.current
    if (!channel || !currentUserId) return
    await channel.send({
      type: 'broadcast',
      event: 'board_refresh',
      payload: {
        userId: currentUserId,
        ts: Date.now(),
      },
    })
  }, [currentUserId])

  const triggerOrbitPortal = useCallback((x: number, y: number) => {
    const now = Date.now()
    const id = `orbit-${now}-${Math.random().toString(36).slice(2, 7)}`
    setOrbitPortalEffects(prev => [...prev, { id, x, y, createdAt: now }])
  }, [])

  const triggerStickyGoldGlow = useCallback((noteId: string) => {
    const now = Date.now()
    setStickyGoldGlowIds(prev => ({ ...prev, [noteId]: now + STICKY_GLOW_MS }))
  }, [])

  const triggerHighFive = useCallback((userA: string, userB: string, x: number, y: number) => {
    const now = Date.now()
    const id = `highfive-${now}-${Math.random().toString(36).slice(2, 7)}`
    setHighFiveEffects(prev => [...prev, { id, x, y, createdAt: now, users: [userA, userB] }])
  }, [])

  const triggerSoloSpark = useCallback((x: number, y: number) => {
    const now = Date.now()
    const id = `solo-spark-${now}-${Math.random().toString(36).slice(2, 7)}`
    setSoloSparkEffects(prev => [...prev, { id, x, y, createdAt: now }])
  }, [])

  const triggerSoloOrbit = useCallback((x: number, y: number) => {
    const now = Date.now()
    const id = `solo-orbit-${now}-${Math.random().toString(36).slice(2, 7)}`
    setSoloOrbitEffects(prev => [...prev, { id, x, y, createdAt: now }])
  }, [])

  const maybeSpawnNightCreature = useCallback((userId: string, x: number, y: number) => {
    if (!isNightModeHour()) return
    const now = Date.now()
    if (now - (lastCreatureSpawnByUserRef.current[userId] || 0) < NIGHT_CREATURE_COOLDOWN_MS) return
    lastCreatureSpawnByUserRef.current[userId] = now
    const emoji: NightCreatureEffect['emoji'][] = ['🦉', '🦇', '✨']
    const id = `night-${now}-${Math.random().toString(36).slice(2, 7)}`
    setNightCreatureEffects(prev => [
      ...prev,
      {
        id,
        userId,
        x,
        y,
        createdAt: now,
        expiresAt: now + NIGHT_CREATURE_DURATION_MS,
        emoji: emoji[Math.floor(Math.random() * emoji.length)],
      },
    ])
  }, [])

  const detectOrbitAndCollabUnlocks = useCallback(
    (nextCursors: Record<string, LiveCursor>) => {
      const now = Date.now()
      const allCursors: Array<{ userId: string; x: number; y: number }> = Object.values(nextCursors)
        .filter(c => c.visible)
        .map(c => ({ userId: c.userId, x: c.x, y: c.y }))
      if (currentUserId && localCursorPointRef.current.visible) {
        allCursors.push({ userId: currentUserId, x: localCursorPointRef.current.x, y: localCursorPointRef.current.y })
      }

      const getClosestTarget = (sourceUserId: string, sx: number, sy: number) => {
        let best: { userId: string; x: number; y: number; dist: number } | null = null
        for (const c of allCursors) {
          if (c.userId === sourceUserId) continue
          const dist = Math.hypot(c.x - sx, c.y - sy)
          if (!best || dist < best.dist) best = { ...c, dist }
        }
        return best
      }

      for (const cursor of allCursors) {
        const closest = getClosestTarget(cursor.userId, cursor.x, cursor.y)
        if (!closest) {
          delete orbitTrackRef.current[cursor.userId]
          continue
        }
        if (closest.dist < ORBIT_MIN_RADIUS || closest.dist > ORBIT_MAX_RADIUS) {
          delete orbitTrackRef.current[cursor.userId]
          continue
        }
        const angle = Math.atan2(cursor.y - closest.y, cursor.x - closest.x)
        const prev = orbitTrackRef.current[cursor.userId]
        if (
          !prev ||
          prev.targetUserId !== closest.userId ||
          Math.hypot(prev.centerX - closest.x, prev.centerY - closest.y) > ORBIT_MAX_CENTER_JUMP ||
          now - prev.startedAt > ORBIT_WINDOW_MS
        ) {
          orbitTrackRef.current[cursor.userId] = {
            targetUserId: closest.userId,
            centerX: closest.x,
            centerY: closest.y,
            lastAngle: angle,
            sweep: 0,
            loops: 0,
            startedAt: now,
          }
          continue
        }
        let delta = angle - prev.lastAngle
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        const sweep = prev.sweep + delta
        const loops = Math.floor(Math.abs(sweep) / ORBIT_MIN_SWEEP_PER_LOOP)
        orbitTrackRef.current[cursor.userId] = { ...prev, lastAngle: angle, sweep, loops }

        const triggerKey = `${cursor.userId}:${closest.userId}`
        if (loops >= 2 && now - (lastOrbitTriggerRef.current[triggerKey] || 0) > 4000) {
          lastOrbitTriggerRef.current[triggerKey] = now
          triggerOrbitPortal(closest.x, closest.y)
          orbitTrackRef.current[cursor.userId] = {
            targetUserId: closest.userId,
            centerX: closest.x,
            centerY: closest.y,
            lastAngle: angle,
            sweep: 0,
            loops: 0,
            startedAt: now,
          }
        }
      }

      const activePairKeys = new Set<string>()
      for (let i = 0; i < allCursors.length; i++) {
        for (let j = i + 1; j < allCursors.length; j++) {
          const a = allCursors[i]
          const b = allCursors[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          const pairKey = [a.userId, b.userId].sort().join(':')
          if (dist > HIGH_FIVE_PROXIMITY_PX) continue
          activePairKeys.add(pairKey)
          const startedAt = highFivePairStartRef.current[pairKey] || now
          highFivePairStartRef.current[pairKey] = startedAt
          const motion = highFivePairMotionRef.current[pairKey] || {
            lastDist: dist,
            lastDelta: 0,
            shakeCount: 0,
            updatedAt: now,
          }
          const distDelta = dist - motion.lastDist
          const staleMotion = now - motion.updatedAt > 420
          let nextShakeCount = staleMotion ? 0 : motion.shakeCount
          if (
            !staleMotion &&
            Math.abs(distDelta) >= HIGH_FIVE_SHAKE_MIN_DELTA_PX &&
            Math.abs(motion.lastDelta) >= HIGH_FIVE_SHAKE_MIN_DELTA_PX &&
            Math.sign(distDelta) !== Math.sign(motion.lastDelta)
          ) {
            nextShakeCount += 1
          }
          highFivePairMotionRef.current[pairKey] = {
            lastDist: dist,
            lastDelta: distDelta,
            shakeCount: nextShakeCount,
            updatedAt: now,
          }
          const cooldownUntil = highFiveCooldownRef.current[pairKey] || 0
          if (
            now - startedAt >= HIGH_FIVE_HOLD_MS &&
            nextShakeCount >= HIGH_FIVE_SHAKE_SIGN_CHANGES &&
            now >= cooldownUntil
          ) {
            highFiveCooldownRef.current[pairKey] = now + HIGH_FIVE_COOLDOWN_MS
            highFivePairStartRef.current[pairKey] = now
            highFivePairMotionRef.current[pairKey] = {
              lastDist: dist,
              lastDelta: 0,
              shakeCount: 0,
              updatedAt: now,
            }
            triggerHighFive(a.userId, b.userId, (a.x + b.x) / 2, (a.y + b.y) / 2)
          }
        }
      }
      for (const key of Object.keys(highFivePairStartRef.current)) {
        if (!activePairKeys.has(key)) {
          delete highFivePairStartRef.current[key]
          delete highFivePairMotionRef.current[key]
        }
      }

      const hoveredByUser: Record<string, string> = {}
      for (const c of allCursors) {
        const note = stickyNotes.find(n => {
          const { w, h } = getStickyNoteSize(n)
          return (
            c.x >= n.x - STICKY_HOVER_RADIUS &&
            c.x <= n.x + w + STICKY_HOVER_RADIUS &&
            c.y >= n.y - STICKY_HOVER_RADIUS &&
            c.y <= n.y + h + STICKY_HOVER_RADIUS
          )
        })
        if (note) hoveredByUser[c.userId] = note.id
      }

      for (const [noteId, users] of Object.entries(stickyHoverTrackerRef.current)) {
        for (const userId of Object.keys(users)) {
          if (hoveredByUser[userId] !== noteId || now - users[userId] > STICKY_COLLAB_WINDOW_MS) {
            delete stickyHoverTrackerRef.current[noteId][userId]
          }
        }
        if (Object.keys(stickyHoverTrackerRef.current[noteId]).length === 0) delete stickyHoverTrackerRef.current[noteId]
      }

      for (const [userId, noteId] of Object.entries(hoveredByUser)) {
        const noteUsers = stickyHoverTrackerRef.current[noteId] || {}
        noteUsers[userId] = now
        stickyHoverTrackerRef.current[noteId] = noteUsers
        const activeUsers = Object.values(noteUsers).filter(ts => now - ts <= STICKY_COLLAB_WINDOW_MS).length
        if (activeUsers >= 3 && now - (stickyHoverCooldownRef.current[noteId] || 0) > STICKY_GLOW_MS) {
          stickyHoverCooldownRef.current[noteId] = now
          triggerStickyGoldGlow(noteId)
        }
      }
    },
    [currentUserId, stickyNotes, triggerHighFive, triggerOrbitPortal, triggerStickyGoldGlow]
  )

  useEffect(() => {
    if (!projectId || !currentUserId) return

    const runCursorSmoothingFrame = () => {
      liveCursorRafRef.current = null
      const now = Date.now()
      const targets = liveCursorTargetsRef.current
      const smoothed = liveCursorSmoothedRef.current
      const next: Record<string, LiveCursor> = {}
      let needsNextFrame = false

      for (const userId of Object.keys(targets)) {
        const t = targets[userId]
        if (!t) continue
        if (now - t.updatedAt > CURSOR_STALE_MS) {
          delete targets[userId]
          delete smoothed[userId]
          continue
        }
        if (!t.visible) {
          delete targets[userId]
          delete smoothed[userId]
          continue
        }
        let s = smoothed[userId]
        if (!s) {
          s = { x: t.x, y: t.y }
          smoothed[userId] = s
        }
        const dx = t.x - s.x
        const dy = t.y - s.y
        const dist = Math.hypot(dx, dy)
        if (dist > 0.01) {
          s.x += dx * CURSOR_SMOOTHING
          s.y += dy * CURSOR_SMOOTHING
        }
        if (Math.hypot(t.x - s.x, t.y - s.y) > CURSOR_SMOOTH_STOP_PX) {
          needsNextFrame = true
        }
        next[userId] = { ...t, x: s.x, y: s.y, updatedAt: now }
      }

      for (const userId of Object.keys(smoothed)) {
        if (!targets[userId]) delete smoothed[userId]
      }

      setLiveCursors(next)
      detectOrbitAndCollabUnlocks(next)
      if (needsNextFrame) {
        liveCursorRafRef.current = requestAnimationFrame(runCursorSmoothingFrame)
      }
    }

    const scheduleCursorSmoothing = () => {
      if (liveCursorRafRef.current != null) return
      liveCursorRafRef.current = requestAnimationFrame(runCursorSmoothingFrame)
    }

    const syncOnlineMembersFromPresence = (channelRef: any) => {
      const rawState = channelRef?.presenceState?.() || {}
      const ids = Array.from(
        new Set(
          Object.values(rawState)
            .flatMap((entry: any) =>
              Array.isArray(entry) ? entry.map((item) => String(item?.userId || '')) : []
            )
            .filter(Boolean)
        )
      )
      setOnlineMemberIds(ids)
    }

    const channel: any = supabase.channel(`project-live-cursors:${projectId}`, {
      config: { broadcast: { self: false }, presence: { key: currentUserId } },
    })
    channel
      .on('presence', { event: 'sync' }, () => syncOnlineMembersFromPresence(channel))
      .on('presence', { event: 'join' }, () => syncOnlineMembersFromPresence(channel))
      .on('presence', { event: 'leave' }, () => syncOnlineMembersFromPresence(channel))
      .on('broadcast', { event: 'cursor_move' }, (message: { payload?: LiveCursorPayload }) => {
        const payload = message?.payload
        if (!payload || !payload.userId || payload.userId === currentUserId) return
        const now = Date.now()
        const targets = liveCursorTargetsRef.current
        const smoothed = liveCursorSmoothedRef.current
        if (!payload.visible) {
          delete targets[payload.userId]
          delete smoothed[payload.userId]
          scheduleCursorSmoothing()
          return
        }
        const color = getStableCursorColor(payload.userId)
        targets[payload.userId] = {
          ...payload,
          color,
          updatedAt: now,
        }
        maybeSpawnNightCreature(payload.userId, payload.x, payload.y)
        scheduleCursorSmoothing()
      })
      .on('broadcast', { event: 'card_selection' }, (message: { payload?: LiveCardSelectionPayload }) => {
        const payload = message?.payload
        if (!payload || !payload.userId || payload.userId === currentUserId) return
        const now = Date.now()
        setLiveCardSelections(prev => {
          if (!payload.visible || !Array.isArray(payload.selectedCardSlugs) || payload.selectedCardSlugs.length === 0) {
            if (!prev[payload.userId]) return prev
            const next = { ...prev }
            delete next[payload.userId]
            return next
          }
          return {
            ...prev,
            [payload.userId]: {
              ...payload,
              updatedAt: now,
            },
          }
        })
      })
      .on('broadcast', { event: 'board_refresh' }, () => {
        // Reload project data to get updated card positions and tool states
        void syncProjectLight()
      })
      .on('broadcast', { event: 'live_chat_message' }, (message: { payload?: LiveChatMessagePayload }) => {
        const payload = message?.payload
        if (!payload || !payload.userId || payload.userId === currentUserId) return
        const normalizedText = String(payload.text || '').trim()
        if (!normalizedText) return
        setLiveChatMessages((prev) => {
          if (prev.some((item) => item.id === payload.id)) return prev
          const next = [
            ...prev,
            {
              ...payload,
              text: normalizedText.slice(0, 800),
              isMine: false,
            },
          ]
          return next.slice(-100)
        })
      })
      .on('broadcast', { event: 'chat_reaction' }, (message: { payload?: { messageId: string; reaction: ChatReaction } }) => {
        const payload = message?.payload
        if (!payload || !payload.messageId || !payload.reaction) return
        setLiveChatMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id !== payload.messageId) return msg
            const existingReactionIndex = msg.reactions?.findIndex(r => r.emoji === payload.reaction.emoji && r.userId === payload.reaction.userId)
            if (existingReactionIndex !== undefined && existingReactionIndex > -1) {
              // Remove reaction if it already exists
              const newReactions = [...(msg.reactions || [])]
              newReactions.splice(existingReactionIndex, 1)
              return { ...msg, reactions: newReactions }
            } else {
              // Add new reaction
              return { 
                ...msg, 
                reactions: [...(msg.reactions || []), payload.reaction].sort((a, b) => a.createdAt - b.createdAt)
              }
            }
          })
        })
      })
      .subscribe((status: string) => {
        if (status !== 'SUBSCRIBED') return
        void channel.track({
          userId: currentUserId,
          username: currentUsername,
          onlineAt: Date.now(),
        })
      })

    cursorChannelRef.current = channel
    liveCursorTargetsRef.current = {}
    liveCursorSmoothedRef.current = {}
    setLiveCursors({})
    setLiveCardSelections({})

    const staleCleanup = window.setInterval(() => {
      const now = Date.now()
      const targets = liveCursorTargetsRef.current
      const smoothed = liveCursorSmoothedRef.current
      let pruned = false
      for (const userId of Object.keys(targets)) {
        const t = targets[userId]
        if (t && now - t.updatedAt > CURSOR_STALE_MS) {
          delete targets[userId]
          delete smoothed[userId]
          pruned = true
        }
      }
      if (pruned) scheduleCursorSmoothing()
      setLiveCardSelections(prev => {
        let changed = false
        const next: Record<string, LiveCardSelection> = {}
        for (const [userId, item] of Object.entries(prev)) {
          if (now - item.updatedAt > CURSOR_STALE_MS) {
            changed = true
            continue
          }
          next[userId] = item
        }
        return changed ? next : prev
      })
    }, 2000)

    return () => {
      window.clearInterval(staleCleanup)
      if (liveCursorRafRef.current != null) {
        cancelAnimationFrame(liveCursorRafRef.current)
        liveCursorRafRef.current = null
      }
      liveCursorTargetsRef.current = {}
      liveCursorSmoothedRef.current = {}
      setLiveCursors({})
      setLiveCardSelections({})
      setOnlineMemberIds([])
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
      void channel.send({
        type: 'broadcast',
        event: 'card_selection',
        payload: {
          userId: currentUserId,
          username: currentUsername,
          color: getStableCursorColor(currentUserId),
          selectedCardSlugs: [],
          visible: false,
          ts: Date.now(),
        } satisfies LiveCardSelectionPayload,
      })
      if (typeof channel?.untrack === 'function') {
        void channel.untrack()
      }
      cursorChannelRef.current = null
      void channel.unsubscribe()
    }
  }, [currentUserId, currentUsername, detectOrbitAndCollabUnlocks, maybeSpawnNightCreature, projectId])

  useEffect(() => {
    if (!currentUserId || !currentUsername || !projectId) return
    const dashChannel: any = supabase.channel(`dashboard-presence:${projectId}`, {
      config: { presence: { key: currentUserId } },
    })
    dashChannel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status: string) => {
        if (status !== 'SUBSCRIBED') return
        await dashChannel.track({
          userId: currentUserId,
          username: currentUsername,
          avatarUrl: currentUserAvatar || null,
          projectId,
        })
      })
    return () => {
      void dashChannel.unsubscribe()
    }
  }, [currentUserId, currentUsername, currentUserAvatar, projectId])

  useEffect(() => {
    if (showPanel !== 'live-chat') return
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveChatMessages, showPanel])

  const sendLiveChatMessage = useCallback(async (attachments?: ChatAttachment[]) => {
    const channel = cursorChannelRef.current
    const normalizedText = liveChatInput.trim()
    if (!channel || (!normalizedText && !attachments?.length) || !currentUserId) return

    const payload: LiveChatMessagePayload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: currentUserId,
      username: currentUsername || 'Dig',
      avatarUrl: currentUserAvatar,
      color: getStableCursorColor(currentUserId),
      text: normalizedText.slice(0, 800),
      createdAt: Date.now(),
      attachments,
    }

    setLiveChatMessages((prev) => [...prev, { ...payload, isMine: true }].slice(-100))
    setLiveChatInput('')
    await channel.send({
      type: 'broadcast',
      event: 'live_chat_message',
      payload,
    })
  }, [currentUserId, currentUserAvatar, currentUsername, liveChatInput])

  const handleChatFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !projectId || !canEdit) return
    setLiveChatUploading(true)
    try {
      const attachments: ChatAttachment[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/projects/${projectId}/chat-upload`, { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          alert(err?.error || 'Upload fejlede')
          continue
        }
        const data = await res.json() as ChatAttachment
        attachments.push(data)
      }
      if (attachments.length > 0) {
        await sendLiveChatMessage(attachments)
      }
    } finally {
      setLiveChatUploading(false)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ''
    }
  }, [projectId, sendLiveChatMessage, canEdit])

  const sendChatReaction = useCallback(async (messageId: string, emoji: string) => {
    const channel = cursorChannelRef.current
    if (!channel || !currentUserId) return

    const reaction: ChatReaction = {
      emoji,
      userId: currentUserId,
      username: currentUsername || 'Dig',
      createdAt: Date.now(),
    }

    await channel.send({
      type: 'broadcast',
      event: 'chat_reaction',
      payload: { messageId, reaction },
    })
  }, [currentUserId, currentUsername])

  useEffect(() => {
    if (activeWorkspaceTab !== 'board' || !currentUserId) return
    const visible = selectedCardSlugs.length > 0
    const signature = `${visible ? '1' : '0'}:${selectedCardSlugs.slice().sort().join('|')}`
    if (signature === lastCardSelectionSignatureRef.current) return
    lastCardSelectionSignatureRef.current = signature
    void broadcastCardSelection(selectedCardSlugs, visible)
  }, [activeWorkspaceTab, broadcastCardSelection, currentUserId, selectedCardSlugs])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now()
      setOrbitPortalEffects(prev => prev.filter(item => now - item.createdAt < 1400))
      setHighFiveEffects(prev => prev.filter(item => now - item.createdAt < 1300))
      setSoloSparkEffects(prev => prev.filter(item => now - item.createdAt < 1200))
      setSoloOrbitEffects(prev => prev.filter(item => now - item.createdAt < 1300))
      setNightCreatureEffects(prev => prev.filter(item => item.expiresAt > now))
      setFridayCelebrationEffects(prev => prev.filter(item => now - item.createdAt < FRIDAY_CELEBRATION_MS))
      setStickyGoldGlowIds(prev => {
        let changed = false
        const next: Record<string, number> = {}
        for (const [noteId, expiresAt] of Object.entries(prev)) {
          if (expiresAt > now) next[noteId] = expiresAt
          else changed = true
        }
        return changed ? next : prev
      })
    }, 250)
    return () => window.clearInterval(timer)
  }, [])

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

  const syncProjectLight = useCallback(async () => {
    const p = await getProject(projectId).catch(() => null)
    if (!p) return
    setProject(p)
    setIsOffline(false)
    if (p.ddCanvasLayout) {
      const pos: Record<string, CardPosition> = {}
      Object.entries(p.ddCanvasLayout).forEach(([slug, { x, y }]) => {
        pos[slug] = { x: x * 1600, y: y * 900 }
      })
      setCardPositions(pos)
    }
  }, [projectId])

  useEffect(() => {
    const onReloadProjectTools = () => {
      if (reloadToolsTimerRef.current) clearTimeout(reloadToolsTimerRef.current)
      reloadToolsTimerRef.current = setTimeout(() => {
        void syncProjectLight()
      }, 180)
    }
    window.addEventListener('forgelab-reload-project-tools', onReloadProjectTools)
    return () => {
      window.removeEventListener('forgelab-reload-project-tools', onReloadProjectTools)
      if (reloadToolsTimerRef.current) {
        clearTimeout(reloadToolsTimerRef.current)
        reloadToolsTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, syncProjectLight])

  useEffect(() => {
    if (activeWorkspaceTab === 'comments' && projectId) {
      const loadComments = async () => {
        try {
          await fetchProjectCommentsApi(projectId)
        } catch (error) {
          console.error('Error loading comments:', error)
        }
      }
      void loadComments()
    }
  }, [activeWorkspaceTab, projectId])

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
            .map((n: any) => {
              const shape: FlowShape = (['terminator', 'process', 'decision', 'data', 'document', 'database'] as const).includes(n.shape)
                ? n.shape
                : 'process'
              const style = getFlowNodeStyle(shape)
              const rawLabel = typeof n.label === 'string' && n.label.trim() ? n.label : 'Trin'
              const labelHtml = migratePlainStickyTextToHtml(rawLabel)
              const fill =
                typeof n.fillColor === 'string' && n.fillColor.trim().startsWith('#')
                  ? n.fillColor.trim()
                  : '#FFFFFF'
              return {
                id: n.id,
                x: typeof n.x === 'number' ? n.x : 100,
                y: typeof n.y === 'number' ? n.y : 100,
                width: typeof n.width === 'number' && Number.isFinite(n.width) ? n.width : style.width,
                height: typeof n.height === 'number' && Number.isFinite(n.height) ? n.height : style.height,
                label: labelHtml,
                shape,
                fillColor: fill,
                format: mergeStickyFormat(parseStickyFormat(n.format), {}),
              }
            })
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
        const notes = Array.isArray(raw?.stickyNotes) ? raw.stickyNotes : []
        setStickyNotes(
          notes
            .filter((n: any) => n && typeof n.id === 'string')
            .map((n: any) => {
              let text = typeof n.text === 'string' ? n.text : ''
              const legacyTitle = typeof n.title === 'string' ? n.title.trim() : ''
              if (!text.trim() && legacyTitle && legacyTitle !== 'Sticky') {
                text = legacyTitle
              }
              text = migratePlainStickyTextToHtml(text)
              const parsedFormat = parseStickyFormat(n.format)
              const rawW = typeof n.width === 'number' && Number.isFinite(n.width) ? n.width : undefined
              const rawH = typeof n.height === 'number' && Number.isFinite(n.height) ? n.height : undefined
              return {
                id: n.id,
                x: typeof n.x === 'number' ? n.x : 120,
                y: typeof n.y === 'number' ? n.y : 120,
                title: '',
                text,
                color: typeof n.color === 'string' ? n.color : STICKY_NOTE_COLORS[0],
                createdBy: typeof n.createdBy === 'string' ? n.createdBy : '',
                format: parsedFormat,
                width: rawW != null && rawW >= STICKY_NOTE_MIN_W ? rawW : undefined,
                height: rawH != null && rawH >= STICKY_NOTE_MIN_H ? rawH : undefined,
              }
            })
        )
        const sections = Array.isArray(raw?.sections) ? raw.sections : []
        setBoardSections(
          sections
            .filter((s: any) => s && typeof s.id === 'string')
            .map((s: any) => ({
              id: s.id,
              x: typeof s.x === 'number' ? s.x : 100,
              y: typeof s.y === 'number' ? s.y : 100,
              width: typeof s.width === 'number' ? Math.max(260, s.width) : 420,
              height: typeof s.height === 'number' ? Math.max(180, s.height) : 260,
              title: typeof s.title === 'string' ? s.title : 'Sektion',
              color: typeof s.color === 'string' ? s.color : '#CBD5E1',
            }))
        )
        const comments = Array.isArray(raw?.comments) ? raw.comments : []
        setBoardComments(
          comments
            .filter((c: any) => c && typeof c.id === 'string')
            .map((c: any) => ({
              id: c.id,
              x: typeof c.x === 'number' ? c.x : 180,
              y: typeof c.y === 'number' ? c.y : 180,
              text: typeof c.text === 'string' ? c.text : '',
              createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
              createdBy: typeof c.createdBy === 'string' ? c.createdBy : currentUsername,
              resolved: Boolean(c.resolved),
              resolvedAt: typeof c.resolvedAt === 'number' ? c.resolvedAt : undefined,
            }))
        )
        const images = Array.isArray(raw?.images) ? raw.images : []
        setBoardImages(
          images
            .filter((im: any) => im && typeof im.id === 'string' && typeof im.src === 'string')
            .map((im: any) => ({
              id: im.id,
              x: typeof im.x === 'number' ? im.x : 120,
              y: typeof im.y === 'number' ? im.y : 120,
              width: typeof im.width === 'number' ? Math.max(40, im.width) : BOARD_IMAGE_DEFAULT_W,
              height: typeof im.height === 'number' ? Math.max(40, im.height) : BOARD_IMAGE_DEFAULT_H,
              src: im.src,
            }))
        )
        const freeTextsRaw = Array.isArray(raw?.freeTexts) ? raw.freeTexts : []
        setBoardFreeTexts(
          freeTextsRaw
            .filter((ft: any) => ft && typeof ft.id === 'string')
            .map((ft: any) => {
              const rawW = typeof ft.width === 'number' && Number.isFinite(ft.width) ? ft.width : FREE_TEXT_DEFAULT_W
              const rawH = typeof ft.height === 'number' && Number.isFinite(ft.height) ? ft.height : FREE_TEXT_DEFAULT_H
              const rawFs =
                typeof ft.fontSizePx === 'number' && Number.isFinite(ft.fontSizePx) ? ft.fontSizePx : FREE_TEXT_FONT_SIZE_DEFAULT
              return {
                id: ft.id,
                x: typeof ft.x === 'number' ? ft.x : 160,
                y: typeof ft.y === 'number' ? ft.y : 160,
                width: Math.max(FREE_TEXT_MIN_W, rawW),
                height: Math.max(FREE_TEXT_MIN_H, rawH),
                text: typeof ft.text === 'string' ? ft.text : '',
                fontSizePx: clampFreeTextFontSizePx(rawFs),
              }
            })
        )
      } catch {
        // ignore load errors and start with empty flowchart
      }
    }
    loadFlowchart()
    return () => {
      mounted = false
    }
  }, [projectId, currentUsername, boardSyncVersion])

  useEffect(() => {
    if (activeWorkspaceTab !== 'board') return
    if (!canEdit) return

    for (const comment of boardComments) {
      if (comment.resolved) continue
      void notifyMentions('comment', comment.id, comment.text || '')
    }
    for (const freeText of boardFreeTexts) {
      void notifyMentions('board', freeText.id, freeText.text || '')
    }
    for (const sticky of stickyNotes) {
      void notifyMentions('board', sticky.id, htmlToPlainText(sticky.text || ''))
    }
    for (const node of flowNodes) {
      void notifyMentions('board', node.id, htmlToPlainText(node.label || ''))
    }
  }, [
    activeWorkspaceTab,
    boardComments,
    boardFreeTexts,
    canEdit,
    flowNodes,
    notifyMentions,
    stickyNotes,
  ])

  const persistFlowchart = useCallback(
    (
      nextNodes: FlowNode[],
      nextEdges: FlowEdge[],
      nextStickyNotes: StickyNote[] = stickyNotes,
      nextSections: BoardSection[] = boardSections,
      nextComments: BoardComment[] = boardComments,
      nextImages: BoardImage[] = boardImages,
      nextFreeTexts: BoardFreeText[] = boardFreeTexts
    ) => {
      if (flowSaveTimer.current) clearTimeout(flowSaveTimer.current)
      flowSaveTimer.current = setTimeout(() => {
        saveProjectToolData(projectId, FLOWCHART_TOOL_SLUG, {
          nodes: nextNodes,
          edges: nextEdges,
          stickyNotes: nextStickyNotes,
          sections: nextSections,
          comments: nextComments,
          images: nextImages,
          freeTexts: nextFreeTexts,
          updatedAt: Date.now(),
        })
          .then(() => {
            void broadcastBoardRefresh()
          })
          .catch(console.error)
      }, 400)
    },
    [projectId, stickyNotes, boardSections, boardComments, boardImages, boardFreeTexts, broadcastBoardRefresh]
  )

  useEffect(() => {
    if (!richToolbarUi) {
      richToolbarTargetRef.current = null
      return
    }
    richToolbarTargetRef.current =
      richToolbarUi.kind === 'sticky'
        ? { kind: 'sticky', id: richToolbarUi.noteId }
        : { kind: 'flow', id: richToolbarUi.nodeId }
  }, [richToolbarUi])

  const registerStickyEditor = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) stickyEditorRefs.current.set(id, el)
    else stickyEditorRefs.current.delete(id)
  }, [])

  const registerFlowNodeEditor = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) flowNodeEditorRefs.current.set(id, el)
    else flowNodeEditorRefs.current.delete(id)
  }, [])

  const commitFlowNodeHtml = useCallback(
    (id: string, html: string) => {
      setFlowNodes(prev => {
        const next = prev.map(n => (n.id === id ? { ...n, label: html } : n))
        persistFlowchart(next, flowEdges, stickyNotes, boardSections, boardComments)
        return next
      })
    },
    [flowEdges, stickyNotes, boardSections, boardComments, persistFlowchart]
  )

  const commitStickyHtml = useCallback(
    (id: string, html: string) => {
      setStickyNotes(prev => {
        const next = prev.map(n => (n.id === id ? { ...n, text: html } : n))
        persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
        return next
      })
    },
    [flowNodes, flowEdges, boardSections, boardComments, persistFlowchart]
  )

  const handleToolbarSetNoteColor = useCallback(
    (c: string) => {
      const t = richToolbarTargetRef.current
      if (!t) return
      if (t.kind === 'sticky') {
        setStickyNotes(prev => {
          const next = prev.map(n => (n.id === t.id ? { ...n, color: c } : n))
          persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
          return next
        })
      } else {
        setFlowNodes(prev => {
          const next = prev.map(n => (n.id === t.id ? { ...n, fillColor: c } : n))
          persistFlowchart(next, flowEdges, stickyNotes, boardSections, boardComments)
          return next
        })
      }
    },
    [flowNodes, flowEdges, stickyNotes, boardSections, boardComments, persistFlowchart]
  )

  const handleToolbarSetFormat = useCallback(
    (patch: Partial<StickyNoteFormat>) => {
      const t = richToolbarTargetRef.current
      if (!t) return
      const el =
        t.kind === 'sticky' ? stickyEditorRefs.current.get(t.id) : flowNodeEditorRefs.current.get(t.id)
      el?.focus()
      if (patch.fontFamily && el) {
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed) {
          applyInlineStyleToSelection(el, { fontFamily: stickyFontStack(patch.fontFamily) })
        }
      }
      if (t.kind === 'sticky') {
        setStickyNotes(prev => {
          const next = prev.map(n => {
            if (n.id !== t.id) return n
            const html = el ? sanitizeStickyHtml(el.innerHTML) : n.text
            return { ...n, format: mergeStickyFormat(n.format, patch), text: html }
          })
          persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
          return next
        })
      } else {
        setFlowNodes(prev => {
          const next = prev.map(n => {
            if (n.id !== t.id) return n
            const html = el ? sanitizeStickyHtml(el.innerHTML) : n.label
            return { ...n, format: mergeStickyFormat(n.format, patch), label: html }
          })
          persistFlowchart(next, flowEdges, stickyNotes, boardSections, boardComments)
          return next
        })
      }
    },
    [flowNodes, flowEdges, stickyNotes, boardSections, boardComments, persistFlowchart]
  )

  const handleToolbarFontSize = useCallback(
    (px: number) => {
      const t = richToolbarTargetRef.current
      if (!t) return
      const el =
        t.kind === 'sticky' ? stickyEditorRefs.current.get(t.id) : flowNodeEditorRefs.current.get(t.id)
      el?.focus()
      if (el) {
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed) {
          applyInlineStyleToSelection(el, { fontSize: `${px}px` })
        }
      }
      if (t.kind === 'sticky') {
        setStickyNotes(prev => {
          const next = prev.map(n => {
            if (n.id !== t.id) return n
            const html = el ? sanitizeStickyHtml(el.innerHTML) : n.text
            return { ...n, format: mergeStickyFormat(n.format, { fontSizePx: px }), text: html }
          })
          persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
          return next
        })
      } else {
        setFlowNodes(prev => {
          const next = prev.map(n => {
            if (n.id !== t.id) return n
            const html = el ? sanitizeStickyHtml(el.innerHTML) : n.label
            return { ...n, format: mergeStickyFormat(n.format, { fontSizePx: px }), label: html }
          })
          persistFlowchart(next, flowEdges, stickyNotes, boardSections, boardComments)
          return next
        })
      }
    },
    [flowNodes, flowEdges, stickyNotes, boardSections, boardComments, persistFlowchart]
  )

  const runStickyRichCommand = useCallback(
    (fn: () => void) => {
      const t = richToolbarTargetRef.current
      if (!t) return
      const el =
        t.kind === 'sticky' ? stickyEditorRefs.current.get(t.id) : flowNodeEditorRefs.current.get(t.id)
      el?.focus()
      window.requestAnimationFrame(() => {
        fn()
        const ed =
          t.kind === 'sticky' ? stickyEditorRefs.current.get(t.id) : flowNodeEditorRefs.current.get(t.id)
        if (ed) {
          const html = sanitizeStickyHtml(ed.innerHTML)
          if (t.kind === 'sticky') {
            setStickyNotes(prev => {
              const next = prev.map(n => (n.id === t.id ? { ...n, text: html } : n))
              persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
              return next
            })
          } else {
            setFlowNodes(prev => {
              const next = prev.map(n => (n.id === t.id ? { ...n, label: html } : n))
              persistFlowchart(next, flowEdges, stickyNotes, boardSections, boardComments)
              return next
            })
          }
        }
        setRichToolbarUi(u => {
          if (!u) return u
          if (u.kind === 'sticky' && t.kind === 'sticky' && u.noteId === t.id) {
            return {
              ...u,
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              strike: document.queryCommandState('strikeThrough'),
            }
          }
          if (u.kind === 'flow' && t.kind === 'flow' && u.nodeId === t.id) {
            return {
              ...u,
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              strike: document.queryCommandState('strikeThrough'),
            }
          }
          return u
        })
      })
    },
    [flowNodes, flowEdges, stickyNotes, boardSections, boardComments, persistFlowchart]
  )

  useEffect(() => {
    const editable = project?.role === 'owner' || project?.role === 'editor'
    if (!editable) {
      setRichToolbarUi(null)
      return
    }
    const measure = () => {
      const ae = document.activeElement as HTMLElement | null
      const stickyId = ae?.getAttribute('data-sticky-editor')
      const flowId = ae?.getAttribute('data-flow-editor')
      const id = stickyId || flowId
      const kind = stickyId ? ('sticky' as const) : flowId ? ('flow' as const) : null
      if (
        !id ||
        !kind ||
        (kind === 'sticky' && !stickyEditorRefs.current.has(id)) ||
        (kind === 'flow' && !flowNodeEditorRefs.current.has(id))
      ) {
        setRichToolbarUi(null)
        return
      }
      const sel = window.getSelection()
      let left = 0
      let top = 0
      let width = 8
      let height = 22
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        const r = range.getBoundingClientRect()
        if (r.width > 1 || r.height > 1) {
          left = r.left
          top = r.top
          width = Math.max(r.width, 8)
          height = Math.max(r.height, 18)
        } else {
          const rects = range.getClientRects()
          if (rects.length > 0) {
            const cr = rects[0]
            left = cr.left
            top = cr.top
            width = Math.max(cr.width, 8)
            height = Math.max(cr.height, 18)
          } else if (ae) {
            const er = ae.getBoundingClientRect()
            left = er.left + 14
            top = er.top + 14
            width = Math.max(er.width - 28, 40)
            height = 22
          }
        }
      } else if (ae) {
        const er = ae.getBoundingClientRect()
        left = er.left + 14
        top = er.top + 14
        width = Math.max(er.width - 28, 40)
        height = 22
      }
      setRichToolbarUi(
        kind === 'sticky'
          ? {
              kind: 'sticky',
              noteId: id,
              rect: { left, top, width, height },
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              strike: document.queryCommandState('strikeThrough'),
            }
          : {
              kind: 'flow',
              nodeId: id,
              rect: { left, top, width, height },
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              strike: document.queryCommandState('strikeThrough'),
            }
      )
    }
    document.addEventListener('selectionchange', measure)
    document.addEventListener('keyup', measure)
    document.addEventListener('mouseup', measure)
    return () => {
      document.removeEventListener('selectionchange', measure)
      document.removeEventListener('keyup', measure)
      document.removeEventListener('mouseup', measure)
    }
  }, [project?.role])

  const persistLayout = useCallback(
    (positions: Record<string, CardPosition>) => {
      if (!project) return
      const norm: Record<string, { x: number; y: number }> = {}
      Object.entries(positions).forEach(([slug, { x, y }]) => {
        norm[slug] = { x: x / 1600, y: y / 900 }
      })
      updateProject(projectId, { ddCanvasLayout: norm })
        .then(() => {
          void broadcastBoardRefresh()
        })
        .catch(console.error)
    },
    [project, projectId, broadcastBoardRefresh]
  )

  const createBoardUndoSnapshot = useCallback((): BoardUndoSnapshot => {
    const safeToolPhases = project?.toolPhases || {}
    return {
      toolIds: [...(project?.toolIds || [])],
      toolPhases: { ...safeToolPhases },
      cardPositions: { ...cardPositions },
      cardZOrder: { ...cardZOrder },
      lockedCardSlugs: [...lockedCardSlugs],
      flowNodes: flowNodes.map(n => ({ ...n })),
      flowEdges: flowEdges.map(e => ({ ...e })),
      stickyNotes: stickyNotes.map(n => ({ ...n })),
      sections: boardSections.map(s => ({ ...s })),
      comments: boardComments.map(c => ({ ...c })),
      images: boardImages.map(i => ({ ...i })),
      freeTexts: boardFreeTexts.map(t => ({ ...t })),
    }
  }, [
    project?.toolIds,
    project?.toolPhases,
    cardPositions,
    cardZOrder,
    lockedCardSlugs,
    flowNodes,
    flowEdges,
    stickyNotes,
    boardSections,
    boardComments,
    boardImages,
    boardFreeTexts,
  ])

  const applyBoardUndoSnapshot = useCallback(
    (snapshot: BoardUndoSnapshot) => {
      const toolSet = new Set(snapshot.toolIds)
      boardUndoIsApplyingRef.current = true
      setProject(prev =>
        prev
          ? {
              ...prev,
              toolIds: [...snapshot.toolIds],
              toolPhases: { ...snapshot.toolPhases },
            }
          : prev
      )
      setCardPositions({ ...snapshot.cardPositions })
      setCardZOrder({ ...snapshot.cardZOrder })
      setLockedCardSlugs(snapshot.lockedCardSlugs.filter(slug => toolSet.has(slug)))
      setFlowNodes(snapshot.flowNodes.map(n => ({ ...n })))
      setFlowEdges(snapshot.flowEdges.map(e => ({ ...e })))
      setStickyNotes(snapshot.stickyNotes.map(n => ({ ...n })))
      setBoardSections(snapshot.sections.map(s => ({ ...s })))
      setBoardComments(snapshot.comments.map(c => ({ ...c })))
      setBoardImages(snapshot.images.map(i => ({ ...i })))
      setBoardFreeTexts(snapshot.freeTexts.map(t => ({ ...t })))
      setSelectedCardSlugs([])
      setSelectedFlowNodeIds([])
      setSelectedFlowNodeId(null)
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedImageIds([])
      setSelectedFreeTextIds([])
      setRichToolbarUi(null)
      setLinkingFromNodeId(null)
      setEdgeDraft(null)
      persistLayout(snapshot.cardPositions)
      persistFlowchart(
        snapshot.flowNodes,
        snapshot.flowEdges,
        snapshot.stickyNotes,
        snapshot.sections,
        snapshot.comments,
        snapshot.images,
        snapshot.freeTexts
      )
      if (!isOffline) {
        updateProject(projectId, {
          toolIds: snapshot.toolIds,
          toolPhases: snapshot.toolPhases,
        }).catch(console.error)
      }
      window.requestAnimationFrame(() => {
        boardUndoIsApplyingRef.current = false
      })
    },
    [isOffline, persistFlowchart, persistLayout, projectId]
  )

  const handleBoardUndo = useCallback(() => {
    if (!canEdit) return
    const previous = boardUndoPastRef.current[boardUndoPastRef.current.length - 1]
    if (!previous) return
    const current = createBoardUndoSnapshot()
    boardUndoPastRef.current = boardUndoPastRef.current.slice(0, -1)
    boardUndoFutureRef.current = [...boardUndoFutureRef.current, cloneBoardUndoSnapshot(current)]
    applyBoardUndoSnapshot(cloneBoardUndoSnapshot(previous))
    boardUndoLastSnapshotRef.current = cloneBoardUndoSnapshot(previous)
  }, [applyBoardUndoSnapshot, canEdit, createBoardUndoSnapshot])

  const handleBoardRedo = useCallback(() => {
    if (!canEdit) return
    const next = boardUndoFutureRef.current[boardUndoFutureRef.current.length - 1]
    if (!next) return
    const current = createBoardUndoSnapshot()
    boardUndoFutureRef.current = boardUndoFutureRef.current.slice(0, -1)
    boardUndoPastRef.current = [...boardUndoPastRef.current, cloneBoardUndoSnapshot(current)]
    applyBoardUndoSnapshot(cloneBoardUndoSnapshot(next))
    boardUndoLastSnapshotRef.current = cloneBoardUndoSnapshot(next)
  }, [applyBoardUndoSnapshot, canEdit, createBoardUndoSnapshot])

  useEffect(() => {
    if (activeWorkspaceTab !== 'board' || !project) return
    const snapshot = createBoardUndoSnapshot()
    const last = boardUndoLastSnapshotRef.current
    if (!boardUndoReadyRef.current || !last) {
      boardUndoReadyRef.current = true
      boardUndoLastSnapshotRef.current = cloneBoardUndoSnapshot(snapshot)
      return
    }
    const changed = JSON.stringify(snapshot) !== JSON.stringify(last)
    if (!changed) return
    if (!boardUndoIsApplyingRef.current) {
      const past = [...boardUndoPastRef.current, cloneBoardUndoSnapshot(last)]
      boardUndoPastRef.current =
        past.length > BOARD_UNDO_LIMIT ? past.slice(past.length - BOARD_UNDO_LIMIT) : past
      boardUndoFutureRef.current = []
    }
    boardUndoLastSnapshotRef.current = cloneBoardUndoSnapshot(snapshot)
  }, [activeWorkspaceTab, project, createBoardUndoSnapshot])

  // ── Canvas event handlers ──────────────────────────────────────────
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setContextMenu(null)
    const target = e.target as HTMLElement
    const isCanvasBg =
      target.classList.contains('canvas-bg') || target === canvasRef.current

    // Klik på selve board-baggrunden: afslut redigering/markering og midlertidige flow-handlinger,
    // så man "lander" på boardet uden at fortsætte det man var i gang med.
    if (isCanvasBg && (e.button === 0 || e.button === 1)) {
      const root = canvasRef.current
      const ae = document.activeElement as HTMLElement | null
      if (root && ae && root.contains(ae) && ae !== root) {
        ae.blur()
      }
      try {
        window.getSelection()?.removeAllRanges()
      } catch {
        /* ignore */
      }
      setRichToolbarUi(null)
      setLinkingFromNodeId(null)
      setEdgeDraft(null)
    }

    setSelectedFlowNodeId(null)
    setSelectedFlowNodeIds([])
    setSelectedFreeTextIds([])
    const middleMousePan = e.button === 1
    const leftMousePan = e.button === 0 && isSpacePressed

    if (middleMousePan || leftMousePan) {
      isPanning.current = true
      setIsPanningActive(true)
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      return
    }

    if (handPanTool && !sectionDrawMode && e.button === 0) {
      const isCanvasBg = target.classList.contains('canvas-bg') || target === canvasRef.current
      if (isCanvasBg) {
        isPanning.current = true
        setIsPanningActive(true)
        lastPanPos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        return
      }
    }

    if (sectionDrawMode && canEdit && e.button === 0) {
      const isCanvasBg = target.classList.contains('canvas-bg') || target === canvasRef.current
      if (isCanvasBg) {
        const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY)
        isSectionPlacementDragging.current = true
        sectionPlacementStartRef.current = { x: worldPoint.x, y: worldPoint.y }
        sectionPlacementEndRef.current = { x: worldPoint.x, y: worldPoint.y }
        setSectionPlacementDraft({
          startX: worldPoint.x,
          startY: worldPoint.y,
          currentX: worldPoint.x,
          currentY: worldPoint.y,
        })
        setSelectedCardSlugs([])
        setSelectedFlowNodeIds([])
        setSelectedStickyNoteIds([])
        setSelectedSectionIds([])
        setSelectedCommentIds([])
        setSelectedImageIds([])
        setSelectedFreeTextIds([])
        setSelectedFlowNodeId(null)
        e.preventDefault()
        return
      }
    }

    // only start panning if clicking the canvas background itself
    if (!target.classList.contains('canvas-bg') && target !== canvasRef.current) return
    if (canEdit && e.button === 0) {
      const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY)
      isMarqueeSelecting.current = true
      marqueeIsAdditiveRef.current = e.metaKey || e.ctrlKey || e.shiftKey
      setMarqueeSelection({
        startX: worldPoint.x,
        startY: worldPoint.y,
        currentX: worldPoint.x,
        currentY: worldPoint.y,
      })
      if (!marqueeIsAdditiveRef.current) {
        setSelectedCardSlugs([])
        setSelectedFlowNodeIds([])
        setSelectedStickyNoteIds([])
        setSelectedSectionIds([])
        setSelectedCommentIds([])
        setSelectedImageIds([])
        setSelectedFreeTextIds([])
      }
      e.preventDefault()
      return
    }
    isPanning.current = true
    setIsPanningActive(true)
    lastPanPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY)
    localCursorPointRef.current = { x: worldPoint.x, y: worldPoint.y, visible: true }
    void broadcastCursor(worldPoint.x, worldPoint.y, true)
    if (currentUserId) maybeSpawnNightCreature(currentUserId, worldPoint.x, worldPoint.y)
    detectOrbitAndCollabUnlocks(liveCursors)
    const isSolo = Object.values(liveCursors).filter(c => c.visible).length === 0
    if (isSolo) {
      const now = Date.now()
      const shake = soloShakeRef.current
      if (!shake || now - shake.updatedAt > 520) {
        soloShakeRef.current = { lastX: worldPoint.x, dx: 0, count: 0, updatedAt: now }
      } else {
        const dx = worldPoint.x - shake.lastX
        let count = shake.count
        if (
          Math.abs(dx) >= SOLO_SHAKE_MIN_DELTA_PX &&
          Math.abs(shake.dx) >= SOLO_SHAKE_MIN_DELTA_PX &&
          Math.sign(dx) !== Math.sign(shake.dx)
        ) {
          count += 1
        }
        soloShakeRef.current = { lastX: worldPoint.x, dx, count, updatedAt: now }
        if (count >= SOLO_SHAKE_SIGN_CHANGES && now >= soloShakeCooldownRef.current) {
          soloShakeCooldownRef.current = now + SOLO_SHAKE_COOLDOWN_MS
          soloShakeRef.current = { lastX: worldPoint.x, dx: 0, count: 0, updatedAt: now }
          triggerSoloSpark(worldPoint.x, worldPoint.y)
        }
      }

      const orbit = soloOrbitRef.current
      if (!orbit || now - orbit.startedAt > SOLO_ORBIT_WINDOW_MS) {
        soloOrbitRef.current = {
          centerX: worldPoint.x,
          centerY: worldPoint.y,
          startedAt: now,
          lastAngle: 0,
          sweep: 0,
        }
      } else {
        const angle = Math.atan2(worldPoint.y - orbit.centerY, worldPoint.x - orbit.centerX)
        let delta = angle - orbit.lastAngle
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        const sweep = orbit.sweep + delta
        soloOrbitRef.current = { ...orbit, lastAngle: angle, sweep }
        if (Math.abs(sweep) >= SOLO_ORBIT_SWEEP) {
          triggerSoloOrbit(orbit.centerX, orbit.centerY)
          soloOrbitRef.current = null
        }
      }
    } else {
      soloShakeRef.current = null
      soloOrbitRef.current = null
    }

    if (sectionResizeRef.current) {
      const r = sectionResizeRef.current
      const wp = getCanvasWorldPoint(e.clientX, e.clientY)
      const dx = wp.x - r.startWorld.x
      const dy = wp.y - r.startWorld.y
      const next = e.shiftKey
        ? applyAspectLockedRectResize(r.edge, r.start, dx, dy, SECTION_MIN_W, SECTION_MIN_H)
        : applySectionResize(r.edge, r.start, dx, dy)
      setBoardSections(prev =>
        prev.map(s =>
          s.id === r.id ? { ...s, x: next.x, y: next.y, width: next.w, height: next.h } : s
        )
      )
      return
    }

    if (stickyResizeRef.current) {
      const r = stickyResizeRef.current
      const wp = getCanvasWorldPoint(e.clientX, e.clientY)
      const dx = wp.x - r.startWorld.x
      const dy = wp.y - r.startWorld.y
      const next = applyStickyResizeWithGrid(r.edge, r.start, dx, dy, GRID_SIZE, e.shiftKey)
      setStickyNotes(prev =>
        prev.map(n =>
          n.id === r.id ? { ...n, x: next.x, y: next.y, width: next.w, height: next.h } : n
        )
      )
      return
    }

    if (flowResizeRef.current) {
      const r = flowResizeRef.current
      const wp = getCanvasWorldPoint(e.clientX, e.clientY)
      const dx = wp.x - r.startWorld.x
      const dy = wp.y - r.startWorld.y
      const next = applyFlowNodeResizeWithGrid(r.edge, r.start, dx, dy, GRID_SIZE, e.shiftKey)
      setFlowNodes(prev =>
        prev.map(n =>
          n.id === r.id ? { ...n, x: next.x, y: next.y, width: next.w, height: next.h } : n
        )
      )
      return
    }

    if (freeTextResizeRef.current) {
      const r = freeTextResizeRef.current
      const wp = getCanvasWorldPoint(e.clientX, e.clientY)
      const dx = wp.x - r.startWorld.x
      const dy = wp.y - r.startWorld.y
      const next = applyFreeTextResizeWithGrid(r.edge, r.start, dx, dy, GRID_SIZE, e.shiftKey)
      setBoardFreeTexts(prev =>
        prev.map(t =>
          t.id === r.id ? { ...t, x: next.x, y: next.y, width: next.w, height: next.h } : t
        )
      )
      return
    }

    if (isSectionPlacementDragging.current) {
      sectionPlacementEndRef.current = { x: worldPoint.x, y: worldPoint.y }
      setSectionPlacementDraft(prev =>
        prev ? { ...prev, currentX: worldPoint.x, currentY: worldPoint.y } : prev
      )
      return
    }

    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x
      const dy = e.clientY - lastPanPos.current.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      lastPanPos.current = { x: e.clientX, y: e.clientY }
    }
    if (isMarqueeSelecting.current) {
      setMarqueeSelection(prev =>
        prev
          ? { ...prev, currentX: worldPoint.x, currentY: worldPoint.y }
          : prev
      )
    }
    if (dragging.current) {
      const ps = cardDragPointerStartRef.current
      if (ps) {
        const dx = e.clientX - ps.x
        const dy = e.clientY - ps.y
        if (dx * dx + dy * dy > 9) cardDragDidMoveRef.current = true
      }
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      const g = cardDragGroupRef.current
      if (g && g.primaryId === dragging.current) {
        const s0 = g.startById[g.primaryId]
        if (s0) {
          const ddx = newPos.x - s0.x
          const ddy = newPos.y - s0.y
          setCardPositions(prev => {
            const next = { ...prev }
            for (const id of g.ids) {
              const init = g.startById[id]
              if (!init) continue
              next[id] = snapPoint(init.x + ddx, init.y + ddy)
            }
            return next
          })
        }
      } else {
        setCardPositions(prev => ({ ...prev, [dragging.current!]: newPos }))
      }
    }
    if (draggingStickyNote.current) {
      const noteId = draggingStickyNote.current
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      const g = stickyDragGroupRef.current
      if (g && g.primaryId === noteId) {
        const s0 = g.startById[noteId]
        const dx = newPos.x - s0.x
        const dy = newPos.y - s0.y
        setStickyNotes(prev =>
          prev.map(note => {
            if (!g.ids.includes(note.id)) return note
            const init = g.startById[note.id]
            if (!init) return note
            return { ...note, ...snapPoint(init.x + dx, init.y + dy) }
          })
        )
      } else {
        setStickyNotes(prev =>
          prev.map(note => (note.id === noteId ? { ...note, x: newPos.x, y: newPos.y } : note))
        )
      }
    }
    if (draggingBoardSection.current) {
      const sectionId = draggingBoardSection.current
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      const payload = sectionDragContentsRef.current
      if (payload) {
        const dx = newPos.x - payload.sectionStart.x
        const dy = newPos.y - payload.sectionStart.y
        setBoardSections(prev =>
          prev.map(section => (section.id === sectionId ? { ...section, x: newPos.x, y: newPos.y } : section))
        )
        if (Object.keys(payload.cards).length > 0) {
          setCardPositions(prev => {
            const next = { ...prev }
            for (const [slug, start] of Object.entries(payload.cards)) {
              const p = snapPoint(start.x + dx, start.y + dy)
              next[slug] = { ...(next[slug] ?? {}), x: p.x, y: p.y }
            }
            return next
          })
        }
        if (Object.keys(payload.flowNodes).length > 0) {
          setFlowNodes(prev =>
            prev.map(node => {
              const start = payload.flowNodes[node.id]
              if (!start) return node
              const p = snapPoint(start.x + dx, start.y + dy)
              return { ...node, x: p.x, y: p.y }
            })
          )
        }
        if (Object.keys(payload.stickyNotes).length > 0) {
          setStickyNotes(prev =>
            prev.map(note => {
              const start = payload.stickyNotes[note.id]
              if (!start) return note
              const p = snapPoint(start.x + dx, start.y + dy)
              return { ...note, x: p.x, y: p.y }
            })
          )
        }
        if (Object.keys(payload.freeTexts).length > 0) {
          setBoardFreeTexts(prev =>
            prev.map(ft => {
              const start = payload.freeTexts[ft.id]
              if (!start) return ft
              const p = snapPoint(start.x + dx, start.y + dy)
              return { ...ft, x: p.x, y: p.y }
            })
          )
        }
        if (Object.keys(payload.comments).length > 0) {
          setBoardComments(prev =>
            prev.map(comment => {
              const start = payload.comments[comment.id]
              if (!start) return comment
              const p = snapPoint(start.x + dx, start.y + dy)
              return { ...comment, x: p.x, y: p.y }
            })
          )
        }
        if (Object.keys(payload.images).length > 0) {
          setBoardImages(prev =>
            prev.map(image => {
              const start = payload.images[image.id]
              if (!start) return image
              const p = snapPoint(start.x + dx, start.y + dy)
              return { ...image, x: p.x, y: p.y }
            })
          )
        }
      } else {
        setBoardSections(prev =>
          prev.map(section => (section.id === sectionId ? { ...section, x: newPos.x, y: newPos.y } : section))
        )
      }
    }
    if (draggingBoardImage.current) {
      const imageId = draggingBoardImage.current
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      const g = imageDragGroupRef.current
      if (g && g.primaryId === imageId) {
        const s0 = g.startById[imageId]
        const dx = newPos.x - s0.x
        const dy = newPos.y - s0.y
        setBoardImages(prev =>
          prev.map(im => {
            if (!g.ids.includes(im.id)) return im
            const init = g.startById[im.id]
            if (!init) return im
            return { ...im, ...snapPoint(init.x + dx, init.y + dy) }
          })
        )
      } else {
        setBoardImages(prev =>
          prev.map(im => (im.id === imageId ? { ...im, x: newPos.x, y: newPos.y } : im))
        )
      }
    }
    if (draggingBoardComment.current) {
      const commentId = draggingBoardComment.current
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      setBoardComments(prev => prev.map(comment => (comment.id === commentId ? { ...comment, x: newPos.x, y: newPos.y } : comment)))
    }
    if (draggingBoardFreeText.current) {
      const ftId = draggingBoardFreeText.current
      const rawPos = { x: worldPoint.x - dragOffset.current.x, y: worldPoint.y - dragOffset.current.y }
      const newPos = snapDragPoint(rawPos.x, rawPos.y)
      const g = freeTextDragGroupRef.current
      if (g && g.primaryId === ftId) {
        const s0 = g.startById[ftId]
        const dx = newPos.x - s0.x
        const dy = newPos.y - s0.y
        setBoardFreeTexts(prev =>
          prev.map(t => {
            if (!g.ids.includes(t.id)) return t
            const init = g.startById[t.id]
            if (!init) return t
            return { ...t, ...snapPoint(init.x + dx, init.y + dy) }
          })
        )
      } else {
        setBoardFreeTexts(prev =>
          prev.map(t => (t.id === ftId ? { ...t, x: newPos.x, y: newPos.y } : t))
        )
      }
    }
    if (draggingFlowNode.current) {
      const nodeId = draggingFlowNode.current
      const rawPos = {
        x: worldPoint.x - dragOffset.current.x,
        y: worldPoint.y - dragOffset.current.y,
      }
      const snapped = snapDragPoint(rawPos.x, rawPos.y)
      const g = flowDragGroupRef.current
      if (g && g.primaryId === nodeId) {
        const s0 = g.startById[nodeId]
        const dx = snapped.x - s0.x
        const dy = snapped.y - s0.y
        setFlowNodes(prev =>
          prev.map(node => {
            if (!g.ids.includes(node.id)) return node
            const init = g.startById[node.id]
            if (!init) return node
            const p = snapPoint(init.x + dx, init.y + dy)
            return { ...node, x: p.x, y: p.y }
          })
        )
      } else {
        setFlowNodes(prev =>
          prev.map(node =>
            node.id === nodeId ? { ...node, x: snapped.x, y: snapped.y } : node
          )
        )
      }
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
    if (isSectionPlacementDragging.current) {
      isSectionPlacementDragging.current = false
      const start = sectionPlacementStartRef.current
      sectionPlacementStartRef.current = null
      setSectionPlacementDraft(null)
      setSectionDrawMode(false)
      const end = e
        ? getCanvasWorldPoint(e.clientX, e.clientY)
        : sectionPlacementEndRef.current
      if (start && canEdit) {
        const minX = Math.min(start.x, end.x)
        const maxX = Math.max(start.x, end.x)
        const minY = Math.min(start.y, end.y)
        const maxY = Math.max(start.y, end.y)
        const w = maxX - minX
        const h = maxY - minY
        const epsilon = 8
        if (w >= epsilon && h >= epsilon) {
          addBoardSection({ x: minX, y: minY, width: w, height: h })
        }
      }
    }
    if (isMarqueeSelecting.current && marqueeSelection) {
      const minX = Math.min(marqueeSelection.startX, marqueeSelection.currentX)
      const maxX = Math.max(marqueeSelection.startX, marqueeSelection.currentX)
      const minY = Math.min(marqueeSelection.startY, marqueeSelection.currentY)
      const maxY = Math.max(marqueeSelection.startY, marqueeSelection.currentY)
      const epsilon = 2
      const selectedCardSlugsFromBox = boardTools
        .map(({ slug }, idx) => ({ slug, idx }))
        .filter(({ slug, idx }) => {
          const cardEl = cardElementRefs.current[slug]
          const pos = cardPositions[slug] || defaultPos(slug, idx)
          if (!cardEl || !pos) return false
          const cardMinX = pos.x
          const cardMinY = pos.y
          const cardMaxX = pos.x + cardEl.offsetWidth
          const cardMaxY = pos.y + cardEl.offsetHeight
          return cardMaxX >= minX && cardMinX <= maxX && cardMaxY >= minY && cardMinY <= maxY
        })
        .map(({ slug }) => slug)
      const selectedFlowNodeIdsFromBox = flowNodes
        .map(node => {
          const dim = getFlowNodeDimensions(node)
          return {
            id: node.id,
            minX: node.x,
            minY: node.y,
            maxX: node.x + dim.width,
            maxY: node.y + dim.height,
          }
        })
        .filter(nodeBox => (
          nodeBox.maxX >= minX &&
          nodeBox.minX <= maxX &&
          nodeBox.maxY >= minY &&
          nodeBox.minY <= maxY
        ))
        .map(nodeBox => nodeBox.id)

      const selectedStickyNoteIdsFromBox = stickyNotes
        .map(note => {
          const { w, h } = getStickyNoteSize(note)
          return {
            id: note.id,
            minX: note.x,
            minY: note.y,
            maxX: note.x + w,
            maxY: note.y + h,
          }
        })
        .filter(box => (
          box.maxX >= minX &&
          box.minX <= maxX &&
          box.maxY >= minY &&
          box.minY <= maxY
        ))
        .map(box => box.id)

      const selectedFreeTextIdsFromBox = boardFreeTexts
        .map(ft => {
          const { w, h } = getFreeTextSize(ft)
          return {
            id: ft.id,
            minX: ft.x,
            minY: ft.y,
            maxX: ft.x + w,
            maxY: ft.y + h,
          }
        })
        .filter(box => (
          box.maxX >= minX &&
          box.minX <= maxX &&
          box.maxY >= minY &&
          box.minY <= maxY
        ))
        .map(box => box.id)

      const selectedCommentIdsFromBox = boardComments
        .filter(c => !c.parentId && !c.resolved)
        .filter(c => (
          c.x + BOARD_COMMENT_PIN_SIZE >= minX &&
          c.x <= maxX &&
          c.y + BOARD_COMMENT_PIN_SIZE >= minY &&
          c.y <= maxY
        ))
        .map(c => c.id)

      if (Math.abs(maxX - minX) < epsilon && Math.abs(maxY - minY) < epsilon) {
        if (!marqueeIsAdditiveRef.current) {
          setSelectedCardSlugs([])
          setSelectedFlowNodeIds([])
          setSelectedStickyNoteIds([])
          setSelectedSectionIds([])
          setSelectedCommentIds([])
          setSelectedImageIds([])
          setSelectedFreeTextIds([])
          setSelectedFlowNodeId(null)
        }
      } else if (marqueeIsAdditiveRef.current) {
        setSelectedCardSlugs(prev => Array.from(new Set([...prev, ...selectedCardSlugsFromBox])))
        setSelectedFlowNodeIds(prev => Array.from(new Set([...prev, ...selectedFlowNodeIdsFromBox])))
        setSelectedStickyNoteIds(prev => Array.from(new Set([...prev, ...selectedStickyNoteIdsFromBox])))
        setSelectedFreeTextIds(prev => Array.from(new Set([...prev, ...selectedFreeTextIdsFromBox])))
        setSelectedCommentIds(prev => Array.from(new Set([...prev, ...selectedCommentIdsFromBox])))
      } else {
        setSelectedCardSlugs(selectedCardSlugsFromBox)
        setSelectedFlowNodeIds(selectedFlowNodeIdsFromBox)
        setSelectedFlowNodeId(selectedFlowNodeIdsFromBox[0] || null)
        setSelectedStickyNoteIds(selectedStickyNoteIdsFromBox)
        setSelectedFreeTextIds(selectedFreeTextIdsFromBox)
        setSelectedCommentIds(selectedCommentIdsFromBox)
      }
    }
    isMarqueeSelecting.current = false
    marqueeIsAdditiveRef.current = false
    setMarqueeSelection(null)
    if (dragging.current) {
      if (cardDragDidMoveRef.current) suppressNextCardClickRef.current = true
      dragging.current = null
      cardDragGroupRef.current = null
      cardDragPointerStartRef.current = null
      cardDragDidMoveRef.current = false
      setCardPositions(prev => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => persistLayout(prev), 800)
        // Immediately broadcast the position change for real-time sync
        void broadcastBoardRefresh()
        return { ...prev }
      })
    }
    if (draggingFlowNode.current) {
      draggingFlowNode.current = null
      flowDragGroupRef.current = null
      persistFlowchart(flowNodes, flowEdges)
    }
    if (draggingStickyNote.current) {
      draggingStickyNote.current = null
      stickyDragGroupRef.current = null
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments)
    }
    if (sectionResizeRef.current) {
      const resizedId = sectionResizeRef.current.id
      sectionResizeRef.current = null
      setBoardSections(prev => {
        const next = prev.map(s => {
          if (s.id !== resizedId) return s
          const pos = snapPoint(s.x, s.y)
          return {
            ...s,
            x: pos.x,
            y: pos.y,
            width: Math.max(SECTION_MIN_W, Math.round(s.width / GRID_SIZE) * GRID_SIZE),
            height: Math.max(SECTION_MIN_H, Math.round(s.height / GRID_SIZE) * GRID_SIZE),
          }
        })
        persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
        return next
      })
    }
    if (stickyResizeRef.current) {
      const resizedId = stickyResizeRef.current.id
      stickyResizeRef.current = null
      setStickyNotes(prev => {
        const next = prev.map(n => {
          if (n.id !== resizedId) return n
          const rawW = typeof n.width === 'number' ? n.width : STICKY_NOTE_SIZE
          const rawH = typeof n.height === 'number' ? n.height : STICKY_NOTE_SIZE
          const w = snapStickyDimensionToGrid(rawW, GRID_SIZE, STICKY_NOTE_MIN_W)
          const h = snapStickyDimensionToGrid(rawH, GRID_SIZE, STICKY_NOTE_MIN_H)
          const pos = snapPoint(n.x, n.y)
          return { ...n, x: pos.x, y: pos.y, width: w, height: h }
        })
        persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
        return next
      })
    }
    if (flowResizeRef.current) {
      const resizedId = flowResizeRef.current.id
      flowResizeRef.current = null
      setFlowNodes(prev => {
        const next = prev.map(n => {
          if (n.id !== resizedId) return n
          const w = snapStickyDimensionToGrid(n.width, GRID_SIZE, FLOW_NODE_MIN_W)
          const h = snapStickyDimensionToGrid(n.height, GRID_SIZE, FLOW_NODE_MIN_H)
          const pos = snapPoint(n.x, n.y)
          return { ...n, x: pos.x, y: pos.y, width: w, height: h }
        })
        persistFlowchart(next, flowEdges)
        return next
      })
    }
    if (freeTextResizeRef.current) {
      const resizedId = freeTextResizeRef.current.id
      freeTextResizeRef.current = null
      setBoardFreeTexts(prev => {
        const next = prev.map(t => {
          if (t.id !== resizedId) return t
          const w = snapStickyDimensionToGrid(t.width, GRID_SIZE, FREE_TEXT_MIN_W)
          const h = snapStickyDimensionToGrid(t.height, GRID_SIZE, FREE_TEXT_MIN_H)
          const pos = snapPoint(t.x, t.y)
          return { ...t, x: pos.x, y: pos.y, width: w, height: h }
        })
        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
        return next
      })
    }
    if (draggingBoardSection.current) {
      const movedCards =
        sectionDragContentsRef.current != null && Object.keys(sectionDragContentsRef.current.cards).length > 0
      draggingBoardSection.current = null
      sectionDragContentsRef.current = null
      setActiveSectionDragId(null)
      if (movedCards) {
        setCardPositions(prev => {
          if (saveTimer.current) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => persistLayout(prev), 800)
          void broadcastBoardRefresh()
          return prev
        })
      }
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, boardFreeTexts)
    }
    if (draggingBoardImage.current) {
      draggingBoardImage.current = null
      imageDragGroupRef.current = null
      setBoardImages(prev => {
        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, prev)
        return prev
      })
    }
    if (draggingBoardComment.current) {
      draggingBoardComment.current = null
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments)
    }
    if (draggingBoardFreeText.current) {
      draggingBoardFreeText.current = null
      freeTextDragGroupRef.current = null
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages)
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
        let nodesForPersist: FlowNode[] = flowNodes
        flushSync(() => {
          setFlowNodes(prevNodes => {
            const fromNode = prevNodes.find(n => n.id === edge.from)
            const toNode = prevNodes.find(n => n.id === edge.to)
            if (!fromNode || !toNode) {
              nodesForPersist = prevNodes
              return prevNodes
            }
            const raw = alignFlowTargetToSource(fromNode, toNode, edge.fromSide!, edge.toSide!)
            const snapped = snapPoint(raw.x, raw.y)
            const next = prevNodes.map(n =>
              n.id === toNode.id ? { ...n, x: snapped.x, y: snapped.y } : n
            )
            nodesForPersist = next
            return next
          })
        })
        setFlowEdges(prev => {
          const exists = prev.some(item => item.from === edge.from && item.to === edge.to)
          const next = exists ? prev : [...prev, edge]
          persistFlowchart(nodesForPersist, next)
          return next
        })
      }
      setEdgeDraft(null)
    }
    clearAlignmentGuides()
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
    if (lockedCardSlugs.includes(slug)) return
    setContextMenu(null)
    setSelectedFlowNodeIds([])
    setSelectedStickyNoteIds([])
    setSelectedSectionIds([])
    setSelectedCommentIds([])
    setSelectedImageIds([])
    setSelectedFreeTextIds([])
    e.stopPropagation()

    const moveSlugs =
      selectedCardSlugs.includes(slug) && selectedCardSlugs.length > 0
        ? selectedCardSlugs.filter(s => !lockedCardSlugs.includes(s))
        : [slug]
    if (moveSlugs.length === 0) return

    const startById: Record<string, { x: number; y: number }> = {}
    for (const id of moveSlugs) {
      const ti = project?.toolIds.indexOf(id) ?? -1
      const iidx = ti >= 0 ? ti : 0
      const p = cardPositions[id] || defaultPos(id, iidx)
      startById[id] = { x: p.x, y: p.y }
    }

    const pos = startById[slug]
    if (!pos) return

    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - pos.x, y: my - pos.y }
    dragging.current = slug
    cardDragGroupRef.current = { ids: moveSlugs, primaryId: slug, startById }
    cardDragPointerStartRef.current = { x: e.clientX, y: e.clientY }
    cardDragDidMoveRef.current = false

    const cardEl = cardElementRefs.current[slug]
    const isWide = isWideBoardPreviewSlug(slug)
    alignmentDragMetaRef.current = {
      w: cardEl?.offsetWidth ?? (isWide ? 980 : 680),
      h: cardEl?.offsetHeight ?? (isWide ? 620 : 400),
      exclude: { cardSlugs: moveSlugs },
    }

    setCardPositions(p => {
      const next = { ...p }
      for (const id of moveSlugs) {
        if (!next[id]) next[id] = startById[id]
      }
      return next
    })
    setCardZOrder(prev => {
      const next = { ...prev }
      let z = nextCardZIndexRef.current
      for (const id of moveSlugs) {
        next[id] = ++z
      }
      nextCardZIndexRef.current = z
      return next
    })
    e.preventDefault()
  }

  const bringCardToFront = (slug: string) => {
    setCardZOrder(prev => ({ ...prev, [slug]: ++nextCardZIndexRef.current }))
  }

  const bringSelectedCardsToFront = () => {
    setCardZOrder(prev => {
      const next = { ...prev }
      let z = nextCardZIndexRef.current
      for (const slug of selectedCardSlugs) {
        next[slug] = ++z
      }
      nextCardZIndexRef.current = z
      return next
    })
  }

  const offsetSelectedCardsBy = (dx: number, dy: number) => {
    bringSelectedCardsToFront()
    setCardPositions(prev => {
      const next = { ...prev }
      for (const slug of selectedCardSlugs) {
        const ti = project?.toolIds.indexOf(slug) ?? -1
        const idx = ti >= 0 ? ti : 0
        const cur = next[slug] || defaultPos(slug, idx)
        next[slug] = { x: cur.x + dx, y: cur.y + dy }
      }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persistLayout(next), 800)
      return next
    })
  }

  const toggleLockSelectedCards = () => {
    const slugs = selectedCardSlugs
    if (slugs.length === 0) return
    const allLocked = slugs.every(s => lockedCardSlugs.includes(s))
    setLockedCardSlugs(prev => {
      const set = new Set(prev)
      if (allLocked) {
        slugs.forEach(s => set.delete(s))
      } else {
        slugs.forEach(s => set.add(s))
      }
      return Array.from(set)
    })
  }

  /** Cmd/Ctrl/Shift + højreklik: udvid markering; ellers behold flere hvis elementet allerede er valgt. */
  const mergeBoardIdSelection = (prev: string[], id: string, additive: boolean) => {
    if (additive) return prev.includes(id) ? prev : [...prev, id]
    return prev.includes(id) ? prev : [id]
  }

  const openBoardShapeContextMenu = (
    e: React.MouseEvent,
    shapeKind: 'flow' | 'sticky' | 'section' | 'comment' | 'image' | 'freeText',
    id: string
  ) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    const additive = e.metaKey || e.ctrlKey || e.shiftKey
    if (!additive) {
      setSelectedCardSlugs([])
      if (shapeKind !== 'flow') {
        setSelectedFlowNodeIds([])
        setSelectedFlowNodeId(null)
      }
      if (shapeKind !== 'sticky') setSelectedStickyNoteIds([])
      if (shapeKind !== 'section') setSelectedSectionIds([])
      if (shapeKind !== 'comment') setSelectedCommentIds([])
      if (shapeKind !== 'image') setSelectedImageIds([])
      if (shapeKind !== 'freeText') setSelectedFreeTextIds([])
    }
    if (shapeKind === 'flow') {
      setSelectedFlowNodeIds(prev => mergeBoardIdSelection(prev, id, additive))
      setSelectedFlowNodeId(id)
    } else if (shapeKind === 'sticky') {
      setSelectedStickyNoteIds(prev => mergeBoardIdSelection(prev, id, additive))
    } else if (shapeKind === 'section') {
      setSelectedSectionIds(prev => mergeBoardIdSelection(prev, id, additive))
    } else if (shapeKind === 'image') {
      setSelectedImageIds(prev => mergeBoardIdSelection(prev, id, additive))
    } else if (shapeKind === 'freeText') {
      setSelectedFreeTextIds(prev => mergeBoardIdSelection(prev, id, additive))
    } else {
      setSelectedCommentIds(prev => mergeBoardIdSelection(prev, id, additive))
    }
    setContextMenu({ type: 'boardShape', x: e.clientX, y: e.clientY, shapeKind, id })
  }

  const toggleCardSelection = (slug: string, additive: boolean) => {
    setSelectedCardSlugs(prev => {
      if (!additive) return [slug]
      if (prev.includes(slug)) return prev.filter(item => item !== slug)
      return [...prev, slug]
    })
  }

  const toggleCardLock = (slug: string) => {
    setLockedCardSlugs(prev => (
      prev.includes(slug) ? prev.filter(item => item !== slug) : [...prev, slug]
    ))
  }

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const waitNextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

  const withExportFriendlyBoardScale = async <T,>(task: () => Promise<T>): Promise<T> => {
    const layer = boardTransformLayerRef.current
    if (!layer) return task()

    const prevTransform = layer.style.transform
    const prevTransition = layer.style.transition

    // Eksport skal ikke afhænge af brugerens aktuelle zoom/pan.
    layer.style.transition = 'none'
    layer.style.transform = 'translate(0px, 0px) scale(1)'
    await waitNextFrame()

    try {
      return await task()
    } finally {
      layer.style.transform = prevTransform
      layer.style.transition = prevTransition
      await waitNextFrame()
    }
  }

  const padCanvas = (
    source: HTMLCanvasElement,
    paddingPx = 36,
    bgColor = '#ffffff'
  ): HTMLCanvasElement => {
    const out = document.createElement('canvas')
    out.width = source.width + paddingPx * 2
    out.height = source.height + paddingPx * 2
    const ctx = out.getContext('2d')
    if (!ctx) return source
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(source, paddingPx, paddingPx)
    return out
  }

  const exportSelectedCards = async (format: 'png' | 'jpg' | 'pdf') => {
    const selected = selectedCardSlugs.filter(slug => cardElementRefs.current[slug])
    if (selected.length === 0) {
      alert('Vælg mindst ét tool card først.')
      return
    }

    try {
      const captures = await withExportFriendlyBoardScale(async () =>
        Promise.all(
          selected.map(async slug => {
            const el = cardElementRefs.current[slug]
            if (!el) return null
            const w = el.scrollWidth
            const h = el.scrollHeight
            // Clone into isolated off-screen container to avoid bleeding from overlapping board elements
            const wrapper = document.createElement('div')
            wrapper.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${w}px;height:${h}px;overflow:visible;background:#ffffff;`
            const clone = el.cloneNode(true) as HTMLElement
            clone.style.position = 'relative'
            clone.style.left = '0'
            clone.style.top = '0'
            clone.style.transform = 'none'
            wrapper.appendChild(clone)
            document.body.appendChild(wrapper)
            try {
              const canvas = await html2canvas(wrapper, {
                backgroundColor: '#ffffff',
                scale: Math.max(2, Math.min(3, window.devicePixelRatio || 1)),
                width: w,
                height: h,
                windowWidth: w,
                windowHeight: h,
              })
              return { slug, canvas: padCanvas(canvas) }
            } finally {
              document.body.removeChild(wrapper)
            }
          })
      )
      )
      const validCaptures = captures.filter(
        (item): item is { slug: string; canvas: HTMLCanvasElement } => item !== null
      )
      if (validCaptures.length === 0) {
        alert('Kunne ikke eksportere de valgte cards.')
        return
      }

      if (format === 'pdf') {
        const first = validCaptures[0]
        const firstOrientation = first.canvas.width >= first.canvas.height ? 'landscape' : 'portrait'
        const pdf = new jsPDF({
          orientation: firstOrientation,
          unit: 'px',
          format: [first.canvas.width, first.canvas.height],
        })
        validCaptures.forEach((item, idx) => {
          const orientation = item.canvas.width >= item.canvas.height ? 'landscape' : 'portrait'
          if (idx > 0) {
            pdf.addPage([item.canvas.width, item.canvas.height], orientation)
          }
          pdf.addImage(
            item.canvas.toDataURL('image/png'),
            'PNG',
            0,
            0,
            item.canvas.width,
            item.canvas.height
          )
        })
        pdf.save(`board-cards-${Date.now()}.pdf`)
        return
      }

      validCaptures.forEach((item, idx) => {
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
        const ext = format === 'jpg' ? 'jpg' : 'png'
        const dataUrl = item.canvas.toDataURL(mime, format === 'jpg' ? 0.92 : undefined)
        downloadDataUrl(dataUrl, `${item.slug}-${idx + 1}.${ext}`)
      })
    } catch (error) {
      console.error('Eksport af cards fejlede:', error)
      alert('Eksport fejlede. Prøv igen.')
    }
  }

  const centerViewAt = (worldX: number, worldY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setPan({
      x: rect.width / 2 - worldX * zoom,
      y: rect.height / 2 - worldY * zoom,
    })
  }

  const addFlowNode = (shape: FlowShape, at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const centerX = at ? at.x : rect ? (rect.width / 2 - pan.x) / zoom : 160
    const centerY = at ? at.y : rect ? (rect.height / 2 - pan.y) / zoom : 160
    const nodeStyle = getFlowNodeStyle(shape)
    const snapped = snapPoint(centerX, centerY)
    const lib = FLOW_SHAPE_LIBRARY.find(s => s.shape === shape)
    const newNode: FlowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: snapped.x - nodeStyle.width / 2,
      y: snapped.y - nodeStyle.height / 2,
      width: nodeStyle.width,
      height: nodeStyle.height,
      label: lib ? migratePlainStickyTextToHtml(lib.label) : migratePlainStickyTextToHtml('Trin'),
      shape,
      fillColor: '#FFFFFF',
      format: { ...DEFAULT_STICKY_NOTE_FORMAT },
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
    const additive = e.metaKey || e.ctrlKey || e.shiftKey
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedImageIds([])
      setSelectedFreeTextIds([])
    }
    const prevF = selectedFlowNodeIds
    const nextFlowSel = !additive
      ? [nodeId]
      : prevF.includes(nodeId)
        ? prevF.filter(id => id !== nodeId)
        : [...prevF, nodeId]
    let moveIds = nextFlowSel.includes(nodeId) ? nextFlowSel : [nodeId]

    const D = BOARD_ALT_DUPLICATE_OFFSET
    let primaryDragId = nodeId
    let dragNode: FlowNode | undefined

    if (e.altKey && moveIds.length > 0) {
      const pairs: { oldId: string; clone: FlowNode }[] = []
      let i = 0
      for (const oldId of moveIds) {
        const n = flowNodes.find(nn => nn.id === oldId)
        if (!n) continue
        pairs.push({
          oldId,
          clone: {
            ...n,
            id: `node-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            x: n.x + D,
            y: n.y + D,
          },
        })
        i++
      }
      if (pairs.length === 0) return
      const idMap = new Map(pairs.map(p => [p.oldId, p.clone.id]))
      const mapped = idMap.get(nodeId)
      if (!mapped) return
      primaryDragId = mapped
      const clones = pairs.map(p => p.clone)
      moveIds = clones.map(c => c.id)
      dragNode = clones.find(c => c.id === primaryDragId)
      setFlowNodes(prev => {
        const next = [...prev, ...clones]
        persistFlowchart(next, flowEdges)
        return next
      })
      setSelectedFlowNodeIds(moveIds)
      setSelectedFlowNodeId(primaryDragId)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const c of clones) startById[c.id] = { x: c.x, y: c.y }
      flowDragGroupRef.current = { ids: moveIds, primaryId: primaryDragId, startById }
    } else {
      setSelectedFlowNodeIds(prev => {
        if (!additive) return [nodeId]
        if (prev.includes(nodeId)) return prev.filter(id => id !== nodeId)
        return [...prev, nodeId]
      })
      setSelectedFlowNodeId(nodeId)
      dragNode = flowNodes.find(n => n.id === nodeId)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const id of moveIds) {
        const n = flowNodes.find(nn => nn.id === id)
        if (n) startById[id] = { x: n.x, y: n.y }
      }
      flowDragGroupRef.current = { ids: moveIds, primaryId: nodeId, startById }
    }

    if (!dragNode) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - dragNode.x, y: my - dragNode.y }
    draggingFlowNode.current = primaryDragId
    const flowDim = getFlowNodeDimensions(dragNode)
    alignmentDragMetaRef.current = {
      w: flowDim.width,
      h: flowDim.height,
      exclude: { flowNodeIds: moveIds },
    }
    e.preventDefault()
  }

  const onFlowNodeCardMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const el = boardPointerTargetElement(e.target)
    // Træk må ikke starte fra tekstfeltet — så kan contenteditable få fokus og man kan skrive.
    // Træk fra tom padding, kant eller footer-område omkring editoren.
    if (
      el &&
      (el.hasAttribute('data-flow-editor') ||
        el.closest('[data-flow-editor]') ||
        el.closest('[data-flow-resize]') ||
        el.closest('button'))
    ) {
      return
    }
    onFlowNodeMouseDown(e, nodeId)
  }

  const runStickyNoteDragStart = (
    noteId: string,
    source: Pick<MouseEvent, 'clientX' | 'clientY' | 'altKey' | 'metaKey' | 'ctrlKey' | 'shiftKey'>
  ) => {
    if (!canEdit) return
    const additive = source.metaKey || source.ctrlKey || source.shiftKey
    selectStickyNote(noteId, additive)
    const prevS = selectedStickyNoteIds
    const nextSel = !additive
      ? [noteId]
      : prevS.includes(noteId)
        ? prevS.filter(id => id !== noteId)
        : [...prevS, noteId]
    let moveIds = nextSel.includes(noteId) ? nextSel : [noteId]

    const D = BOARD_ALT_DUPLICATE_OFFSET
    let primaryDragId = noteId
    let dragNote: StickyNote | undefined

    if (source.altKey && moveIds.length > 0) {
      const pairs: { oldId: string; clone: StickyNote }[] = []
      let i = 0
      for (const oldId of moveIds) {
        const n = stickyNotes.find(nn => nn.id === oldId)
        if (!n) continue
        pairs.push({
          oldId,
          clone: {
            ...n,
            id: `sticky-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            x: n.x + D,
            y: n.y + D,
            text: n.text,
          },
        })
        i++
      }
      if (pairs.length === 0) return
      const idMap = new Map(pairs.map(p => [p.oldId, p.clone.id]))
      const mapped = idMap.get(noteId)
      if (!mapped) return
      primaryDragId = mapped
      const clones = pairs.map(p => p.clone)
      moveIds = clones.map(c => c.id)
      dragNote = clones.find(c => c.id === primaryDragId)
      setStickyNotes(prev => {
        const next = [...prev, ...clones]
        persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
        return next
      })
      setSelectedStickyNoteIds(moveIds)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const c of clones) startById[c.id] = { x: c.x, y: c.y }
      stickyDragGroupRef.current = { ids: moveIds, primaryId: primaryDragId, startById }
    } else {
      setSelectedStickyNoteIds(prev => {
        if (!additive) return [noteId]
        if (prev.includes(noteId)) return prev.filter(id => id !== noteId)
        return [...prev, noteId]
      })
      dragNote = stickyNotes.find(n => n.id === noteId)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const id of moveIds) {
        const n = stickyNotes.find(nn => nn.id === id)
        if (n) startById[id] = { x: n.x, y: n.y }
      }
      stickyDragGroupRef.current = { ids: moveIds, primaryId: noteId, startById }
    }

    if (!dragNote) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (source.clientX - rect.left - pan.x) / zoom
    const my = (source.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - dragNote.x, y: my - dragNote.y }
    draggingStickyNote.current = primaryDragId
    const { w, h } = getStickyNoteSize(dragNote)
    alignmentDragMetaRef.current = {
      w,
      h,
      exclude: { stickyNoteIds: moveIds },
    }
  }

  const onStickyNoteCardMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (!canEdit) return
    const el = boardPointerTargetElement(e.target)
    if (el && (el.closest('button') || el.closest('[data-sticky-resize]'))) {
      return
    }
    const onStickyEditor = Boolean(el?.closest('[data-sticky-editor]'))
    const stickyIsSelected = selectedStickyNoteIds.includes(noteId)

    if (onStickyEditor && stickyIsSelected) {
      e.stopPropagation()
      const startX = e.clientX
      const startY = e.clientY
      const th = STICKY_EDITOR_DRAG_THRESHOLD_PX
      const th2 = th * th
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (dx * dx + dy * dy <= th2) return
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        ev.preventDefault()
        try {
          const ae = document.activeElement as HTMLElement | null
          if (ae && ae.closest('[data-sticky-editor]')) ae.blur()
        } catch {
          /* ignore */
        }
        try {
          window.getSelection()?.removeAllRanges()
        } catch {
          /* ignore */
        }
        runStickyNoteDragStart(noteId, ev)
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      return
    }

    onStickyNoteMouseDown(e, noteId)
  }

  const selectStickyNote = (noteId: string, additive: boolean) => {
    setContextMenu(null)
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedFlowNodeIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedImageIds([])
      setSelectedFreeTextIds([])
    }
    setSelectedStickyNoteIds(prev => {
      if (!additive) return [noteId]
      if (prev.includes(noteId)) return prev.filter(id => id !== noteId)
      return [...prev, noteId]
    })
  }

  const selectFlowNodeForEditor = (nodeId: string, additive: boolean) => {
    setContextMenu(null)
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedImageIds([])
      setSelectedFreeTextIds([])
    }
    setSelectedFlowNodeIds(prev => {
      if (!additive) return [nodeId]
      if (prev.includes(nodeId)) return prev.filter(id => id !== nodeId)
      return [...prev, nodeId]
    })
    setSelectedFlowNodeId(nodeId)
  }

  const onStickyNoteMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    runStickyNoteDragStart(noteId, e)
    e.preventDefault()
  }

  const onStickyResizeMouseDown = (e: React.MouseEvent, noteId: string, edge: SectionResizeEdge) => {
    if (!canEdit) return
    e.stopPropagation()
    e.preventDefault()
    const note = stickyNotes.find(n => n.id === noteId)
    if (!note) return
    const { w, h } = getStickyNoteSize(note)
    const rect = canvasRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - pan.x) / zoom
    const wy = (e.clientY - rect.top - pan.y) / zoom
    stickyResizeRef.current = {
      id: noteId,
      edge,
      startWorld: { x: wx, y: wy },
      start: { x: note.x, y: note.y, w, h },
    }
    setSelectedStickyNoteIds(prev => (prev.includes(noteId) ? prev : [noteId]))
  }

  const onFlowNodeResizeMouseDown = (e: React.MouseEvent, nodeId: string, edge: SectionResizeEdge) => {
    if (!canEdit) return
    e.stopPropagation()
    e.preventDefault()
    const node = flowNodes.find(n => n.id === nodeId)
    if (!node) return
    const dim = getFlowNodeDimensions(node)
    const rect = canvasRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - pan.x) / zoom
    const wy = (e.clientY - rect.top - pan.y) / zoom
    flowResizeRef.current = {
      id: nodeId,
      edge,
      startWorld: { x: wx, y: wy },
      start: { x: node.x, y: node.y, w: dim.width, h: dim.height },
    }
    setSelectedFlowNodeIds(prev => (prev.includes(nodeId) ? prev : [nodeId]))
    setSelectedFlowNodeId(nodeId)
  }

  const onSectionMouseDown = (e: React.MouseEvent, sectionId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    setContextMenu(null)
    setSelectedCardSlugs([])
    setSelectedFlowNodeIds([])
    setSelectedStickyNoteIds([])
    setSelectedCommentIds([])
    setSelectedImageIds([])
    setSelectedFreeTextIds([])
    const base = boardSections.find(s => s.id === sectionId)
    if (!base) return
    const D = BOARD_ALT_DUPLICATE_OFFSET
    let section = base
    let dragSectionId = sectionId
    if (e.altKey) {
      const clone: BoardSection = {
        ...base,
        id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: base.x + D,
        y: base.y + D,
      }
      const next = [...boardSections, clone]
      setBoardSections(next)
      setSelectedSectionIds([clone.id])
      persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
      section = clone
      dragSectionId = clone.id
    } else {
      setSelectedSectionIds([sectionId])
    }
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - section.x, y: my - section.y }
    draggingBoardSection.current = dragSectionId
    sectionDragContentsRef.current = buildSectionDragContents(section)
    alignmentDragMetaRef.current = {
      w: section.width,
      h: section.height,
      exclude: { sectionIds: [dragSectionId] },
    }
    setActiveSectionDragId(dragSectionId)
    e.preventDefault()
  }

  const onSectionResizeMouseDown = (e: React.MouseEvent, sectionId: string, edge: SectionResizeEdge) => {
    if (!canEdit) return
    e.stopPropagation()
    e.preventDefault()
    const section = boardSections.find(s => s.id === sectionId)
    if (!section) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - pan.x) / zoom
    const wy = (e.clientY - rect.top - pan.y) / zoom
    sectionResizeRef.current = {
      id: sectionId,
      edge,
      startWorld: { x: wx, y: wy },
      start: { x: section.x, y: section.y, w: section.width, h: section.height },
    }
    setSelectedSectionIds([sectionId])
  }

  const onCommentMouseDown = (e: React.MouseEvent, commentId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    setContextMenu(null)
    const additive = e.metaKey || e.ctrlKey || e.shiftKey
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedFlowNodeIds([])
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedImageIds([])
      setSelectedFreeTextIds([])
    }
    const base = boardComments.find(c => c.id === commentId)
    if (!base) return
    const D = BOARD_ALT_DUPLICATE_OFFSET
    let comment = base
    let dragCommentId = commentId
    if (e.altKey) {
      const clone: BoardComment = {
        ...base,
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: base.x + D,
        y: base.y + D,
        createdAt: Date.now(),
      }
      const next = [...boardComments, clone]
      setBoardComments(next)
      setSelectedCommentIds([clone.id])
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
      comment = clone
      dragCommentId = clone.id
    } else {
      setSelectedCommentIds(prev => {
        if (!additive) return [commentId]
        return prev.includes(commentId) ? prev : [...prev, commentId]
      })
    }
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - comment.x, y: my - comment.y }
    draggingBoardComment.current = dragCommentId
    alignmentDragMetaRef.current = {
      w: BOARD_COMMENT_PIN_SIZE,
      h: BOARD_COMMENT_PIN_SIZE,
      exclude: { commentIds: [dragCommentId] },
    }
    e.preventDefault()
  }

  const onFreeTextResizeMouseDown = (e: React.MouseEvent, freeTextId: string, edge: SectionResizeEdge) => {
    if (!canEdit) return
    e.stopPropagation()
    e.preventDefault()
    const ft = boardFreeTexts.find(t => t.id === freeTextId)
    if (!ft) return
    const { w, h } = getFreeTextSize(ft)
    const rect = canvasRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - pan.x) / zoom
    const wy = (e.clientY - rect.top - pan.y) / zoom
    freeTextResizeRef.current = {
      id: freeTextId,
      edge,
      startWorld: { x: wx, y: wy },
      start: { x: ft.x, y: ft.y, w, h },
    }
    setSelectedFreeTextIds(prev => (prev.includes(freeTextId) ? prev : [freeTextId]))
  }

  const runFreeTextDragStart = (
    freeTextId: string,
    source: Pick<MouseEvent, 'clientX' | 'clientY' | 'altKey' | 'metaKey' | 'ctrlKey' | 'shiftKey'>
  ) => {
    if (!canEdit) return
    const additive = source.metaKey || source.ctrlKey || source.shiftKey
    setContextMenu(null)
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedFlowNodeIds([])
      setSelectedFlowNodeId(null)
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedImageIds([])
    }
    const prevS = selectedFreeTextIds
    const nextSel = !additive
      ? [freeTextId]
      : prevS.includes(freeTextId)
        ? prevS.filter(id => id !== freeTextId)
        : [...prevS, freeTextId]
    let moveIds = nextSel.includes(freeTextId) ? nextSel : [freeTextId]

    const D = BOARD_ALT_DUPLICATE_OFFSET
    let primaryDragId = freeTextId
    let dragFt: BoardFreeText | undefined

    if (source.altKey && moveIds.length > 0) {
      const pairs: { oldId: string; clone: BoardFreeText }[] = []
      let i = 0
      for (const oldId of moveIds) {
        const n = boardFreeTexts.find(nn => nn.id === oldId)
        if (!n) continue
        pairs.push({
          oldId,
          clone: {
            ...n,
            id: `ftext-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            x: n.x + D,
            y: n.y + D,
          },
        })
        i++
      }
      if (pairs.length === 0) return
      const idMap = new Map(pairs.map(p => [p.oldId, p.clone.id]))
      const mapped = idMap.get(freeTextId)
      if (!mapped) return
      primaryDragId = mapped
      const clones = pairs.map(p => p.clone)
      moveIds = clones.map(c => c.id)
      dragFt = clones.find(c => c.id === primaryDragId)
      setBoardFreeTexts(prev => {
        const next = [...prev, ...clones]
        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
        return next
      })
      setSelectedFreeTextIds(moveIds)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const c of clones) startById[c.id] = { x: c.x, y: c.y }
      freeTextDragGroupRef.current = { ids: moveIds, primaryId: primaryDragId, startById }
    } else {
      setSelectedFreeTextIds(prev => {
        if (!additive) return [freeTextId]
        if (prev.includes(freeTextId)) return prev.filter(id => id !== freeTextId)
        return [...prev, freeTextId]
      })
      dragFt = boardFreeTexts.find(n => n.id === freeTextId)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const id of moveIds) {
        const n = boardFreeTexts.find(nn => nn.id === id)
        if (n) startById[id] = { x: n.x, y: n.y }
      }
      freeTextDragGroupRef.current = { ids: moveIds, primaryId: freeTextId, startById }
    }

    if (!dragFt) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (source.clientX - rect.left - pan.x) / zoom
    const my = (source.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - dragFt.x, y: my - dragFt.y }
    draggingBoardFreeText.current = primaryDragId
    const ftSize = getFreeTextSize(dragFt)
    alignmentDragMetaRef.current = {
      w: ftSize.w,
      h: ftSize.h,
      exclude: { freeTextIds: moveIds },
    }
  }

  const onFreeTextMouseDown = (e: React.MouseEvent, freeTextId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    runFreeTextDragStart(freeTextId, e)
    e.preventDefault()
  }

  /**
   * Som sticky: hele tekstfeltet flyttes efter lille musebevægelse; ellers klik = fokus/markering.
   */
  const onFreeTextCardMouseDown = (e: React.MouseEvent, freeTextId: string) => {
    if (!canEdit) return
    const el = boardPointerTargetElement(e.target)
    if (
      el &&
      (el.tagName === 'SELECT' || el.closest('[data-free-text-resize]') || el.closest('button'))
    ) {
      return
    }

    const onTextarea = el?.tagName === 'TEXTAREA'

    if (onTextarea) {
      e.stopPropagation()
      let dragStarted = false
      const startX = e.clientX
      const startY = e.clientY
      const th = STICKY_EDITOR_DRAG_THRESHOLD_PX
      const th2 = th * th
      const onMove = (ev: PointerEvent) => {
        if (dragStarted) return
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (dx * dx + dy * dy <= th2) return
        dragStarted = true
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        ev.preventDefault()
        try {
          const ae = document.activeElement as HTMLTextAreaElement | null
          if (ae?.tagName === 'TEXTAREA' && ae.dataset.freeTextId === freeTextId) {
            ae.blur()
          }
        } catch {
          /* ignore */
        }
        try {
          window.getSelection()?.removeAllRanges()
        } catch {
          /* ignore */
        }
        runFreeTextDragStart(freeTextId, ev)
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        if (!dragStarted) {
          const additive = e.metaKey || e.ctrlKey || e.shiftKey
          setContextMenu(null)
          if (!additive) {
            setSelectedCardSlugs([])
            setSelectedFlowNodeIds([])
            setSelectedFlowNodeId(null)
            setSelectedStickyNoteIds([])
            setSelectedSectionIds([])
            setSelectedCommentIds([])
            setSelectedImageIds([])
          }
          setSelectedFreeTextIds(prev => {
            if (!additive) return [freeTextId]
            if (prev.includes(freeTextId)) return prev.filter(id => id !== freeTextId)
            return [...prev, freeTextId]
          })
        }
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      return
    }

    onFreeTextMouseDown(e, freeTextId)
  }

  const onBoardImageMouseDown = (e: React.MouseEvent, imageId: string) => {
    if (!canEdit) return
    e.stopPropagation()
    setContextMenu(null)
    const additive = e.metaKey || e.ctrlKey || e.shiftKey
    if (!additive) {
      setSelectedCardSlugs([])
      setSelectedFlowNodeIds([])
      setSelectedFlowNodeId(null)
      setSelectedStickyNoteIds([])
      setSelectedSectionIds([])
      setSelectedCommentIds([])
      setSelectedFreeTextIds([])
    }
    const prevI = selectedImageIds
    const nextSel = !additive
      ? [imageId]
      : prevI.includes(imageId)
        ? prevI.filter(id => id !== imageId)
        : [...prevI, imageId]
    let moveIds = nextSel.includes(imageId) ? nextSel : [imageId]

    const D = BOARD_ALT_DUPLICATE_OFFSET
    let primaryDragId = imageId
    let dragIm: BoardImage | undefined

    if (e.altKey && moveIds.length > 0) {
      const pairs: { oldId: string; clone: BoardImage }[] = []
      let i = 0
      for (const oldId of moveIds) {
        const n = boardImages.find(ii => ii.id === oldId)
        if (!n) continue
        pairs.push({
          oldId,
          clone: {
            ...n,
            id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            x: n.x + D,
            y: n.y + D,
          },
        })
        i++
      }
      if (pairs.length === 0) return
      const idMap = new Map(pairs.map(p => [p.oldId, p.clone.id]))
      const mapped = idMap.get(imageId)
      if (!mapped) return
      primaryDragId = mapped
      const clones = pairs.map(p => p.clone)
      moveIds = clones.map(c => c.id)
      dragIm = clones.find(c => c.id === primaryDragId)
      setBoardImages(prev => {
        const next = [...prev, ...clones]
        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, next)
        return next
      })
      setSelectedImageIds(moveIds)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const c of clones) startById[c.id] = { x: c.x, y: c.y }
      imageDragGroupRef.current = { ids: moveIds, primaryId: primaryDragId, startById }
    } else {
      setSelectedImageIds(prev => {
        if (!additive) return [imageId]
        if (prev.includes(imageId)) return prev.filter(id => id !== imageId)
        return [...prev, imageId]
      })
      dragIm = boardImages.find(ii => ii.id === imageId)
      const startById: Record<string, { x: number; y: number }> = {}
      for (const id of moveIds) {
        const n = boardImages.find(ii => ii.id === id)
        if (n) startById[id] = { x: n.x, y: n.y }
      }
      imageDragGroupRef.current = { ids: moveIds, primaryId: imageId, startById }
    }

    if (!dragIm) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    dragOffset.current = { x: mx - dragIm.x, y: my - dragIm.y }
    draggingBoardImage.current = primaryDragId
    alignmentDragMetaRef.current = {
      w: dragIm.width,
      h: dragIm.height,
      exclude: { imageIds: moveIds },
    }
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
    const fromId = linkingFromNodeId
    let nodesForPersist: FlowNode[] = flowNodes
    let fromSide: FlowConnectorSide = 'bottom'
    let toSide: FlowConnectorSide = 'top'
    let ok = true
    flushSync(() => {
      setFlowNodes(prev => {
        const fromNode = prev.find(n => n.id === fromId)
        const toNode = prev.find(n => n.id === nodeId)
        if (!fromNode || !toNode) {
          ok = false
          nodesForPersist = prev
          return prev
        }
        const dFrom = getFlowNodeDimensions(fromNode)
        const dTo = getFlowNodeDimensions(toNode)
        const fromCenter = { x: fromNode.x + dFrom.width / 2, y: fromNode.y + dFrom.height / 2 }
        const toCenter = { x: toNode.x + dTo.width / 2, y: toNode.y + dTo.height / 2 }
        fromSide = getClosestTargetSide(fromNode, toCenter)
        toSide = getClosestTargetSide(toNode, fromCenter)
        const raw = alignFlowTargetToSource(fromNode, toNode, fromSide, toSide)
        const snapped = snapPoint(raw.x, raw.y)
        const next = prev.map(n => (n.id === nodeId ? { ...n, x: snapped.x, y: snapped.y } : n))
        nodesForPersist = next
        return next
      })
    })
    if (!ok) {
      setLinkingFromNodeId(null)
      return
    }
    const edge: FlowEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: fromId,
      to: nodeId,
      fromSide,
      toSide,
    }
    setFlowEdges(prev => {
      const exists = prev.some(e => e.from === edge.from && e.to === edge.to)
      const next = exists ? prev : [...prev, edge]
      persistFlowchart(nodesForPersist, next)
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
    setSelectedFlowNodeIds(prev => prev.filter(id => id !== nodeId))
    if (hoveredFlowNodeId === nodeId) setHoveredFlowNodeId(null)
  }

  const removeFlowNodesByIds = (nodeIds: string[]) => {
    if (!canEdit || nodeIds.length === 0) return
    const nodeSet = new Set(nodeIds)
    setFlowNodes(prevNodes => {
      const nextNodes = prevNodes.filter(n => !nodeSet.has(n.id))
      setFlowEdges(prevEdges => {
        const nextEdges = prevEdges.filter(e => !nodeSet.has(e.from) && !nodeSet.has(e.to))
        persistFlowchart(nextNodes, nextEdges)
        return nextEdges
      })
      return nextNodes
    })
    setSelectedFlowNodeId(null)
    setSelectedFlowNodeIds(prev => prev.filter(id => !nodeSet.has(id)))
    if (linkingFromNodeId && nodeSet.has(linkingFromNodeId)) setLinkingFromNodeId(null)
    if (hoveredFlowNodeId && nodeSet.has(hoveredFlowNodeId)) setHoveredFlowNodeId(null)
  }

  const addStickyNote = (at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const centerX = at ? at.x : rect ? (rect.width / 2 - pan.x) / zoom : 180
    const centerY = at ? at.y : rect ? (rect.height / 2 - pan.y) / zoom : 180
    const pos = snapPoint(centerX, centerY)
    const note: StickyNote = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: pos.x,
      y: pos.y,
      title: '',
      text: '<br>',
      color: STICKY_NOTE_COLORS[Math.floor(Math.random() * STICKY_NOTE_COLORS.length)],
      createdBy: currentUsername,
      format: { ...DEFAULT_STICKY_NOTE_FORMAT },
    }
    setStickyNotes(prev => {
      const next = [...prev, note]
      persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
      return next
    })
    setSelectedStickyNoteIds([note.id])
  }

  const addStickyNeighbor = (source: StickyNote, dir: 'n' | 's' | 'e' | 'w') => {
    if (project?.role !== 'owner' && project?.role !== 'editor') return
    const fmt = mergeStickyFormat(source.format, {})
    const { w: sw, h: sh } = getStickyNoteSize(source)
    let nx = source.x
    let ny = source.y
    if (dir === 'e') nx += sw + STICKY_CLONE_GAP
    if (dir === 'w') nx -= sw + STICKY_CLONE_GAP
    if (dir === 's') ny += sh + STICKY_CLONE_GAP
    if (dir === 'n') ny -= sh + STICKY_CLONE_GAP
    const pos = snapPoint(nx, ny)
    const note: StickyNote = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: pos.x,
      y: pos.y,
      title: '',
      text: '<br>',
      color: source.color,
      createdBy: currentUsername,
      format: { ...fmt },
      width: sw,
      height: sh,
    }
    setStickyNotes(prev => {
      const next = [...prev, note]
      persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
      return next
    })
    setSelectedStickyNoteIds([note.id])
  }

  const getSelectionWorldBounds = useCallback((): WorldBounds | null => {
    let bounds: WorldBounds | null = null
    const add = (b: WorldBounds) => {
      bounds = unionWorldBounds(bounds, b)
    }
    const toolIds = project?.toolIds ?? []
    selectedCardSlugs.forEach(slug => {
      const idx = toolIds.indexOf(slug)
      const pos = cardPositions[slug] || defaultPos(slug, idx >= 0 ? idx : 0)
      const cardEl = cardElementRefs.current[slug]
      const isWide = isWideBoardPreviewSlug(slug)
      const w = cardEl?.offsetWidth ?? (isWide ? 980 : 680)
      const h = cardEl?.offsetHeight ?? (isWide ? 620 : 400)
      add(worldBoundsFromRect(pos.x, pos.y, w, h))
    })
    selectedFlowNodeIds.forEach(id => {
      const node = flowNodes.find(n => n.id === id)
      if (!node) return
      const dim = getFlowNodeDimensions(node)
      add(worldBoundsFromRect(node.x, node.y, dim.width, dim.height))
    })
    selectedStickyNoteIds.forEach(id => {
      const note = stickyNotes.find(n => n.id === id)
      if (!note) return
      const { w, h } = getStickyNoteSize(note)
      add(worldBoundsFromRect(note.x, note.y, w, h))
    })
    selectedFreeTextIds.forEach(id => {
      const ft = boardFreeTexts.find(t => t.id === id)
      if (!ft) return
      const { w, h } = getFreeTextSize(ft)
      add(worldBoundsFromRect(ft.x, ft.y, w, h))
    })
    selectedCommentIds.forEach(id => {
      const comment = boardComments.find(c => c.id === id)
      if (!comment) return
      add(worldBoundsFromRect(comment.x, comment.y, BOARD_COMMENT_PIN_SIZE, BOARD_COMMENT_PIN_SIZE))
    })
    selectedImageIds.forEach(id => {
      const image = boardImages.find(im => im.id === id)
      if (!image) return
      add(worldBoundsFromRect(image.x, image.y, image.width, image.height))
    })
    return bounds
  }, [
    project?.toolIds,
    selectedCardSlugs,
    selectedFlowNodeIds,
    selectedStickyNoteIds,
    selectedFreeTextIds,
    selectedCommentIds,
    selectedImageIds,
    cardPositions,
    defaultPos,
    flowNodes,
    stickyNotes,
    boardFreeTexts,
    boardComments,
    boardImages,
  ])

  const buildSectionDragContents = useCallback((section: BoardSection): SectionDragContents => {
    const box = worldBoundsForBoardSection(section)
    const payload: SectionDragContents = {
      sectionStart: { x: section.x, y: section.y },
      cards: {},
      flowNodes: {},
      stickyNotes: {},
      comments: {},
      freeTexts: {},
      images: {},
    }
    const toolIds = project?.toolIds ?? []
    toolIds.forEach((slug, idx) => {
      if (BOARD_EXCLUDED_TOOL_SLUGS.has(slug)) return
      const pos = cardPositions[slug] || defaultPos(slug, idx)
      const cardEl = cardElementRefs.current[slug]
      const isWide = isWideBoardPreviewSlug(slug)
      const w = cardEl?.offsetWidth ?? (isWide ? 980 : 680)
      const h = cardEl?.offsetHeight ?? (isWide ? 620 : 400)
      const cardBox = worldBoundsFromRect(pos.x, pos.y, w, h)
      if (worldBoundsIntersect(box, cardBox)) {
        payload.cards[slug] = { x: pos.x, y: pos.y }
      }
    })
    flowNodes.forEach(node => {
      const dim = getFlowNodeDimensions(node)
      const nodeBox = worldBoundsFromRect(node.x, node.y, dim.width, dim.height)
      if (worldBoundsIntersect(box, nodeBox)) {
        payload.flowNodes[node.id] = { x: node.x, y: node.y }
      }
    })
    stickyNotes.forEach(note => {
      const { w, h } = getStickyNoteSize(note)
      const noteBox = worldBoundsFromRect(note.x, note.y, w, h)
      if (worldBoundsIntersect(box, noteBox)) {
        payload.stickyNotes[note.id] = { x: note.x, y: note.y }
      }
    })
    boardFreeTexts.forEach(ft => {
      const { w, h } = getFreeTextSize(ft)
      const ftBox = worldBoundsFromRect(ft.x, ft.y, w, h)
      if (worldBoundsIntersect(box, ftBox)) {
        payload.freeTexts[ft.id] = { x: ft.x, y: ft.y }
      }
    })
    boardComments
      .filter(c => !c.parentId && !c.resolved)
      .forEach(comment => {
        const commentBox = worldBoundsFromRect(
          comment.x,
          comment.y,
          BOARD_COMMENT_PIN_SIZE,
          BOARD_COMMENT_PIN_SIZE
        )
        if (worldBoundsIntersect(box, commentBox)) {
          payload.comments[comment.id] = { x: comment.x, y: comment.y }
        }
      })
    boardImages.forEach(image => {
      const imageBox = worldBoundsFromRect(image.x, image.y, image.width, image.height)
      if (worldBoundsIntersect(box, imageBox)) {
        payload.images[image.id] = { x: image.x, y: image.y }
      }
    })
    return payload
  }, [project?.toolIds, cardPositions, defaultPos, flowNodes, stickyNotes, boardFreeTexts, boardComments, boardImages])

  const getSectionContentUnionBounds = useCallback(
    (section: BoardSection): WorldBounds | null => {
      const box = worldBoundsForBoardSection(section)
      let bounds: WorldBounds | null = null
      const add = (b: WorldBounds) => {
        bounds = unionWorldBounds(bounds, b)
      }
      const toolIds = project?.toolIds ?? []
      toolIds.forEach((slug, idx) => {
        if (BOARD_EXCLUDED_TOOL_SLUGS.has(slug)) return
        const pos = cardPositions[slug] || defaultPos(slug, idx)
        const cardEl = cardElementRefs.current[slug]
        const isWide = isWideBoardPreviewSlug(slug)
        const w = cardEl?.offsetWidth ?? (isWide ? 980 : 680)
        const h = cardEl?.offsetHeight ?? (isWide ? 620 : 400)
        const cardBox = worldBoundsFromRect(pos.x, pos.y, w, h)
        if (worldBoundsIntersect(box, cardBox)) add(cardBox)
      })
      flowNodes.forEach(node => {
        const dim = getFlowNodeDimensions(node)
        const nodeBox = worldBoundsFromRect(node.x, node.y, dim.width, dim.height)
        if (worldBoundsIntersect(box, nodeBox)) add(nodeBox)
      })
      stickyNotes.forEach(note => {
        const { w, h } = getStickyNoteSize(note)
        const noteBox = worldBoundsFromRect(note.x, note.y, w, h)
        if (worldBoundsIntersect(box, noteBox)) add(noteBox)
      })
      boardFreeTexts.forEach(ft => {
        const { w, h } = getFreeTextSize(ft)
        const ftBox = worldBoundsFromRect(ft.x, ft.y, w, h)
        if (worldBoundsIntersect(box, ftBox)) add(ftBox)
      })
      boardComments
        .filter(c => !c.parentId && !c.resolved)
        .forEach(comment => {
          const commentBox = worldBoundsFromRect(
            comment.x,
            comment.y,
            BOARD_COMMENT_PIN_SIZE,
            BOARD_COMMENT_PIN_SIZE
          )
          if (worldBoundsIntersect(box, commentBox)) add(commentBox)
        })
      boardImages.forEach(image => {
        const imageBox = worldBoundsFromRect(image.x, image.y, image.width, image.height)
        if (worldBoundsIntersect(box, imageBox)) add(imageBox)
      })
      return bounds
    },
    [project?.toolIds, cardPositions, defaultPos, flowNodes, stickyNotes, boardFreeTexts, boardComments, boardImages]
  )

  const getSectionContentZFloor = useCallback(
    (bounds: WorldBounds): number | null => {
      let floor: number | null = null
      boardSections.forEach((section, sIdx) => {
        const sectionBox = worldBoundsForBoardSection(section)
        if (!worldBoundsIntersect(sectionBox, bounds)) return
        const contentZ = getBoardSectionZIndex(sIdx) + BOARD_SECTION_CONTENT_Z_OFFSET
        floor = floor == null ? contentZ : Math.max(floor, contentZ)
      })
      return floor
    },
    [boardSections]
  )

  const addBoardSection = (
    at?: { x: number; y: number } | { x: number; y: number; width: number; height: number }
  ) => {
    if (!canEdit) return
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const fallbackX = canvasRect ? (canvasRect.width / 2 - pan.x) / zoom : 220
    const fallbackY = canvasRect ? (canvasRect.height / 2 - pan.y) / zoom : 220

    const selectionBounds = getSelectionWorldBounds()
    let finalBounds: WorldBounds | null = null
    if (at && 'width' in at && 'height' in at) {
      finalBounds = worldBoundsFromRect(at.x, at.y, at.width, at.height)
      if (selectionBounds) {
        finalBounds = unionWorldBounds(finalBounds, padWorldBounds(selectionBounds, SECTION_FRAME_PADDING))
      }
    } else if (selectionBounds) {
      finalBounds = padWorldBounds(selectionBounds, SECTION_FRAME_PADDING)
    }

    if (finalBounds) {
      const pos = snapPoint(finalBounds.minX, finalBounds.minY)
      let w = Math.max(SECTION_MIN_W, finalBounds.maxX - finalBounds.minX)
      let h = Math.max(SECTION_MIN_H, finalBounds.maxY - finalBounds.minY)
      if (snapToGrid) {
        w = Math.max(SECTION_MIN_W, Math.round(w / GRID_SIZE) * GRID_SIZE)
        h = Math.max(SECTION_MIN_H, Math.round(h / GRID_SIZE) * GRID_SIZE)
      }
      const section: BoardSection = {
        id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
        width: w,
        height: h,
        title: 'Sektion',
        color: '#CBD5E1',
      }
      setBoardSections(prev => {
        const next = [...prev, section]
        persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
        return next
      })
      setSelectedSectionIds([section.id])
      return
    }

    const originX = at?.x ?? fallbackX
    const originY = at?.y ?? fallbackY
    const pos = snapPoint(originX, originY)
    const section: BoardSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: pos.x,
      y: pos.y,
      width: 420,
      height: 260,
      title: 'Sektion',
      color: '#CBD5E1',
    }
    setBoardSections(prev => {
      const next = [...prev, section]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
      return next
    })
    setSelectedSectionIds([section.id])
  }

  const addBoardComment = (at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const centerX = at ? at.x : rect ? (rect.width / 2 - pan.x) / zoom : 240
    const centerY = at ? at.y : rect ? (rect.height / 2 - pan.y) / zoom : 240
    const pos = snapPoint(centerX, centerY)
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newComment: BoardComment = {
      id,
      x: pos.x,
      y: pos.y,
      text: '',
      createdAt: Date.now(),
      createdBy: currentUsername || 'Bruger',
    }
    const next = [...boardComments, newComment]
    setBoardComments(next)
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
  }

  const addBoardCommentReply = useCallback((parentComment: BoardComment) => {
    if (!canEdit) return
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newReply: BoardComment = {
      id,
      x: parentComment.x,
      y: parentComment.y + 150,
      text: '',
      createdAt: Date.now(),
      createdBy: currentUsername || 'Bruger',
      parentId: parentComment.id,
    }
    const next = [...boardComments, newReply]
    setBoardComments(next)
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
  }, [canEdit, currentUsername, boardComments, flowNodes, flowEdges, stickyNotes, boardSections, persistFlowchart])

  const addPanelCommentReply = useCallback((parentId: string, text: string) => {
    if (!canEdit || !text.trim()) return
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const parentComment = boardComments.find(c => c.id === parentId)
    const newReply: BoardComment = {
      id,
      x: parentComment?.x ?? 0,
      y: (parentComment?.y ?? 0) + 150,
      text: text.trim(),
      createdAt: Date.now(),
      createdBy: currentUsername || 'Bruger',
      parentId,
    }
    const next = [...boardComments, newReply]
    setBoardComments(next)
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
  }, [canEdit, currentUsername, boardComments, flowNodes, flowEdges, stickyNotes, boardSections, persistFlowchart])

  const renderBoardCommentReplies = (parentComment: BoardComment): React.ReactElement[] => {
    const replies = boardComments.filter(comment => comment.parentId === parentComment.id && !comment.resolved)
    
    if (replies.length === 0) return []
    
    return [
      <div key={`thread-${parentComment.id}`} style={{ position: 'relative' }}>
        {/* Connection line from parent to first reply */}
        <div
          style={{
            position: 'absolute',
            left: parentComment.x + 42, // Center of parent avatar
            top: parentComment.y + 60, // Bottom of parent card
            width: 2,
            height: 20,
            background: '#E5E7EB',
            zIndex: 1,
          }}
        />
        
        {/* Horizontal line to replies */}
        <div
          style={{
            position: 'absolute',
            left: parentComment.x + 42,
            top: parentComment.y + 80,
            width: 30,
            height: 2,
            background: '#E5E7EB',
            zIndex: 1,
          }}
        />
        
        {/* Reply thread */}
        <div style={{ position: 'absolute', left: parentComment.x + 70, top: parentComment.y + 85 }}>
          {replies.map((reply, index) => {
            const isSelected = selectedCommentIds.includes(reply.id)
            const replyInitial = (reply.createdBy || '?').trim().charAt(0).toUpperCase()
            const createdAtLabel = new Date(reply.createdAt || Date.now()).toLocaleTimeString('da-DK', {
              hour: '2-digit',
              minute: '2-digit',
            })
            
            const nestedReplies = boardComments.filter(c => c.parentId === reply.id && !c.resolved)
            
            return (
              <div key={reply.id} style={{ marginBottom: 12, position: 'relative' }}>
                {/* Connection line for this reply */}
                {index > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -28,
                      top: -12,
                      width: 2,
                      height: 24,
                      background: '#E5E7EB',
                      zIndex: 1,
                    }}
                  />
                )}
                
                {/* Reply card - compact FigJam style */}
                <div
                  onContextMenu={e => {
                    const t = e.target as HTMLElement
                    if (t.tagName === 'TEXTAREA') return
                    openBoardShapeContextMenu(e, 'comment', reply.id)
                  }}
                  style={{
                    width: 280,
                    borderRadius: 12,
                    border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(37,99,235,0.16), 0 8px 20px rgba(15,23,42,0.12)'
                      : '0 4px 12px rgba(15,23,42,0.08)',
                    overflow: 'hidden',
                    zIndex: 2,
                  }}
                >
                  {/* Reply header */}
                  <div
                    onMouseDown={e => onCommentMouseDown(e, reply.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      cursor: canEdit ? 'grab' : 'default',
                      userSelect: 'none',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        background: '#6B7280',
                        color: '#FFFFFF',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {replyInitial}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#374151',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {reply.createdBy}
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                      {createdAtLabel}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          setCommentResolved(reply.id, true)
                        }}
                        style={{
                          padding: '2px 6px',
                          fontSize: 9,
                          fontWeight: 600,
                          background: '#F3F4F6',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Løst
                      </button>
                    )}
                  </div>
                  
                  {/* Reply content */}
                  <div style={{ padding: '8px 12px' }}>
                    <textarea
                      value={reply.text}
                      onMouseDown={e => e.stopPropagation()}
                      onChange={e => {
                        const nextText = e.target.value
                        setBoardComments(prev => {
                          const next = prev.map(item => (item.id === reply.id ? { ...item, text: nextText } : item))
                          persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                          return next
                        })
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      disabled={!canEdit}
                      placeholder="Skriv svar..."
                      style={{
                        width: '100%',
                        minHeight: 60,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #E5E7EB',
                        background: '#FAFAFA',
                        color: '#374151',
                        resize: 'vertical',
                        outline: 'none',
                        fontSize: 11,
                        lineHeight: 1.4,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  
                  {/* Reply actions */}
                  {canEdit && (
                    <div style={{ padding: '0 12px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          addBoardCommentReply(reply)
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 10,
                          fontWeight: 600,
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Svar
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Nested replies */}
                {nestedReplies.length > 0 && (
                  <div style={{ marginLeft: 20, marginTop: 8 }}>
                    {/* Connection line to nested replies */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: 40,
                        width: 2,
                        height: 20,
                        background: '#E5E7EB',
                        zIndex: 1,
                      }}
                    />
                    {renderBoardCommentReplies(reply)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    ]
  }

  const addBoardFreeText = (at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const centerX = at ? at.x : rect ? (rect.width / 2 - pan.x) / zoom : 240
    const centerY = at ? at.y : rect ? (rect.height / 2 - pan.y) / zoom : 240
    const pos = snapPoint(centerX - FREE_TEXT_DEFAULT_W / 2, centerY - FREE_TEXT_DEFAULT_H / 2)
    const item: BoardFreeText = {
      id: `ftext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: pos.x,
      y: pos.y,
      width: FREE_TEXT_DEFAULT_W,
      height: FREE_TEXT_DEFAULT_H,
      text: '',
      fontSizePx: FREE_TEXT_FONT_SIZE_DEFAULT,
    }
    setBoardFreeTexts(prev => {
      const next = [...prev, item]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
      return next
    })
    setSelectedFreeTextIds([item.id])
    setSelectedCardSlugs([])
    setSelectedFlowNodeIds([])
    setSelectedFlowNodeId(null)
    setSelectedStickyNoteIds([])
    setSelectedSectionIds([])
    setSelectedCommentIds([])
    setSelectedImageIds([])
  }

  const removeStickyNotesByIds = (ids: string[]) => {
    if (!canEdit || ids.length === 0) return
    const idSet = new Set(ids)
    setStickyNotes(prev => {
      const next = prev.filter(item => !idSet.has(item.id))
      persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
      return next
    })
    setSelectedStickyNoteIds(prev => prev.filter(id => !idSet.has(id)))
  }

  const removeSectionsByIds = (ids: string[]) => {
    if (!canEdit || ids.length === 0) return
    const idSet = new Set(ids)
    setBoardSections(prev => {
      const next = prev.filter(item => !idSet.has(item.id))
      persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
      return next
    })
    setSelectedSectionIds(prev => prev.filter(id => !idSet.has(id)))
  }

  const removeCommentsByIds = (ids: string[]) => {
    if (!canEdit || ids.length === 0) return
    const idSet = new Set(ids)
    setBoardComments(prev => {
      const next = prev.filter(item => !idSet.has(item.id))
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
      return next
    })
    setSelectedCommentIds(prev => prev.filter(id => !idSet.has(id)))
  }

  const removeFreeTextsByIds = (ids: string[]) => {
    if (!canEdit || ids.length === 0) return
    const idSet = new Set(ids)
    setBoardFreeTexts(prev => {
      const next = prev.filter(item => !idSet.has(item.id))
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
      return next
    })
    setSelectedFreeTextIds(prev => prev.filter(id => !idSet.has(id)))
  }

  /** Tomt tekstfelt fjernes når fokus forlader det (fx klik væk), undtagen under træk/resize. */
  const scheduleRemoveEmptyFreeTextOnBlur = (id: string) => {
    if (!canEdit) return
    window.setTimeout(() => {
      if (draggingBoardFreeText.current === id) return
      if (freeTextResizeRef.current?.id === id) return
      setBoardFreeTexts(prev => {
        const item = prev.find(x => x.id === id)
        if (!item || item.text.trim() !== '') return prev
        const next = prev.filter(x => x.id !== id)
        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
        queueMicrotask(() => setSelectedFreeTextIds(sel => sel.filter(x => x !== id)))
        return next
      })
    }, 0)
  }

  const setCommentResolved = (commentId: string, resolved: boolean) => {
    if (!canEdit) return
    const targetComment = boardComments.find(item => item.id === commentId) || null
    let updated = false
    setBoardComments(prev => {
      const next = prev.map(item => {
        if (item.id !== commentId) return item
        updated = true
        return {
          ...item,
          resolved,
          resolvedAt: resolved ? Date.now() : undefined,
        }
      })
      if (updated) persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
      return next
    })
    if (resolved) setSelectedCommentIds(prev => prev.filter(id => id !== commentId))
    if (resolved && targetComment && shouldTriggerFridayCelebration()) {
      const now = Date.now()
      const id = `celebrate-${now}-${Math.random().toString(36).slice(2, 7)}`
      setFridayCelebrationEffects(prev => [
        ...prev,
        { id, x: targetComment.x + BOARD_COMMENT_CARD_WIDTH / 2, y: targetComment.y + 16, createdAt: now },
      ])
    }
  }

  const removeBoardImagesByIds = (ids: string[]) => {
    if (!canEdit || ids.length === 0) return
    const idSet = new Set(ids)
    setBoardImages(prev => {
      const next = prev.filter(item => !idSet.has(item.id))
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, next)
      return next
    })
    setSelectedImageIds(prev => prev.filter(id => !idSet.has(id)))
  }

  const bringSelectedSectionsToFront = () => {
    if (!canEdit || selectedSectionIds.length === 0) return
    const sel = new Set(selectedSectionIds)
    setBoardSections(prev => {
      const rest = prev.filter(s => !sel.has(s.id))
      const moved = prev.filter(s => sel.has(s.id))
      const next = [...rest, ...moved]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
      return next
    })
  }

  const duplicateSelectedSections = () => {
    if (!canEdit || selectedSectionIds.length === 0) return
    const D = 28
    const sel = new Set(selectedSectionIds)
    const clones: BoardSection[] = boardSections
      .filter(s => sel.has(s.id))
      .map((s, i) => ({
        ...s,
        id: `section-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: s.x + D,
        y: s.y + D,
      }))
    if (clones.length === 0) return
    const next = [...boardSections, ...clones]
    setBoardSections(next)
    setSelectedSectionIds(clones.map(c => c.id))
    persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
  }

  const exportDomElements = async (
    elements: Array<{ el: HTMLElement | null; fileBase: string }>,
    format: 'png' | 'jpg' | 'pdf'
  ) => {
    const valid = elements.filter((x): x is { el: HTMLElement; fileBase: string } => Boolean(x.el))
    if (valid.length === 0) {
      alert('Kunne ikke finde det valgte til eksport.')
      return
    }
    try {
      const captures = await withExportFriendlyBoardScale(async () =>
        Promise.all(
          valid.map(async ({ el, fileBase }) => {
            const canvas = await html2canvas(el, {
              backgroundColor: '#ffffff',
              scale: Math.max(2, Math.min(3, window.devicePixelRatio || 1)),
            })
            return { fileBase, canvas: padCanvas(canvas) }
          })
        )
      )
      if (format === 'pdf') {
        const first = captures[0]
        const firstOrientation = first.canvas.width >= first.canvas.height ? 'landscape' : 'portrait'
        const pdf = new jsPDF({
          orientation: firstOrientation,
          unit: 'px',
          format: [first.canvas.width, first.canvas.height],
        })
        captures.forEach((item, idx) => {
          const orientation = item.canvas.width >= item.canvas.height ? 'landscape' : 'portrait'
          if (idx > 0) {
            pdf.addPage([item.canvas.width, item.canvas.height], orientation)
          }
          pdf.addImage(
            item.canvas.toDataURL('image/png'),
            'PNG',
            0,
            0,
            item.canvas.width,
            item.canvas.height
          )
        })
        pdf.save(`board-eksport-${Date.now()}.pdf`)
        return
      }
      captures.forEach((item, idx) => {
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
        const ext = format === 'jpg' ? 'jpg' : 'png'
        const dataUrl = item.canvas.toDataURL(mime, format === 'jpg' ? 0.92 : undefined)
        downloadDataUrl(dataUrl, `${item.fileBase}-${idx + 1}.${ext}`)
      })
    } catch (e) {
      console.error('Eksport fejlede:', e)
      alert('Eksport fejlede. Prøv igen.')
    }
  }

  const exportSelectedSectionsAs = async (format: 'png' | 'jpg' | 'pdf') => {
    if (selectedSectionIds.length === 0) return
    await exportDomElements(
      selectedSectionIds.map(id => ({
        el: sectionExportRefs.current[id],
        fileBase: `sektion-${id.slice(0, 8)}`,
      })),
      format
    )
  }

  const bringSelectedBoardImagesToFront = () => {
    if (!canEdit || selectedImageIds.length === 0) return
    const sel = new Set(selectedImageIds)
    setBoardImages(prev => {
      const rest = prev.filter(im => !sel.has(im.id))
      const moved = prev.filter(im => sel.has(im.id))
      const next = [...rest, ...moved]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, next)
      return next
    })
  }

  const duplicateSelectedBoardImages = () => {
    if (!canEdit || selectedImageIds.length === 0) return
    const D = 28
    const sel = new Set(selectedImageIds)
    const clones: BoardImage[] = boardImages
      .filter(im => sel.has(im.id))
      .map((im, i) => ({
        ...im,
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: im.x + D,
        y: im.y + D,
      }))
    if (clones.length === 0) return
    const next = [...boardImages, ...clones]
    setBoardImages(next)
    setSelectedImageIds(clones.map(c => c.id))
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, next)
  }

  const exportSelectedBoardImagesAs = async (format: 'png' | 'jpg' | 'pdf') => {
    if (selectedImageIds.length === 0) return
    await exportDomElements(
      selectedImageIds.map(id => ({
        el: boardImageRefs.current[id],
        fileBase: `billede-${id.slice(0, 8)}`,
      })),
      format
    )
  }

  const bringSelectedStickiesToFront = () => {
    if (!canEdit || selectedStickyNoteIds.length === 0) return
    const sel = new Set(selectedStickyNoteIds)
    setStickyNotes(prev => {
      const rest = prev.filter(n => !sel.has(n.id))
      const moved = prev.filter(n => sel.has(n.id))
      const next = [...rest, ...moved]
      persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
      return next
    })
  }

  const bringSelectedFreeTextsToFront = () => {
    if (!canEdit || selectedFreeTextIds.length === 0) return
    const sel = new Set(selectedFreeTextIds)
    setBoardFreeTexts(prev => {
      const rest = prev.filter(t => !sel.has(t.id))
      const moved = prev.filter(t => sel.has(t.id))
      const next = [...rest, ...moved]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
      return next
    })
  }

  const duplicateSelectedStickies = () => {
    if (!canEdit || selectedStickyNoteIds.length === 0) return
    const D = 28
    const sel = new Set(selectedStickyNoteIds)
    const clones: StickyNote[] = stickyNotes
      .filter(n => sel.has(n.id))
      .map((n, i) => ({
        ...n,
        id: `sticky-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: n.x + D,
        y: n.y + D,
        text: n.text,
      }))
    if (clones.length === 0) return
    const next = [...stickyNotes, ...clones]
    setStickyNotes(next)
    setSelectedStickyNoteIds(clones.map(c => c.id))
    persistFlowchart(flowNodes, flowEdges, next, boardSections, boardComments)
  }

  const exportSelectedStickiesAs = async (format: 'png' | 'jpg' | 'pdf') => {
    if (selectedStickyNoteIds.length === 0) return
    await exportDomElements(
      selectedStickyNoteIds.map(id => ({
        el: stickyExportRefs.current[id],
        fileBase: `sticky-${id.slice(0, 8)}`,
      })),
      format
    )
  }

  const exportSelectedFlowNodesAs = async (format: 'png' | 'jpg' | 'pdf') => {
    if (selectedFlowNodeIds.length === 0) return
    await exportDomElements(
      selectedFlowNodeIds.map(id => ({
        el: flowNodeExportRefs.current[id],
        fileBase: `form-${id.slice(0, 8)}`,
      })),
      format
    )
  }

  const bringSelectedFlowNodesToFront = () => {
    if (!canEdit || selectedFlowNodeIds.length === 0) return
    const sel = new Set(selectedFlowNodeIds)
    setFlowNodes(prev => {
      const rest = prev.filter(n => !sel.has(n.id))
      const moved = prev.filter(n => sel.has(n.id))
      const next = [...rest, ...moved]
      persistFlowchart(next, flowEdges)
      return next
    })
  }

  const duplicateSelectedFlowNodes = () => {
    if (!canEdit || selectedFlowNodeIds.length === 0) return
    const D = 28
    const sel = new Set(selectedFlowNodeIds)
    const clones: FlowNode[] = flowNodes
      .filter(n => sel.has(n.id))
      .map((n, i) => ({
        ...n,
        id: `node-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: n.x + D,
        y: n.y + D,
      }))
    if (clones.length === 0) return
    const next = [...flowNodes, ...clones]
    setFlowNodes(next)
    setSelectedFlowNodeIds(clones.map(c => c.id))
    setSelectedFlowNodeId(clones[0]?.id ?? null)
    persistFlowchart(next, flowEdges)
  }

  const duplicateSelectedComments = () => {
    if (!canEdit || selectedCommentIds.length === 0) return
    const D = 28
    const sel = new Set(selectedCommentIds)
    const clones: BoardComment[] = boardComments
      .filter(c => sel.has(c.id))
      .map((c, i) => ({
        ...c,
        id: `comment-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: c.x + D,
        y: c.y + D,
        createdAt: Date.now(),
        resolved: false,
        resolvedAt: undefined,
      }))
    if (clones.length === 0) return
    const next = [...boardComments, ...clones]
    setBoardComments(next)
    setSelectedCommentIds(clones.map(c => c.id))
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
  }

  const duplicateSelectedFreeTexts = () => {
    if (!canEdit || selectedFreeTextIds.length === 0) return
    const D = 28
    const sel = new Set(selectedFreeTextIds)
    const clones: BoardFreeText[] = boardFreeTexts
      .filter(t => sel.has(t.id))
      .map((t, i) => ({
        ...t,
        id: `ftext-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: t.x + D,
        y: t.y + D,
      }))
    if (clones.length === 0) return
    const next = [...boardFreeTexts, ...clones]
    setBoardFreeTexts(next)
    setSelectedFreeTextIds(clones.map(c => c.id))
    persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
  }

  const snapshotBoardSelectionToClipboard = (): BoardClipboardPayload | null => {
    const selFlow = new Set(selectedFlowNodeIds)
    const selSticky = new Set(selectedStickyNoteIds)
    const selSections = new Set(selectedSectionIds)
    const selComments = new Set(selectedCommentIds)
    const selImages = new Set(selectedImageIds)
    const selFreeTexts = new Set(selectedFreeTextIds)

    const flowNodesSelected = flowNodes.filter(n => selFlow.has(n.id))
    const flowEdgesSelected =
      flowNodesSelected.length > 0
        ? flowEdges.filter(e => selFlow.has(e.from) && selFlow.has(e.to))
        : []
    const stickySelected = stickyNotes.filter(n => selSticky.has(n.id))
    const sectionsSelected = boardSections.filter(s => selSections.has(s.id))
    const commentsSelected = boardComments.filter(c => selComments.has(c.id))
    const imagesSelected = boardImages.filter(i => selImages.has(i.id))
    const freeTextsSelected = boardFreeTexts.filter(t => selFreeTexts.has(t.id))

    const hasAny =
      flowNodesSelected.length > 0 ||
      stickySelected.length > 0 ||
      sectionsSelected.length > 0 ||
      commentsSelected.length > 0 ||
      imagesSelected.length > 0 ||
      freeTextsSelected.length > 0
    if (!hasAny) return null

    return {
      copiedAt: Date.now(),
      flowNodes: flowNodesSelected,
      flowEdges: flowEdgesSelected,
      stickyNotes: stickySelected,
      sections: sectionsSelected,
      comments: commentsSelected,
      images: imagesSelected,
      freeTexts: freeTextsSelected,
    }
  }

  const pasteBoardClipboard = (payload: BoardClipboardPayload, anchor?: { x: number; y: number }): boolean => {
    if (!canEdit) return false
    const allCoords: Array<{ x: number; y: number }> = [
      ...payload.flowNodes.map(n => ({ x: n.x, y: n.y })),
      ...payload.stickyNotes.map(n => ({ x: n.x, y: n.y })),
      ...payload.sections.map(s => ({ x: s.x, y: s.y })),
      ...payload.comments.map(c => ({ x: c.x, y: c.y })),
      ...payload.images.map(i => ({ x: i.x, y: i.y })),
      ...payload.freeTexts.map(t => ({ x: t.x, y: t.y })),
    ]
    if (allCoords.length === 0) return false
    const minX = Math.min(...allCoords.map(p => p.x))
    const minY = Math.min(...allCoords.map(p => p.y))

    const rect = canvasRef.current?.getBoundingClientRect()
    const fallbackX = rect ? (rect.width / 2 - pan.x) / zoom : 220
    const fallbackY = rect ? (rect.height / 2 - pan.y) / zoom : 220
    const base = anchor ?? { x: fallbackX, y: fallbackY }

    boardPasteCountRef.current += 1
    const pasteOffset = boardPasteCountRef.current * BOARD_ALT_DUPLICATE_OFFSET
    const dx = base.x - minX + pasteOffset
    const dy = base.y - minY + pasteOffset

    const flowIdMap = new Map<string, string>()
    const flowClones = payload.flowNodes.map((n, i) => {
      const id = `node-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`
      flowIdMap.set(n.id, id)
      const pos = snapPoint(n.x + dx, n.y + dy)
      return { ...n, id, x: pos.x, y: pos.y }
    })
    const flowEdgeClones = payload.flowEdges
      .map((e, i) => {
        const from = flowIdMap.get(e.from)
        const to = flowIdMap.get(e.to)
        if (!from || !to) return null
        return {
          ...e,
          id: `edge-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          from,
          to,
        }
      })
      .filter(Boolean) as FlowEdge[]

    const stickyClones = payload.stickyNotes.map((n, i) => {
      const pos = snapPoint(n.x + dx, n.y + dy)
      return {
        ...n,
        id: `sticky-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
        createdBy: currentUsername,
      }
    })
    const sectionClones = payload.sections.map((s, i) => {
      const pos = snapPoint(s.x + dx, s.y + dy)
      return {
        ...s,
        id: `section-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
      }
    })
    const commentClones = payload.comments.map((c, i) => {
      const pos = snapPoint(c.x + dx, c.y + dy)
      return {
        ...c,
        id: `comment-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
        createdAt: Date.now(),
        createdBy: currentUsername,
        resolved: false,
        resolvedAt: undefined,
      }
    })
    const imageClones = payload.images.map((im, i) => {
      const pos = snapPoint(im.x + dx, im.y + dy)
      return {
        ...im,
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
      }
    })
    const freeTextClones = payload.freeTexts.map((t, i) => {
      const pos = snapPoint(t.x + dx, t.y + dy)
      return {
        ...t,
        id: `ftext-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: pos.x,
        y: pos.y,
      }
    })

    const nextFlowNodes = flowClones.length > 0 ? [...flowNodes, ...flowClones] : flowNodes
    const nextFlowEdges = flowEdgeClones.length > 0 ? [...flowEdges, ...flowEdgeClones] : flowEdges
    const nextSticky = stickyClones.length > 0 ? [...stickyNotes, ...stickyClones] : stickyNotes
    const nextSections = sectionClones.length > 0 ? [...boardSections, ...sectionClones] : boardSections
    const nextComments = commentClones.length > 0 ? [...boardComments, ...commentClones] : boardComments
    const nextImages = imageClones.length > 0 ? [...boardImages, ...imageClones] : boardImages
    const nextFreeTexts = freeTextClones.length > 0 ? [...boardFreeTexts, ...freeTextClones] : boardFreeTexts

    if (flowClones.length > 0) {
      setFlowNodes(nextFlowNodes)
      setFlowEdges(nextFlowEdges)
      setSelectedFlowNodeIds(flowClones.map(n => n.id))
      setSelectedFlowNodeId(flowClones[0]?.id ?? null)
    } else {
      setSelectedFlowNodeIds([])
      setSelectedFlowNodeId(null)
    }
    setStickyNotes(nextSticky)
    setSelectedStickyNoteIds(stickyClones.map(n => n.id))
    setBoardSections(nextSections)
    setSelectedSectionIds(sectionClones.map(s => s.id))
    setBoardComments(nextComments)
    setSelectedCommentIds(commentClones.map(c => c.id))
    setBoardImages(nextImages)
    setSelectedImageIds(imageClones.map(i => i.id))
    setBoardFreeTexts(nextFreeTexts)
    setSelectedFreeTextIds(freeTextClones.map(t => t.id))
    setSelectedCardSlugs([])

    persistFlowchart(nextFlowNodes, nextFlowEdges, nextSticky, nextSections, nextComments, nextImages, nextFreeTexts)
    return true
  }

  const addBoardImageFromSrc = (src: string, at?: { x: number; y: number }) => {
    if (!canEdit) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const cx = at?.x ?? (rect ? (rect.width / 2 - pan.x) / zoom : 200)
    const cy = at?.y ?? (rect ? (rect.height / 2 - pan.y) / zoom : 200)
    const w = BOARD_IMAGE_DEFAULT_W
    const h = BOARD_IMAGE_DEFAULT_H
    const snapped = snapPoint(cx - w / 2, cy - h / 2)
    const img: BoardImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: snapped.x,
      y: snapped.y,
      width: w,
      height: h,
      src,
    }
    setBoardImages(prev => {
      const next = [...prev, img]
      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, next)
      return next
    })
    setSelectedImageIds([img.id])
    setSelectedCardSlugs([])
    setSelectedFlowNodeIds([])
    setSelectedFlowNodeId(null)
    setSelectedStickyNoteIds([])
    setSelectedSectionIds([])
    setSelectedCommentIds([])
    setSelectedFreeTextIds([])
  }

  const addBoardImageFromSrcRef = useRef(addBoardImageFromSrc)
  addBoardImageFromSrcRef.current = addBoardImageFromSrc

  useEffect(() => {
    const editable = project?.role === 'owner' || project?.role === 'editor'
    if (!editable || activeWorkspaceTab !== 'board') return
    const onCopy = (ev: ClipboardEvent) => {
      const target = ev.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isTypingTarget) return
      const payload = snapshotBoardSelectionToClipboard()
      if (!payload) return
      boardClipboardRef.current = payload
      boardPasteCountRef.current = 0
      try {
        const json = JSON.stringify(payload)
        ev.clipboardData?.setData(BOARD_CLIPBOARD_MIME, json)
        ev.clipboardData?.setData('text/plain', '[ForgeLab board selection]')
        ev.preventDefault()
      } catch {
        /* clipboard permissions/availability varies by browser */
      }
    }
    window.addEventListener('copy', onCopy)
    return () => window.removeEventListener('copy', onCopy)
  }, [
    project?.role,
    activeWorkspaceTab,
    flowNodes,
    flowEdges,
    stickyNotes,
    boardSections,
    boardComments,
    boardImages,
    boardFreeTexts,
    selectedFlowNodeIds,
    selectedStickyNoteIds,
    selectedSectionIds,
    selectedCommentIds,
    selectedImageIds,
    selectedFreeTextIds,
  ])

  useEffect(() => {
    const editable = project?.role === 'owner' || project?.role === 'editor'
    if (!editable || activeWorkspaceTab !== 'board') return
    const onPaste = (ev: ClipboardEvent) => {
      const target = ev.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isTypingTarget) return
      const items = ev.clipboardData?.items
      if (items?.length) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i]
          if (it.kind !== 'file' || !it.type.startsWith('image/')) continue
          const file = it.getAsFile()
          if (!file) continue
          ev.preventDefault()
          const reader = new FileReader()
          reader.onload = () => {
            const data = reader.result
            if (typeof data !== 'string') return
            const rect = canvasRef.current?.getBoundingClientRect()
            const cx = rect ? (rect.width / 2 - pan.x) / zoom : 200
            const cy = rect ? (rect.height / 2 - pan.y) / zoom : 200
            addBoardImageFromSrcRef.current(data, { x: cx, y: cy })
          }
          reader.readAsDataURL(file)
          return
        }
      }

      const rawPayload =
        ev.clipboardData?.getData(BOARD_CLIPBOARD_MIME) ||
        ev.clipboardData?.getData('text/plain') ||
        ''
      if (rawPayload) {
        try {
          const parsed = JSON.parse(rawPayload) as BoardClipboardPayload
          if (parsed && Array.isArray(parsed.flowNodes) && Array.isArray(parsed.stickyNotes)) {
            ev.preventDefault()
            boardClipboardRef.current = parsed
            if (pasteBoardClipboard(parsed)) return
          }
        } catch {
          /* plain text, not JSON payload */
        }
      }

      if (boardClipboardRef.current) {
        ev.preventDefault()
        if (pasteBoardClipboard(boardClipboardRef.current)) return
      }

      const uri = ev.clipboardData?.getData('text/uri-list')?.trim() || ''
      const plainText = ev.clipboardData?.getData('text/plain')?.trim() || ''
      const candidate = uri || plainText
      const looksLikeImageUrl =
        /^data:image\//i.test(candidate) ||
        /^https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(candidate)
      if (looksLikeImageUrl) {
        ev.preventDefault()
        const rect = canvasRef.current?.getBoundingClientRect()
        const cx = rect ? (rect.width / 2 - pan.x) / zoom : 200
        const cy = rect ? (rect.height / 2 - pan.y) / zoom : 200
        addBoardImageFromSrcRef.current(candidate, { x: cx, y: cy })
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [project?.role, activeWorkspaceTab, pan.x, pan.y, zoom, pasteBoardClipboard])

  useEffect(() => {
    if (activeWorkspaceTab !== 'board') return
    const onBoardShortcuts = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      const key = event.key.toLowerCase()

      if ((key === 'z' || key === 'y') && canEdit && !isTypingTarget) {
        event.preventDefault()
        const isRedo = (key === 'z' && event.shiftKey) || key === 'y'
        if (isRedo) handleBoardRedo()
        else handleBoardUndo()
        return
      }

      if (key === 'f' && !isTypingTarget) {
        event.preventDefault()
        setShowAddTool(true)
        return
      }

      if (key === 'a' && !isTypingTarget) {
        event.preventDefault()
        setSelectedCardSlugs(project?.toolIds || [])
        setSelectedFlowNodeIds(flowNodes.map(n => n.id))
        setSelectedFlowNodeId(null)
        setSelectedStickyNoteIds(stickyNotes.map(n => n.id))
        setSelectedSectionIds(boardSections.map(s => s.id))
        setSelectedCommentIds(boardComments.map(c => c.id))
        setSelectedImageIds(boardImages.map(i => i.id))
        setSelectedFreeTextIds(boardFreeTexts.map(t => t.id))
        return
      }

      if (key === 'x' && canEdit && !isTypingTarget) {
        const payload = snapshotBoardSelectionToClipboard()
        if (!payload) return
        event.preventDefault()
        boardClipboardRef.current = payload
        boardPasteCountRef.current = 0
        if (selectedFlowNodeIds.length > 0) {
          removeFlowNodesByIds(selectedFlowNodeIds)
        }
        if (selectedCardSlugs.length > 0) {
          void removeToolCardsByIds(selectedCardSlugs)
        }
        if (selectedStickyNoteIds.length > 0) {
          removeStickyNotesByIds(selectedStickyNoteIds)
        }
        if (selectedSectionIds.length > 0) {
          removeSectionsByIds(selectedSectionIds)
        }
        if (selectedCommentIds.length > 0) {
          removeCommentsByIds(selectedCommentIds)
        }
        if (selectedImageIds.length > 0) {
          removeBoardImagesByIds(selectedImageIds)
        }
        if (selectedFreeTextIds.length > 0) {
          removeFreeTextsByIds(selectedFreeTextIds)
        }
      }
    }
    window.addEventListener('keydown', onBoardShortcuts)
    return () => window.removeEventListener('keydown', onBoardShortcuts)
  }, [
    activeWorkspaceTab,
    canEdit,
    project?.toolIds,
    flowNodes,
    stickyNotes,
    boardSections,
    boardComments,
    boardImages,
    boardFreeTexts,
    selectedFlowNodeIds,
    selectedCardSlugs,
    selectedStickyNoteIds,
    selectedSectionIds,
    selectedCommentIds,
    selectedImageIds,
    selectedFreeTextIds,
    handleBoardUndo,
    handleBoardRedo,
  ])

  const removeToolCardsByIds = async (toolIds: string[]) => {
    if (toolIds.length === 0) return
    const uniqueToolIds = Array.from(new Set(toolIds))

    const removeLocal = () => {
      setProject(prev =>
        prev ? { ...prev, toolIds: prev.toolIds.filter(id => !uniqueToolIds.includes(id)) } : prev
      )
      setCardPositions(prev => {
        const next = { ...prev }
        uniqueToolIds.forEach(id => delete next[id])
        return next
      })
      setCardZOrder(prev => {
        const next = { ...prev }
        uniqueToolIds.forEach(id => delete next[id])
        return next
      })
      setLockedCardSlugs(prev => prev.filter(slug => !uniqueToolIds.includes(slug)))
      setSelectedCardSlugs(prev => prev.filter(slug => !uniqueToolIds.includes(slug)))
    }

    if (project?.role === 'viewer') return
    if (isOffline) {
      removeLocal()
      return
    }

    try {
      setModifying(true)
      await Promise.all(uniqueToolIds.map(async toolId => removeToolFromProject(projectId, toolId)))
      removeLocal()
      await broadcastBoardRefresh()
    } catch {
      alert('Kunne ikke fjerne ét eller flere værktøjer. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  useEffect(() => {
    const onKeyDownDeleteSelected = (event: KeyboardEvent) => {
      const isEditable = project?.role === 'owner' || project?.role === 'editor'
      if (!isEditable) return
      if (event.key !== 'Backspace' && event.key !== 'Delete') return

      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isTypingTarget) return

      if (
        selectedFlowNodeIds.length === 0 &&
        selectedCardSlugs.length === 0 &&
        selectedStickyNoteIds.length === 0 &&
        selectedSectionIds.length === 0 &&
        selectedCommentIds.length === 0 &&
        selectedImageIds.length === 0 &&
        selectedFreeTextIds.length === 0
      ) return
      event.preventDefault()
      if (selectedFlowNodeIds.length > 0) {
        removeFlowNodesByIds(selectedFlowNodeIds)
      }
      if (selectedCardSlugs.length > 0) {
        void removeToolCardsByIds(selectedCardSlugs)
      }
      if (selectedStickyNoteIds.length > 0) {
        removeStickyNotesByIds(selectedStickyNoteIds)
      }
      if (selectedSectionIds.length > 0) {
        removeSectionsByIds(selectedSectionIds)
      }
      if (selectedCommentIds.length > 0) {
        removeCommentsByIds(selectedCommentIds)
      }
      if (selectedImageIds.length > 0) {
        removeBoardImagesByIds(selectedImageIds)
      }
      if (selectedFreeTextIds.length > 0) {
        removeFreeTextsByIds(selectedFreeTextIds)
      }
    }

    window.addEventListener('keydown', onKeyDownDeleteSelected)
    return () => {
      window.removeEventListener('keydown', onKeyDownDeleteSelected)
    }
  }, [project?.role, selectedFlowNodeIds, selectedCardSlugs, selectedStickyNoteIds, selectedSectionIds, selectedCommentIds, selectedImageIds, selectedFreeTextIds])

  const getCanvasWorldPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    }
  }

  const snapPoint = (x: number, y: number) => {
    if (!snapToGrid) return { x, y }
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    }
  }

  const buildAlignmentTargets = useCallback(
    (exclude: BoardSnapExclude): SnapRect[] => {
      const excludedCards = new Set(exclude.cardSlugs ?? [])
      const excludedFlow = new Set(exclude.flowNodeIds ?? [])
      const excludedSticky = new Set(exclude.stickyNoteIds ?? [])
      const excludedSections = new Set(exclude.sectionIds ?? [])
      const excludedComments = new Set(exclude.commentIds ?? [])
      const excludedFreeText = new Set(exclude.freeTextIds ?? [])
      const excludedImages = new Set(exclude.imageIds ?? [])
      const targets: SnapRect[] = []

      const toolIds = project?.toolIds ?? []
      toolIds.forEach((slug, idx) => {
        if (BOARD_EXCLUDED_TOOL_SLUGS.has(slug) || excludedCards.has(slug)) return
        const pos = cardPositions[slug] || defaultPos(slug, idx)
        const cardEl = cardElementRefs.current[slug]
        const isWide = isWideBoardPreviewSlug(slug)
        const w = cardEl?.offsetWidth ?? (isWide ? 980 : 680)
        const h = cardEl?.offsetHeight ?? (isWide ? 620 : 400)
        targets.push({ left: pos.x, top: pos.y, width: w, height: h })
      })

      flowNodes.forEach(node => {
        if (excludedFlow.has(node.id)) return
        const dim = getFlowNodeDimensions(node)
        targets.push({ left: node.x, top: node.y, width: dim.width, height: dim.height })
      })

      stickyNotes.forEach(note => {
        if (excludedSticky.has(note.id)) return
        const { w, h } = getStickyNoteSize(note)
        targets.push({ left: note.x, top: note.y, width: w, height: h })
      })

      boardFreeTexts.forEach(ft => {
        if (excludedFreeText.has(ft.id)) return
        const { w, h } = getFreeTextSize(ft)
        targets.push({ left: ft.x, top: ft.y, width: w, height: h })
      })

      boardImages.forEach(image => {
        if (excludedImages.has(image.id)) return
        targets.push({ left: image.x, top: image.y, width: image.width, height: image.height })
      })

      boardSections.forEach(section => {
        if (excludedSections.has(section.id)) return
        targets.push({ left: section.x, top: section.y, width: section.width, height: section.height })
      })

      boardComments
        .filter(c => !c.parentId && !c.resolved && !excludedComments.has(c.id))
        .forEach(comment => {
          targets.push({
            left: comment.x,
            top: comment.y,
            width: BOARD_COMMENT_PIN_SIZE,
            height: BOARD_COMMENT_PIN_SIZE,
          })
        })

      return targets
    },
    [
      project?.toolIds,
      cardPositions,
      defaultPos,
      flowNodes,
      stickyNotes,
      boardFreeTexts,
      boardImages,
      boardSections,
      boardComments,
    ]
  )

  const snapDragPoint = useCallback(
    (x: number, y: number) => {
      const meta = alignmentDragMetaRef.current
      if (!meta) return snapPoint(x, y)
      const targets = buildAlignmentTargets(meta.exclude)
      const alignThreshold = BOARD_ALIGN_THRESHOLD / Math.max(0.25, zoom)
      const { x: ax, y: ay, guides } = computeAlignmentSnap(x, y, meta.w, meta.h, targets, alignThreshold)
      setAlignmentGuides(guides)
      const hasXGuide = guides.some(g => g.orientation === 'vertical')
      const hasYGuide = guides.some(g => g.orientation === 'horizontal')
      return {
        x: snapToGrid && !hasXGuide ? Math.round(ax / GRID_SIZE) * GRID_SIZE : ax,
        y: snapToGrid && !hasYGuide ? Math.round(ay / GRID_SIZE) * GRID_SIZE : ay,
      }
    },
    [buildAlignmentTargets, snapToGrid, GRID_SIZE, zoom]
  )

  const clearAlignmentGuides = useCallback(() => {
    alignmentDragMetaRef.current = null
    setAlignmentGuides([])
  }, [])

  const expandSectionsToFitContents = useCallback(
    (sectionIds: string[]) => {
      if (!canEdit || sectionIds.length === 0) return
      const idSet = new Set(sectionIds)
      setBoardSections(prev => {
        const next = prev.map(section => {
          if (!idSet.has(section.id)) return section
          const sectionBox = worldBoundsForBoardSection(section)
          const contentBox = getSectionContentUnionBounds(section)
          const merged: WorldBounds = contentBox
            ? (unionWorldBounds(sectionBox, contentBox) ?? sectionBox)
            : sectionBox
          const padded = padWorldBounds(merged, SECTION_FRAME_PADDING)
          const pos = snapToGrid
            ? {
                x: Math.round(padded.minX / GRID_SIZE) * GRID_SIZE,
                y: Math.round(padded.minY / GRID_SIZE) * GRID_SIZE,
              }
            : { x: padded.minX, y: padded.minY }
          let w = Math.max(SECTION_MIN_W, padded.maxX - padded.minX)
          let h = Math.max(SECTION_MIN_H, padded.maxY - padded.minY)
          if (snapToGrid) {
            w = Math.max(SECTION_MIN_W, Math.round(w / GRID_SIZE) * GRID_SIZE)
            h = Math.max(SECTION_MIN_H, Math.round(h / GRID_SIZE) * GRID_SIZE)
          }
          return { ...section, x: pos.x, y: pos.y, width: w, height: h }
        })
        persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
        return next
      })
    },
    [
      canEdit,
      getSectionContentUnionBounds,
      snapToGrid,
      GRID_SIZE,
      flowNodes,
      flowEdges,
      stickyNotes,
      boardComments,
      persistFlowchart,
    ]
  )

  const expandSelectedSectionsToFitContents = () => {
    expandSectionsToFitContents(selectedSectionIds)
  }

  const getNodeAtWorldPoint = (x: number, y: number, excludeNodeId?: string) => {
    for (let i = flowNodes.length - 1; i >= 0; i--) {
      const node = flowNodes[i]
      if (excludeNodeId && node.id === excludeNodeId) continue
      const dim = getFlowNodeDimensions(node)
      if (x >= node.x && x <= node.x + dim.width && y >= node.y && y <= node.y + dim.height) {
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
      const sides: FlowConnectorSide[] = ['left', 'top', 'right', 'bottom']
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
    const currentFramework: FrameworkId = project?.framework === 'none' || !project?.framework ? 'double-diamond' : project.framework
    const defaultPhase = getDefaultPhaseForTool(currentFramework, toolId)
    if (isOffline) {
      // Local demo mode: just add to local state
      setProject(prev => {
        if (!prev || prev.toolIds.includes(toolId)) return prev
        return {
          ...prev,
          toolIds: [...prev.toolIds, toolId],
          toolPhases: defaultPhase ? { ...(prev.toolPhases || {}), [toolId]: defaultPhase } : prev.toolPhases,
        }
      })
      setShowAddTool(false)
      return
    }
    let shouldRollback = false
    try {
      setModifying(true)
      setProject(prev => {
        if (!prev) return prev
        if (prev.toolIds.includes(toolId)) return prev
        shouldRollback = true
        return {
          ...prev,
          toolIds: [...prev.toolIds, toolId],
          toolPhases: defaultPhase ? { ...(prev.toolPhases || {}), [toolId]: defaultPhase } : prev.toolPhases,
        }
      })
      const added = await addToolToProject(projectId, toolId)
      if (!added && shouldRollback) {
        setProject(prev => {
          if (!prev) return prev
          const nextToolPhases = { ...(prev.toolPhases || {}) }
          delete nextToolPhases[toolId]
          return {
            ...prev,
            toolIds: prev.toolIds.filter(id => id !== toolId),
            toolPhases: nextToolPhases,
          }
        })
        alert('Kunne ikke tilføje værktøj. Prøv igen.')
        return
      }
      if (defaultPhase) {
        await updateProjectToolPhases(projectId, { [toolId]: defaultPhase })
      }
      await broadcastBoardRefresh()
      setShowAddTool(false)
    } catch {
      if (shouldRollback) {
        setProject(prev => {
          if (!prev) return prev
          const nextToolPhases = { ...(prev.toolPhases || {}) }
          delete nextToolPhases[toolId]
          return {
            ...prev,
            toolIds: prev.toolIds.filter(id => id !== toolId),
            toolPhases: nextToolPhases,
          }
        })
      }
      alert('Kunne ikke tilføje værktøj. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleAddAllTools = async (toolIds: string[]) => {
    if (project?.role === 'viewer') return alert('Du har kun læseadgang til dette projekt.')
    if (modifying || toolIds.length === 0) return

    const uniqueToolIds = Array.from(new Set(toolIds))
    const currentFramework: FrameworkId = project?.framework === 'none' || !project?.framework ? 'double-diamond' : project.framework
    const defaultPhases = Object.fromEntries(
      uniqueToolIds
        .map(toolId => [toolId, getDefaultPhaseForTool(currentFramework, toolId)] as const)
        .filter((entry): entry is [string, DoubleDiamondPhase] => Boolean(entry[1]))
    )

    if (isOffline) {
      setProject(prev => {
        if (!prev) return prev
        const mergedToolIds = Array.from(new Set([...prev.toolIds, ...uniqueToolIds]))
        return {
          ...prev,
          toolIds: mergedToolIds,
          toolPhases: { ...(prev.toolPhases || {}), ...defaultPhases },
        }
      })
      setShowAddTool(false)
      return
    }

    try {
      setModifying(true)
      setProject(prev => {
        if (!prev) return prev
        const mergedToolIds = Array.from(new Set([...prev.toolIds, ...uniqueToolIds]))
        return {
          ...prev,
          toolIds: mergedToolIds,
          toolPhases: { ...(prev.toolPhases || {}), ...defaultPhases },
        }
      })

      const failed: string[] = []
      for (const toolId of uniqueToolIds) {
        const added = await addToolToProject(projectId, toolId)
        if (!added) failed.push(toolId)
      }

      const successfulPhaseMap = Object.fromEntries(
        Object.entries(defaultPhases).filter(([toolId]) => !failed.includes(toolId))
      ) as Record<string, DoubleDiamondPhase>

      if (Object.keys(successfulPhaseMap).length > 0) {
        await updateProjectToolPhases(projectId, successfulPhaseMap)
      }

      if (failed.length > 0) {
        setProject(prev => {
          if (!prev) return prev
          const nextToolPhases = { ...(prev.toolPhases || {}) }
          failed.forEach(toolId => delete nextToolPhases[toolId])
          return {
            ...prev,
            toolIds: prev.toolIds.filter(id => !failed.includes(id)),
            toolPhases: nextToolPhases,
          }
        })
        alert(`Tilføjede ${uniqueToolIds.length - failed.length}/${uniqueToolIds.length} værktøjer. ${failed.length} fejlede.`)
      }

      await broadcastBoardRefresh()
      setShowAddTool(false)
    } catch {
      setProject(prev => {
        if (!prev) return prev
        const nextToolPhases = { ...(prev.toolPhases || {}) }
        uniqueToolIds.forEach(toolId => delete nextToolPhases[toolId])
        return {
          ...prev,
          toolIds: prev.toolIds.filter(id => !uniqueToolIds.includes(id)),
          toolPhases: nextToolPhases,
        }
      })
      alert('Kunne ikke tilføje alle værktøjer. Prøv igen.')
    } finally {
      setModifying(false)
    }
  }

  const handleRemoveTool = async (toolId: string) => {
    setSelectedCardSlugs(prev => prev.filter(slug => slug !== toolId))
    if (project?.role === 'viewer') return alert('Du har kun læseadgang til dette projekt.')
    if (modifying) return
    if (isOffline) {
      // Local demo mode: just remove from local state
      setProject(prev => prev ? { ...prev, toolIds: prev.toolIds.filter(id => id !== toolId) } : prev)
      setCardPositions(prev => { const n = { ...prev }; delete n[toolId]; return n })
      setCardZOrder(prev => { const n = { ...prev }; delete n[toolId]; return n })
      setLockedCardSlugs(prev => prev.filter(slug => slug !== toolId))
      return
    }
    try {
      setModifying(true)
      await removeToolFromProject(projectId, toolId)
      setProject(prev => prev ? { ...prev, toolIds: prev.toolIds.filter(id => id !== toolId) } : prev)
      setCardPositions(prev => { const n = { ...prev }; delete n[toolId]; return n })
      setCardZOrder(prev => { const n = { ...prev }; delete n[toolId]; return n })
      setLockedCardSlugs(prev => prev.filter(slug => slug !== toolId))
      await broadcastBoardRefresh()
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
      setProject(prev => prev ? { ...prev, framework } : prev)
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
    const emails = Array.from(
      new Set(
        inviteEmail
          .split(/[\n,;]+/)
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      )
    )
    if (emails.length === 0) return

    try {
      setModifying(true)
      const failed: Array<{ email: string; reason: string }> = []
      for (const email of emails) {
        try {
          await inviteProjectMember(projectId, email, inviteRole)
        } catch (err: any) {
          failed.push({ email, reason: err?.message || 'Ukendt fejl' })
        }
      }
      setInviteEmail('')
      setInviteRole('editor')
      setMembers((await getProjectMembers(projectId)) || [])
      if (failed.length > 0) {
        const successCount = emails.length - failed.length
        alert(
          `Inviteret: ${successCount}/${emails.length}\n` +
            failed.map((f) => `- ${f.email}: ${f.reason}`).join('\n')
        )
      }
    } catch (err: any) {
      alert(err?.message || 'Kunne ikke invitere medlem.')
    } finally {
      setModifying(false)
    }
  }

  const loadInviteLink = async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/invite-link`)
      if (!res.ok) return
      const d = await res.json()
      setInviteLink(d.link || null)
      if (d.link) setInviteLinkRole(d.link.role)
    } catch {}
  }

  const handleGenerateInviteLink = async () => {
    setInviteLinkLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/invite-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteLinkRole }),
      })
      const d = await res.json()
      if (d.link) setInviteLink(d.link)
    } catch {}
    finally { setInviteLinkLoading(false) }
  }

  const handleDeleteInviteLink = async () => {
    if (!inviteLink) return
    setInviteLinkLoading(true)
    try {
      await fetch(`/api/projects/${projectId}/invite-link`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: inviteLink.id }),
      })
      setInviteLink(null)
    } catch {}
    finally { setInviteLinkLoading(false) }
  }

  const handleCopyInviteLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink.url).then(() => {
      setInviteLinkCopied(true)
      setTimeout(() => setInviteLinkCopied(false), 2000)
    })
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

  useEffect(() => {
    if (showPanel === 'settings' && project?.role === 'owner') {
      void loadInviteLink()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPanel, project?.role])

  // ── Loading / not found ────────────────────────────────────────────
  if (loading) {
    return (
      <div data-forge-project-light style={S.fullscreen}>
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
      <div data-forge-project-light style={{ ...S.fullscreen, flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <SearchX size={44} strokeWidth={2.2} color="#9CA3AF" aria-hidden />
          </div>
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
  const projectTools: ProjectToolEntry[] = project.toolIds
    .map((id) => {
      const tool = getVaerktoejBySlug(id)
      return tool ? { slug: id, tool } : null
    })
    .filter((entry): entry is ProjectToolEntry => entry !== null)
  const boardTools = projectTools.filter(({ slug }) => !BOARD_EXCLUDED_TOOL_SLUGS.has(slug))
  const planningTools = projectTools.filter(({ slug }) => BOARD_EXCLUDED_TOOL_SLUGS.has(slug))
  // Sidebaren er permanent (altid synlig) fordi PDF-indgangen altid skal være tilgængelig.
  const boardSidebarWidth = boardSidebarCollapsed ? 56 : 240
  const isBoardEmpty =
    boardTools.length === 0 &&
    flowNodes.length === 0 &&
    stickyNotes.length === 0 &&
    boardSections.length === 0 &&
    boardComments.length === 0 &&
    boardFreeTexts.length === 0 &&
    boardImages.length === 0
  // In offline/demo mode allow all tools, not just allowed slugs
  const toAdd = VAERKTOEJER.filter(t =>
    (isOffline || allowed.has(t.slug)) &&
    !project.toolIds.includes(t.slug) &&
    !BOARD_ADD_TOOL_EXCLUDED_SLUGS.has(t.slug)
  )
  const byKategori = getVaerktoejerGroupedByKategori(
    t =>
      (isOffline || allowed.has(t.slug)) &&
      !project.toolIds.includes(t.slug) &&
      !BOARD_ADD_TOOL_EXCLUDED_SLUGS.has(t.slug)
  )
  const categoryMetaBySlug = new Map<string, { id: string; label: string }>()
  byKategori.forEach(({ kategori, tools }) => {
    tools.forEach(tool => categoryMetaBySlug.set(tool.slug, { id: kategori.id, label: kategori.label }))
  })
  const phaseMetaBySlug = new Map<string, { id: string; label: string }>()
  const framework = project?.framework || 'none'
  const pickerFramework: FrameworkId = framework === 'none' ? 'double-diamond' : framework
  const frameworkPhases = getFrameworkPhases(pickerFramework)
  const activeAddToolCategory =
    selectedAddToolCategory === 'all' || frameworkPhases.some(phase => phase.id === selectedAddToolCategory)
      ? selectedAddToolCategory
      : 'all'
  toAdd.forEach(tool => {
    const phaseId = getDefaultPhaseForTool(pickerFramework, tool.slug)
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
      count: toAdd.filter(tool => getDefaultPhaseForTool(pickerFramework, tool.slug) === phase.id).length,
    })).filter(filter => filter.count > 0),
  ]
  const visibleAddTools = showAllAddToolResults ? filteredAddTools : filteredAddTools.slice(0, 9)
  const visibleToolsByPhase = frameworkPhases.map(phase => ({
    phase,
    tools: visibleAddTools.filter(
      tool => getDefaultPhaseForTool(pickerFramework, tool.slug) === phase.id
    ),
  })).filter(group => group.tools.length > 0)
  const selectedPhaseForDiagram =
    pickerFramework === 'google-design-sprint'
      ? (GOOGLE_DESIGN_SPRINT_PHASES.some(phase => phase.id === activeAddToolCategory)
          ? (activeAddToolCategory as GoogleDesignSprintPhase)
          : 'understand')
      : pickerFramework === 'design-thinking'
        ? (DESIGN_THINKING_PHASES.some(phase => phase.id === activeAddToolCategory)
            ? (activeAddToolCategory as DesignThinkingPhase)
            : 'empathize')
      : (DOUBLE_DIAMOND_PHASES.some(phase => phase.id === activeAddToolCategory)
          ? (activeAddToolCategory as DoubleDiamondPhase)
          : 'discover')

  const toolCount = projectTools.length
  const isOwner = project.role === 'owner'
  const toolPhases = project.toolPhases || {}
  const lastUpdated = project.updatedAt ? new Date(project.updatedAt).toLocaleString('da-DK') : '–'
  const flowNodeMap = new Map(flowNodes.map(node => [node.id, node]))
  const visibleFlowEdges = flowEdges.filter(edge => flowNodeMap.has(edge.from) && flowNodeMap.has(edge.to))
  let flowEdgeZFloor: number | null = null
  visibleFlowEdges.forEach(edge => {
    const fromNode = flowNodeMap.get(edge.from)
    const toNode = flowNodeMap.get(edge.to)
    if (!fromNode || !toNode) return
    const fromDim = getFlowNodeDimensions(fromNode)
    const toDim = getFlowNodeDimensions(toNode)
    const edgeBounds: WorldBounds = {
      minX: Math.min(fromNode.x, toNode.x),
      minY: Math.min(fromNode.y, toNode.y),
      maxX: Math.max(fromNode.x + fromDim.width, toNode.x + toDim.width),
      maxY: Math.max(fromNode.y + fromDim.height, toNode.y + toDim.height),
    }
    const edgeFloor = getSectionContentZFloor(edgeBounds)
    if (edgeFloor != null) {
      flowEdgeZFloor = flowEdgeZFloor == null ? edgeFloor : Math.max(flowEdgeZFloor, edgeFloor)
    }
  })
  const hasKanbanTool = planningTools.some(tool => tool.slug === 'kanban')
  const hasGanttTool = planningTools.some(tool => tool.slug === 'gantt-chart')
  const SurveyTemplateComponent = getToolComponent('survey-template')
  const CardSortingComponent = getToolComponent('card-sorting')
  const QrGeneratorComponent = getToolComponent('qr-generator')
  const KanbanComponent = getToolComponent('kanban')
  const GanttComponent = getToolComponent('gantt-chart')
  const kanbanReady = Boolean(hasKanbanTool && KanbanComponent)
  const ganttReady = Boolean(hasGanttTool && GanttComponent)
  const planningDualMode = kanbanReady && ganttReady
  const activePlanningPane: 'kanban' | 'gantt' = planningDualMode
    ? planningPane
    : ganttReady && !kanbanReady
      ? 'gantt'
      : 'kanban'
  const planningSingleToolMode = (kanbanReady && !ganttReady) || (!kanbanReady && ganttReady)
  const planningWideLayout = planningDualMode || planningSingleToolMode

  const stickyToolbarNote =
    richToolbarUi?.kind === 'sticky'
      ? stickyNotes.find(n => n.id === richToolbarUi.noteId)
      : undefined
  const flowToolbarNode =
    richToolbarUi?.kind === 'flow'
      ? flowNodes.find(n => n.id === richToolbarUi.nodeId)
      : undefined

  const workspaceTopBarOffset = isOffline ? 89 : 56
  const workspaceContentFrame: CSSProperties = {
    position: 'fixed',
    top: workspaceTopBarOffset,
    left: 0,
    right: 0,
    bottom: 0,
  }
  const boardToolbarLeft = '50vw'

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      data-forge-project-light
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#ECEAE5', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}
    >

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
          <AlertTriangle size={14} strokeWidth={2.2} aria-hidden />
          <span>Demo-tilstand — ingen database tilsluttet. Ændringer gemmes ikke.</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          LEFT PROJECT SIDEBAR (permanent)
          Viser tools med dedikerede /tools/<slug>-sider, Analytics og
          en altid-synlig PDF-indgang. Tools tilføjes/fjernes dynamisk
          baseret på projektets faktiske toolIds.
      ════════════════════════════════════════════════ */}
      <ProjectBoardSidebar
        projectId={projectId}
        projectTools={projectTools}
        topOffset={workspaceTopBarOffset}
        collapsed={boardSidebarCollapsed}
        onToggleCollapsed={() => setBoardSidebarCollapsed((c) => !c)}
        onOpenFilesTab={() => setActiveWorkspaceTab('files')}
      />

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
            <FlaskConical size={15} strokeWidth={2.2} aria-hidden />
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
          {/* Survey, Kortsortering, QR, PDF og Analytics er flyttet til
              venstre tool-sidebaren og dedikerede /tools/<slug>-sider. */}
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
          {onlineMembers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: 2 }}>
              {onlineMembers.slice(0, 5).map((m, i) => {
                const label = m.email || m.username || m.user_id
                const initial = (label || '?').charAt(0).toUpperCase()
                return (
                  <div
                    key={m.user_id}
                    title={`${label} (${m.role})`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      marginLeft: i === 0 ? 0 : -8,
                      background:
                        m.role === 'owner'
                          ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                          : m.role === 'editor'
                            ? 'linear-gradient(135deg,#60A5FA,#2563EB)'
                            : 'linear-gradient(135deg,#D1D5DB,#9CA3AF)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      cursor: 'default',
                      overflow: 'hidden',
                    }}
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      initial
                    )}
                  </div>
                )
              })}
              {onlineMembers.length > 5 && (
                <div
                  title={`${onlineMembers.length - 5} flere online`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    marginLeft: -8,
                    background: '#E5E7EB',
                    color: '#374151',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +{onlineMembers.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          INFINITE CANVAS
      ════════════════════════════════════════════════ */}
      {activeWorkspaceTab === 'board' && (
        <>
          {showFlowPanel && (
            <div
              style={{
                position: 'fixed',
                bottom: 82,
                left: boardSidebarWidth + 16,
                width: 248,
                maxHeight: 'calc(100vh - 190px)',
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
                        border: 'none',
                        borderRadius: getFlowNodeStyle(item.shape).borderRadius > 20 ? 999 : 6,
                        clipPath: getFlowNodeStyle(item.shape).clipPath,
                        background: draggingPaletteShape === item.shape ? '#FEF3C7' : '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
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
          <div
            style={{
              position: 'fixed',
              left: boardToolbarLeft,
              bottom: 20,
              transform: 'translateX(-50%)',
              zIndex: 145,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: '#FFFFFF',
              borderRadius: 9999,
              padding: '6px 8px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
              maxWidth: 'calc(100vw - 24px)',
              overflowX: 'auto',
            }}
            role="toolbar"
            aria-label="Board værktøjer"
          >
            <button
              type="button"
              title="Markér"
              aria-label="Markér"
              aria-pressed={!handPanTool}
              onClick={() => setHandPanTool(false)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: !handPanTool ? '#A259FF' : 'transparent',
                color: !handPanTool ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4.5 3.5l6.5 17 2.2-6.5 6.5-2.2L4.5 3.5z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              title="Hånd (pan)"
              aria-label="Hånd — træk for at flytte boardet"
              aria-pressed={handPanTool}
              onClick={() => setHandPanTool(true)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: handPanTool ? '#A259FF' : 'transparent',
                color: handPanTool ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M8 5.5V4a1.5 1.5 0 013 0v8.5M11 5.5V3a1.5 1.5 0 013 0v10M14 5.5V4a1.5 1.5 0 013 0v7.5a4 4 0 01-1.7 3.3l-3.6 2.4a2 2 0 01-2.6-.5L7 14.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div style={{ width: 1, height: 22, background: '#E5E7EB', alignSelf: 'center', flexShrink: 0, margin: '0 4px' }} />
            <button
              type="button"
              title="Flowchart & former"
              aria-label="Flowchart og former"
              aria-pressed={showFlowPanel}
              onClick={() => {
                setShowFlowPanel(v => !v)
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: showFlowPanel ? '#A259FF' : 'transparent',
                color: showFlowPanel ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.75" />
                <rect x="14" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.75" />
                <path d="M6.5 9v3.5M17.5 9v3.5M12 12.5v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <rect x="6" y="16" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </button>
            <button
              type="button"
              title="Sticky note"
              aria-label="Tilføj sticky note"
              disabled={!canEdit}
              onClick={() => {
                addStickyNote()
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: 'transparent',
                color: canEdit ? '#374151' : '#9CA3AF',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6 4.5h12a1.5 1.5 0 011.5 1.5v10.5L15 19.5H6A1.5 1.5 0 014.5 18V6A1.5 1.5 0 016 4.5z"
                  fill="#DCFCE7"
                  stroke="#15803D"
                  strokeWidth="1.25"
                />
                <path d="M15 4.5v5h4.5" fill="#BBF7D0" stroke="#15803D" strokeWidth="1.25" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              title="Tekstfelt — frit tekst på boardet"
              aria-label="Indsæt tekstfelt på boardet"
              disabled={!canEdit}
              onClick={() => {
                addBoardFreeText()
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: 'transparent',
                color: canEdit ? '#374151' : '#9CA3AF',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M5 5.5h14v2.6H13.6V19h-3.2V8.1H5V5.5z" />
              </svg>
            </button>
            <button
              type="button"
              title="Sektion — træk på boardet for størrelse (Esc afbryder)"
              aria-label="Tegn sektion på boardet"
              aria-pressed={sectionDrawMode}
              disabled={!canEdit}
              onClick={() => {
                setHandPanTool(false)
                setSectionDrawMode(v => {
                  if (v) {
                    isSectionPlacementDragging.current = false
                    sectionPlacementStartRef.current = null
                    setSectionPlacementDraft(null)
                  }
                  return !v
                })
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: sectionDrawMode ? '#A259FF' : 'transparent',
                color: sectionDrawMode ? '#fff' : canEdit ? '#374151' : '#9CA3AF',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="5" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
                <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </button>
            <div style={{ width: 1, height: 22, background: '#E5E7EB', alignSelf: 'center', flexShrink: 0, margin: '0 4px' }} />
            <button
              type="button"
              title="Kommentar"
              aria-label="Tilføj kommentar"
              disabled={!canEdit}
              onClick={() => {
                addBoardComment()
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: 'transparent',
                color: canEdit ? '#374151' : '#9CA3AF',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5h-5.2L8 20.5v-4H5A1.5 1.5 0 013.5 15V7A1.5 1.5 0 015 5.5z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              title="Kommentarer"
              aria-label="Åbn kommentarpanel"
              aria-pressed={showPanel === 'comments'}
              onClick={() => {
                setShowPanel(p => (p === 'comments' ? null : 'comments'))
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: showPanel === 'comments' ? '#A259FF' : 'transparent',
                color: showPanel === 'comments' ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
                position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16H11l-4.2 3.1V16H7a2.5 2.5 0 0 1-2.5-2.5v-7z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
              {boardComments.some(c => !c.resolved) && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '999px',
                    background: showPanel === 'comments' ? '#FDE68A' : '#EF4444',
                  }}
                />
              )}
            </button>
            <div style={{ width: 1, height: 22, background: '#E5E7EB', alignSelf: 'center', flexShrink: 0, margin: '0 4px' }} />
            <button
              type="button"
              title="Tilføj værktøj til projektet"
              aria-label="Tilføj værktøj — åbn værktøjsvælger"
              aria-pressed={showAddTool}
              disabled={!canEdit || modifying}
              onClick={() => {
                setHandPanTool(false)
                setShowAddTool(true)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: showAddTool ? '#A259FF' : 'transparent',
                color: showAddTool ? '#fff' : canEdit ? '#374151' : '#9CA3AF',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <LayoutTemplate size={20} strokeWidth={2} color="currentColor" aria-hidden />
            </button>
            <button
              type="button"
              title="Live chat"
              aria-label="Åbn live chat"
              aria-pressed={showPanel === 'live-chat'}
              onClick={() => {
                setShowPanel(p => (p === 'live-chat' ? null : 'live-chat'))
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: showPanel === 'live-chat' ? '#A259FF' : 'transparent',
                color: showPanel === 'live-chat' ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <MessageCircle size={18} strokeWidth={1.9} aria-hidden />
            </button>
            <button
              type="button"
              title="Indstillinger"
              aria-label="Indstillinger"
              aria-pressed={showPanel === 'settings'}
              onClick={() => {
                setShowPanel(p => (p === 'settings' ? null : 'settings'))
                setHandPanTool(false)
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                background: showPanel === 'settings' ? '#A259FF' : 'transparent',
                color: showPanel === 'settings' ? '#fff' : '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </>
      )}
      {activeWorkspaceTab === 'slides' ? (
        <ProjectSlidesTab
          projectId={projectId}
          canEdit={canEdit}
          contentInsetLeftPx={0}
        />
      ) : activeWorkspaceTab === 'files' ? (
        <ProjectFilesTab projectId={projectId} canEdit={canEdit} />
      ) : activeWorkspaceTab === 'survey' ? (
      <ToolEmbedProvider projectId={projectId}>
        <div
          style={{
            ...workspaceContentFrame,
            background: '#EEF2F7',
            padding: '28px 32px 40px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
              minHeight: 'min(72vh, 720px)',
            }}
          >
            {SurveyTemplateComponent ? (
              <SurveyTemplateComponent />
            ) : (
              <div style={{ padding: 24, color: '#6B7280', fontSize: 14 }}>
                Survey Template er ikke tilgængelig lige nu.
              </div>
            )}
          </div>
        </div>
      </ToolEmbedProvider>
      ) : activeWorkspaceTab === 'card-sorting' ? (
      <ToolEmbedProvider projectId={projectId}>
        <div
          style={{
            ...workspaceContentFrame,
            background: '#EEF2F7',
            padding: '28px 32px 40px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
              minHeight: 'min(72vh, 720px)',
            }}
          >
            {CardSortingComponent ? (
              <CardSortingComponent />
            ) : (
              <div style={{ padding: 24, color: '#6B7280', fontSize: 14 }}>
                Kortsortering er ikke tilgængelig lige nu.
              </div>
            )}
          </div>
        </div>
      </ToolEmbedProvider>
      ) : activeWorkspaceTab === 'qr' ? (
      <ToolEmbedProvider projectId={projectId}>
        <div
          style={{
            ...workspaceContentFrame,
            background: '#EEF2F7',
            padding: '28px 32px 40px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
              minHeight: 'min(72vh, 720px)',
            }}
          >
            {QrGeneratorComponent ? (
              <QrGeneratorComponent />
            ) : (
              <div style={{ padding: 24, color: '#6B7280', fontSize: 14 }}>
                QR Generator er ikke tilgængelig lige nu.
              </div>
            )}
          </div>
        </div>
      </ToolEmbedProvider>
      ) : activeWorkspaceTab === 'planning' ? (
      <ToolEmbedProvider projectId={projectId}>
        <div
          style={{
            ...workspaceContentFrame,
            background: '#EEF2F7',
            padding: '28px 32px 40px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: planningWideLayout ? '1fr' : '1fr 1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {planningDualMode && KanbanComponent && GanttComponent ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  maxWidth: 1100,
                  margin: '0 auto',
                  height: 'min(72vh, 720px)',
                  maxHeight: 'min(72vh, 720px)',
                  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#1F2937',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Plan
                  </span>
                  <div
                    role="tablist"
                    aria-label="Vælg planlægningsvisning"
                    style={{
                      display: 'flex',
                      gap: 2,
                      background: '#F1F5F9',
                      padding: 3,
                      borderRadius: 10,
                    }}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePlanningPane === 'kanban'}
                      onClick={() => setPlanningPane('kanban')}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: activePlanningPane === 'kanban' ? '#111827' : 'transparent',
                        color: activePlanningPane === 'kanban' ? '#fff' : '#6B7280',
                      }}
                    >
                      Kanban
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePlanningPane === 'gantt'}
                      onClick={() => setPlanningPane('gantt')}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: activePlanningPane === 'gantt' ? '#111827' : 'transparent',
                        color: activePlanningPane === 'gantt' ? '#fff' : '#6B7280',
                      }}
                    >
                      Gantt
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'auto',
                      visibility: activePlanningPane === 'kanban' ? 'visible' : 'hidden',
                      pointerEvents: activePlanningPane === 'kanban' ? 'auto' : 'none',
                    }}
                  >
                    <KanbanComponent />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'auto',
                      visibility: activePlanningPane === 'gantt' ? 'visible' : 'hidden',
                      pointerEvents: activePlanningPane === 'gantt' ? 'auto' : 'none',
                    }}
                  >
                    <GanttComponent />
                  </div>
                </div>
              </div>
            ) : planningSingleToolMode && kanbanReady && KanbanComponent ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  maxWidth: 1100,
                  margin: '0 auto',
                  height: 'min(72vh, 720px)',
                  maxHeight: 'min(72vh, 720px)',
                  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Kanban
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <KanbanComponent />
                </div>
              </div>
            ) : planningSingleToolMode && ganttReady && GanttComponent ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  maxWidth: 1100,
                  margin: '0 auto',
                  height: 'min(72vh, 720px)',
                  maxHeight: 'min(72vh, 720px)',
                  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Gantt
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <GanttComponent />
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'min(56vh, 480px)',
                    maxHeight: 'min(56vh, 480px)',
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    Kanban
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {kanbanReady && KanbanComponent ? (
                      <KanbanComponent />
                    ) : (
                      <div style={{ margin: 12, display: 'grid', gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                          Tilføj værktøjet <strong>Kanban</strong> for at arbejde her.
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={!canEdit || modifying}
                            onClick={() => {
                              void handleAddTool('kanban')
                            }}
                            style={{
                              border: 'none',
                              borderRadius: 10,
                              background: canEdit ? '#111827' : '#E5E7EB',
                              color: canEdit ? '#FFFFFF' : '#9CA3AF',
                              padding: '8px 11px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                            }}
                          >
                            + Tilføj Kanban
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => {
                              setShowPanel(null)
                              setShowAddTool(true)
                            }}
                            style={{
                              border: '1px solid #D1D5DB',
                              borderRadius: 10,
                              background: '#FFFFFF',
                              color: canEdit ? '#374151' : '#9CA3AF',
                              padding: '8px 11px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Åbn værktøjsvælger
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'min(56vh, 480px)',
                    maxHeight: 'min(56vh, 480px)',
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 800, color: '#1F2937', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    Gantt
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {ganttReady && GanttComponent ? (
                      <GanttComponent />
                    ) : (
                      <div style={{ margin: 12, display: 'grid', gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                          Tilføj værktøjet <strong>Gantt</strong> for at arbejde her.
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={!canEdit || modifying}
                            onClick={() => {
                              void handleAddTool('gantt-chart')
                            }}
                            style={{
                              border: 'none',
                              borderRadius: 10,
                              background: canEdit ? '#111827' : '#E5E7EB',
                              color: canEdit ? '#FFFFFF' : '#9CA3AF',
                              padding: '8px 11px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                            }}
                          >
                            + Tilføj Gantt
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => {
                              setShowPanel(null)
                              setShowAddTool(true)
                            }}
                            style={{
                              border: '1px solid #D1D5DB',
                              borderRadius: 10,
                              background: '#FFFFFF',
                              color: canEdit ? '#374151' : '#9CA3AF',
                              padding: '8px 11px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Åbn værktøjsvælger
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </ToolEmbedProvider>
      ) : (
      <ToolEmbedProvider projectId={projectId}>
        <div
        ref={canvasRef}
        className="canvas-bg"
        style={{
          ...workspaceContentFrame,
          cursor: isPanningActive
            ? 'grabbing'
            : isSpacePressed || handPanTool
              ? 'grab'
              : sectionDrawMode
                ? 'crosshair'
                : 'default',
          backgroundImage: 'radial-gradient(circle, #C5C1BB 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x % (24 * zoom)}px ${pan.y % (24 * zoom)}px`,
          touchAction: 'none',
          overscrollBehaviorX: 'none',
        }}
        onMouseEnter={() => {
          isPointerOverCanvasRef.current = true
        }}
        onMouseLeave={() => {
          isPointerOverCanvasRef.current = false
          localCursorPointRef.current.visible = false
          void broadcastCursor(0, 0, false)
          if (isSectionPlacementDragging.current) {
            isSectionPlacementDragging.current = false
            sectionPlacementStartRef.current = null
            setSectionPlacementDraft(null)
          }
          onCanvasMouseUp()
        }}
        onMouseDown={onCanvasMouseDown}
        onContextMenu={e => {
          const target = e.target as HTMLElement
          if (!target.classList.contains('canvas-bg') && target !== canvasRef.current) return
          e.preventDefault()
          if (!canEdit) return
          const point = getCanvasWorldPoint(e.clientX, e.clientY)
          setSelectedCardSlugs([])
          setSelectedFlowNodeIds([])
          setSelectedFlowNodeId(null)
          setSelectedStickyNoteIds([])
          setSelectedSectionIds([])
          setSelectedCommentIds([])
          setSelectedImageIds([])
          setSelectedFreeTextIds([])
          setContextMenu({
            type: 'canvas',
            x: e.clientX,
            y: e.clientY,
            worldX: point.x,
            worldY: point.y,
          })
        }}
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
        <input
          ref={boardImageFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          aria-hidden
          onChange={e => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file || !file.type.startsWith('image/')) return
            const reader = new FileReader()
            reader.onload = () => {
              const data = reader.result
              if (typeof data !== 'string') return
              addBoardImageFromSrc(data, pendingImageWorldRef.current ?? undefined)
              pendingImageWorldRef.current = null
            }
            reader.readAsDataURL(file)
          }}
        />
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
          {isBoardEmpty && (
            <div style={{
              position: 'absolute', top: 200, left: 300,
              textAlign: 'center', userSelect: 'none', pointerEvents: 'none',
              width: 320,
            }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                <Toolbox size={64} strokeWidth={1.7} color="#6B7280" aria-hidden />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#6B7280', margin: 0 }}>Boardet er tomt</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Klik på <strong>værktøjsikonet</strong> i toolbaren øverst for at tilføje</p>
            </div>
          )}

          {boardSections.map((section, sIdx) => {
            const isSelected = selectedSectionIds.includes(section.id)
            const titleOutside = zoom >= SECTION_TITLE_EXTERNAL_ZOOM
            const sectionBorder = isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB'
            const sectionTitleInputStyle: CSSProperties = {
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              fontWeight: 700,
              color: '#111827',
              cursor: canEdit ? 'text' : 'default',
            }
            const sectionIconPillStyle: CSSProperties = {
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: '#111827',
            }
            const sectionTitlePillStyle: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              minHeight: 28,
              padding: '0 10px',
              borderRadius: 6,
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              flex: 1,
              minWidth: 0,
              maxWidth: titleOutside ? Math.max(96, section.width - 44) : undefined,
            }

            const titleRow = (
              <>
                <div style={sectionIconPillStyle} aria-hidden>
                  <LayoutTemplate size={14} strokeWidth={2} />
                </div>
                <div style={sectionTitlePillStyle}>
                  <input
                    value={section.title}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => {
                      const nextTitle = e.target.value
                      setBoardSections(prev => {
                        const next = prev.map(item => (item.id === section.id ? { ...item, title: nextTitle } : item))
                        persistFlowchart(flowNodes, flowEdges, stickyNotes, next, boardComments)
                        return next
                      })
                    }}
                    disabled={!canEdit}
                    style={sectionTitleInputStyle}
                  />
                </div>
              </>
            )

            return (
              <div
                key={section.id}
                onContextMenu={e => {
                  const t = e.target as HTMLElement
                  if (t.closest('input, textarea, button, [data-section-resize]')) return
                  openBoardShapeContextMenu(e, 'section', section.id)
                }}
                onMouseDown={e => {
                  const t = e.target as HTMLElement
                  if (t.closest('[data-section-resize]')) return
                  if (t.closest('input, textarea, button')) return
                  onSectionMouseDown(e, section.id)
                }}
                style={{
                  position: 'absolute',
                  left: section.x,
                  top: section.y,
                  width: section.width,
                  height: section.height,
                  zIndex: getBoardSectionZIndex(sIdx),
                  cursor:
                    activeSectionDragId === section.id
                      ? 'grabbing'
                      : canEdit
                        ? 'grab'
                        : 'default',
                  userSelect: 'none',
                }}
              >
                {titleOutside && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: '100%',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      zIndex: 8,
                      pointerEvents: 'auto',
                    }}
                  >
                    {titleRow}
                  </div>
                )}
                <div
                  ref={el => {
                    sectionExportRefs.current[section.id] = el
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: 12,
                    border: sectionBorder,
                    background: '#FFFFFF',
                    boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.14)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {!titleOutside && (
                    <div
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 10px',
                        borderBottom: '1px solid #F3F4F6',
                        background: '#FAFAFA',
                      }}
                    >
                      {titleRow}
                    </div>
                  )}
                  <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF' }} />
                </div>
              </div>
            )
          })}

          {boardImages.map((im, imIdx) => {
            const isSelected = selectedImageIds.includes(im.id)
            const imageZ = resolveBoardZIndex(
              52 + imIdx,
              getSectionContentZFloor(worldBoundsFromRect(im.x, im.y, im.width, im.height))
            )
            return (
              <div
                key={im.id}
                ref={el => {
                  boardImageRefs.current[im.id] = el
                }}
                onContextMenu={e => {
                  if (!canEdit) return
                  e.preventDefault()
                  e.stopPropagation()
                  openBoardShapeContextMenu(e, 'image', im.id)
                }}
                onMouseDown={e => onBoardImageMouseDown(e, im.id)}
                style={{
                  position: 'absolute',
                  left: im.x,
                  top: im.y,
                  width: im.width,
                  height: im.height,
                  zIndex: imageZ,
                  borderRadius: 10,
                  border: isSelected ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  background: '#fff',
                  boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.12), 0 8px 22px rgba(0,0,0,0.1)' : '0 4px 14px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  cursor: canEdit ? 'grab' : 'default',
                  userSelect: 'none',
                }}
              >
                <img
                  src={im.src}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            )
          })}

          {/* ── Flowchart edges + noder ─────────────────── */}
          {flowNodes.length > 0 && (
            <>
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: resolveBoardZIndex(2, flowEdgeZFloor),
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
                const isSelected = selectedFlowNodeIds.includes(node.id)
                const showConnectors = hoveredFlowNodeId === node.id || isSelected || isLinkSource
                const dim = getFlowNodeDimensions(node)
                const flowNodeZ = resolveBoardZIndex(
                  3,
                  getSectionContentZFloor(worldBoundsFromRect(node.x, node.y, dim.width, dim.height))
                )
                const isDecisionShape = node.shape === 'decision'
                /** Diamant er smal mod spidser — lodrette indryk så tekst ligger i det bredere midterbånd */
                const diamondPadV = isDecisionShape ? Math.max(14, Math.round(dim.height * 0.33)) : 0
                return (
                  <div
                    key={node.id}
                    ref={el => {
                      flowNodeExportRefs.current[node.id] = el
                    }}
                    style={{
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: dim.width,
                      height: dim.height,
                      zIndex: flowNodeZ,
                      transform: 'translateZ(0)',
                      userSelect: 'none',
                      overflow: 'visible',
                    }}
                    onMouseDown={e => onFlowNodeCardMouseDown(e, node.id)}
                    onContextMenu={e => {
                      if (!canEdit) return
                      const t = boardPointerTargetElement(e.target)
                      if (
                        t &&
                        (t.hasAttribute('data-flow-resize') ||
                          t.closest('[data-flow-resize]') ||
                          t.hasAttribute('data-flow-editor') ||
                          t.closest('[data-flow-editor]') ||
                          t.tagName === 'TEXTAREA' ||
                          t.tagName === 'INPUT' ||
                          t.closest('button'))
                      ) {
                        return
                      }
                      openBoardShapeContextMenu(e, 'flow', node.id)
                    }}
                    onMouseEnter={() => setHoveredFlowNodeId(node.id)}
                    onMouseLeave={() => setHoveredFlowNodeId(prev => (prev === node.id ? null : prev))}
                  >
                    {/* clipPath kun på selve figuren — ellers klippes connector-punkter halvt væk */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        minHeight: 0,
                        background: node.fillColor && node.fillColor !== '#FFFFFF' ? node.fillColor : '#fff',
                        border: 'none',
                        borderRadius: dim.borderRadius,
                        clipPath: dim.clipPath,
                        boxShadow: isLinkSource
                          ? '0 0 0 3px rgba(245,158,11,0.35), 0 8px 20px rgba(0,0,0,0.12)'
                          : isSelected
                            ? '0 0 0 3px rgba(37,99,235,0.35), 0 8px 20px rgba(0,0,0,0.12)'
                            : '0 8px 20px rgba(0,0,0,0.09)',
                        ...(isDecisionShape
                          ? {
                              paddingTop: diamondPadV,
                              paddingBottom: diamondPadV,
                              /* ~17% pr. side → ~66% tekstbredde, matcher diamantens bredde ved ~33% fra spids */
                              paddingLeft: 'max(10px, 17%)',
                              paddingRight: 'max(10px, 17%)',
                              justifyContent: 'center' as const,
                            }
                          : { padding: 10 }),
                        display: 'flex',
                        flexDirection: 'column',
                        pointerEvents: 'auto',
                      }}
                    >
                      <StickyNoteBodyEditor
                        noteId={node.id}
                        text={node.label}
                        format={mergeStickyFormat(node.format, {})}
                        disabled={!canEdit}
                        isSelected={isSelected}
                        onRequestSelect={selectFlowNodeForEditor}
                        onCommitHtml={commitFlowNodeHtml}
                        registerEditor={registerFlowNodeEditor}
                        variant="flow"
                      />
                    </div>
                    {canEdit && isSelected ? (
                      <button
                        type="button"
                        data-flow-resize=""
                        title="Træk — størrelse følger board-gitter (24 px)"
                        aria-label="Ændr størrelse hjørne sydøst"
                        onMouseDown={e => onFlowNodeResizeMouseDown(e, node.id, 'se')}
                        style={{
                          position: 'absolute',
                          right: -6,
                          bottom: -6,
                          width: 11,
                          height: 11,
                          background: '#fff',
                          border: '2px solid #2563EB',
                          borderRadius: 2,
                          padding: 0,
                          zIndex: 8,
                          boxSizing: 'border-box',
                          cursor: 'nwse-resize',
                        }}
                      />
                    ) : null}
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
                        opacity: showConnectors ? 1 : 0,
                        pointerEvents: showConnectors ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                        zIndex: 5,
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
                        opacity: showConnectors ? 1 : 0,
                        pointerEvents: showConnectors ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                        zIndex: 5,
                      }}
                    />
                    <button
                      type="button"
                      onMouseDown={e => startEdgeDrag(e, node.id, 'right')}
                      title="Træk pil fra højre"
                      style={{
                        position: 'absolute',
                        right: -7,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        background: '#F59E0B',
                        cursor: 'crosshair',
                        boxShadow: '0 2px 7px rgba(0,0,0,0.22)',
                        opacity: showConnectors ? 1 : 0,
                        pointerEvents: showConnectors ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                        zIndex: 5,
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
                        opacity: showConnectors ? 1 : 0,
                        pointerEvents: showConnectors ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                        zIndex: 5,
                      }}
                    />
                  </div>
                )
              })}
            </>
          )}

          {stickyNotes.map(note => {
            const isSelected = selectedStickyNoteIds.includes(note.id)
            const hasGoldGlow = Boolean(stickyGoldGlowIds[note.id] && stickyGoldGlowIds[note.id] > Date.now())
            const author = (note.createdBy || currentUsername || 'Dig').trim() || 'Dig'
            const noteFormat = mergeStickyFormat(note.format, {})
            const { w: stickyW, h: stickyH } = getStickyNoteSize(note)
            const stickyZ = resolveBoardZIndex(
              4,
              getSectionContentZFloor(worldBoundsFromRect(note.x, note.y, stickyW, stickyH))
            )
            const stickyPlusStyle: CSSProperties = {
              position: 'absolute',
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '2px solid #fff',
              background: '#2563EB',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: '0 2px 12px rgba(37,99,235,0.45)',
              zIndex: 6,
            }
            return (
              <div
                key={note.id}
                ref={el => {
                  stickyExportRefs.current[note.id] = el
                }}
                onMouseDown={e => onStickyNoteCardMouseDown(e, note.id)}
                onContextMenu={e => {
                  const t = boardPointerTargetElement(e.target)
                  if (
                    t &&
                    (t.hasAttribute('data-sticky-editor') ||
                      t.closest('[data-sticky-editor]') ||
                      t.hasAttribute('data-sticky-resize') ||
                      t.closest('[data-sticky-resize]') ||
                      t.closest('button'))
                  ) {
                    return
                  }
                  openBoardShapeContextMenu(e, 'sticky', note.id)
                }}
                style={{
                  position: 'absolute',
                  left: note.x,
                  top: note.y,
                  width: stickyW,
                  height: stickyH,
                  borderRadius: 0,
                  border: 'none',
                  background: note.color,
                  boxShadow: hasGoldGlow
                    ? '0 0 0 2px #F59E0B, 0 0 0 6px rgba(245,158,11,0.24), 0 0 26px rgba(245,158,11,0.5), 4px 6px 18px rgba(0,0,0,0.14)'
                    : isSelected
                      ? '0 0 0 2px #2563EB, 4px 6px 18px rgba(0,0,0,0.14), 2px 3px 8px rgba(0,0,0,0.08)'
                      : '4px 6px 18px rgba(0,0,0,0.12), 2px 3px 8px rgba(0,0,0,0.07)',
                  zIndex: stickyZ,
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: canEdit ? 'grab' : 'default',
                  boxSizing: 'border-box',
                }}
              >
                {canEdit && isSelected ? (
                  <>
                    <button
                      type="button"
                      title="Ny sticky med samme typografi og farve (ovenfor, uden tekst)"
                      aria-label="Ny sticky ovenfor"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        addStickyNeighbor(note, 'n')
                      }}
                      style={{ ...stickyPlusStyle, left: '50%', top: -14, transform: 'translateX(-50%)' }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      title="Ny sticky til højre"
                      aria-label="Ny sticky til højre"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        addStickyNeighbor(note, 'e')
                      }}
                      style={{ ...stickyPlusStyle, right: -14, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      title="Ny sticky under"
                      aria-label="Ny sticky under"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        addStickyNeighbor(note, 's')
                      }}
                      style={{ ...stickyPlusStyle, left: '50%', bottom: -14, transform: 'translateX(-50%)' }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      title="Ny sticky til venstre"
                      aria-label="Ny sticky til venstre"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        addStickyNeighbor(note, 'w')
                      }}
                      style={{ ...stickyPlusStyle, left: -14, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      data-sticky-resize=""
                      title="Træk — størrelse følger board-gitter (24 px)"
                      aria-label="Ændr størrelse hjørne nordvest"
                      onMouseDown={e => onStickyResizeMouseDown(e, note.id, 'nw')}
                      style={{
                        position: 'absolute',
                        left: -6,
                        top: -6,
                        width: 11,
                        height: 11,
                        background: '#fff',
                        border: '2px solid #2563EB',
                        borderRadius: 2,
                        padding: 0,
                        zIndex: 8,
                        boxSizing: 'border-box',
                        cursor: 'nwse-resize',
                      }}
                    />
                    <button
                      type="button"
                      data-sticky-resize=""
                      title="Træk — størrelse følger board-gitter (24 px)"
                      aria-label="Ændr størrelse hjørne nordøst"
                      onMouseDown={e => onStickyResizeMouseDown(e, note.id, 'ne')}
                      style={{
                        position: 'absolute',
                        right: -6,
                        top: -6,
                        width: 11,
                        height: 11,
                        background: '#fff',
                        border: '2px solid #2563EB',
                        borderRadius: 2,
                        padding: 0,
                        zIndex: 8,
                        boxSizing: 'border-box',
                        cursor: 'nesw-resize',
                      }}
                    />
                    <button
                      type="button"
                      data-sticky-resize=""
                      title="Træk — størrelse følger board-gitter (24 px)"
                      aria-label="Ændr størrelse hjørne sydvest"
                      onMouseDown={e => onStickyResizeMouseDown(e, note.id, 'sw')}
                      style={{
                        position: 'absolute',
                        left: -6,
                        bottom: -6,
                        width: 11,
                        height: 11,
                        background: '#fff',
                        border: '2px solid #2563EB',
                        borderRadius: 2,
                        padding: 0,
                        zIndex: 8,
                        boxSizing: 'border-box',
                        cursor: 'nesw-resize',
                      }}
                    />
                    <button
                      type="button"
                      data-sticky-resize=""
                      title="Træk — størrelse følger board-gitter (24 px)"
                      aria-label="Ændr størrelse hjørne sydøst"
                      onMouseDown={e => onStickyResizeMouseDown(e, note.id, 'se')}
                      style={{
                        position: 'absolute',
                        right: -6,
                        bottom: -6,
                        width: 11,
                        height: 11,
                        background: '#fff',
                        border: '2px solid #2563EB',
                        borderRadius: 2,
                        padding: 0,
                        zIndex: 8,
                        boxSizing: 'border-box',
                        cursor: 'nwse-resize',
                      }}
                    />
                  </>
                ) : null}
                <StickyNoteBodyEditor
                  noteId={note.id}
                  text={note.text}
                  format={noteFormat}
                  disabled={!canEdit}
                  isSelected={isSelected}
                  onRequestSelect={selectStickyNote}
                  onCommitHtml={commitStickyHtml}
                  registerEditor={registerStickyEditor}
                />
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 8,
                    padding: '6px 10px 10px',
                    minHeight: 30,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      lineHeight: 1.2,
                      color: 'rgba(45, 42, 38, 0.55)',
                      fontWeight: 500,
                      userSelect: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {author}
                  </span>
                </div>
              </div>
            )
          })}

          {boardFreeTexts.map(ft => {
            const isSelected = selectedFreeTextIds.includes(ft.id)
            const { w: ftW, h: ftH } = getFreeTextSize(ft)
            const freeTextZ = resolveBoardZIndex(
              4,
              getSectionContentZFloor(worldBoundsFromRect(ft.x, ft.y, ftW, ftH))
            )
            const fontPx = getFreeTextFontSizePx(ft)
            const ftResizeBtn: CSSProperties = {
              position: 'absolute',
              width: 8,
              height: 8,
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #2563EB',
              borderRadius: 1,
              padding: 0,
              zIndex: 8,
              boxSizing: 'border-box',
            }
            return (
              <div
                key={ft.id}
                data-board-free-text={ft.id}
                onMouseDown={e => onFreeTextCardMouseDown(e, ft.id)}
                onContextMenu={e => {
                  const t = boardPointerTargetElement(e.target)
                  if (t?.tagName === 'TEXTAREA') return
                  openBoardShapeContextMenu(e, 'freeText', ft.id)
                }}
                style={{
                  position: 'absolute',
                  left: ft.x,
                  top: ft.y,
                  width: ftW,
                  height: ftH,
                  zIndex: freeTextZ,
                  boxSizing: 'border-box',
                  borderRadius: 0,
                  border: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'default',
                  overflow: 'visible',
                }}
              >
                {canEdit && isSelected ? (
                  <>
                    <button
                      type="button"
                      data-free-text-resize=""
                      title="Ændr størrelse (nordvest)"
                      aria-label="Ændr størrelse hjørne nordvest"
                      onMouseDown={e => onFreeTextResizeMouseDown(e, ft.id, 'nw')}
                      style={{ ...ftResizeBtn, left: -5, top: -5, cursor: 'nwse-resize' }}
                    />
                    <button
                      type="button"
                      data-free-text-resize=""
                      title="Ændr størrelse (nordøst)"
                      aria-label="Ændr størrelse hjørne nordøst"
                      onMouseDown={e => onFreeTextResizeMouseDown(e, ft.id, 'ne')}
                      style={{ ...ftResizeBtn, right: -5, top: -5, cursor: 'nesw-resize' }}
                    />
                    <button
                      type="button"
                      data-free-text-resize=""
                      title="Ændr størrelse (sydvest)"
                      aria-label="Ændr størrelse hjørne sydvest"
                      onMouseDown={e => onFreeTextResizeMouseDown(e, ft.id, 'sw')}
                      style={{ ...ftResizeBtn, left: -5, bottom: -5, cursor: 'nesw-resize' }}
                    />
                    <button
                      type="button"
                      data-free-text-resize=""
                      title="Ændr størrelse (sydøst)"
                      aria-label="Ændr størrelse hjørne sydøst"
                      onMouseDown={e => onFreeTextResizeMouseDown(e, ft.id, 'se')}
                      style={{ ...ftResizeBtn, right: -5, bottom: -5, cursor: 'nwse-resize' }}
                    />
                  </>
                ) : null}
                <textarea
                  value={ft.text}
                  data-free-text-id={ft.id}
                  onBlur={() => scheduleRemoveEmptyFreeTextOnBlur(ft.id)}
                  onChange={e => {
                    const nextText = e.target.value
                    setBoardFreeTexts(prev => {
                      const next = prev.map(item => (item.id === ft.id ? { ...item, text: nextText } : item))
                      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, boardComments, boardImages, next)
                      return next
                    })
                  }}
                  disabled={!canEdit}
                  placeholder=""
                  style={{
                    flex: 1,
                    width: '100%',
                    minHeight: 0,
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    resize: 'none',
                    outline: 'none',
                    fontSize: fontPx,
                    lineHeight: 1.45,
                    color: '#0F172A',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )
          })}

          {boardComments.filter(comment => !comment.parentId && !comment.resolved).map(comment => {
            const isSelected = selectedCommentIds.includes(comment.id)
            const commentBounds = isSelected
              ? worldBoundsFromRect(comment.x, comment.y, BOARD_COMMENT_CARD_WIDTH, 220)
              : worldBoundsFromRect(comment.x, comment.y, BOARD_COMMENT_PIN_SIZE, BOARD_COMMENT_PIN_SIZE)
            const commentZ = resolveBoardZIndex(4, getSectionContentZFloor(commentBounds))
            const commentInitial = (comment.createdBy || '?').trim().charAt(0).toUpperCase()
            const createdAtLabel = new Date(comment.createdAt || Date.now()).toLocaleTimeString('da-DK', {
              hour: '2-digit',
              minute: '2-digit',
            })
            if (!isSelected) {
              return (
                <div
                  key={comment.id}
                  onContextMenu={e => openBoardShapeContextMenu(e, 'comment', comment.id)}
                  onClick={e => {
                    e.stopPropagation()
                    const additive = e.metaKey || e.ctrlKey || e.shiftKey
                    if (!additive) {
                      setSelectedCommentIds([comment.id])
                      return
                    }
                    setSelectedCommentIds(prev => (prev.includes(comment.id) ? prev : [...prev, comment.id]))
                  }}
                  style={{
                    position: 'absolute',
                    left: comment.x,
                    top: comment.y,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: commentZ,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '999px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      boxShadow: '0 6px 16px rgba(15,23,42,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      onMouseDown={e => onCommentMouseDown(e, comment.id)}
                      title={comment.text.trim() ? 'Klik for at åbne kommentar' : 'Tom kommentar'}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '999px',
                        background: '#2563EB',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        userSelect: 'none',
                        cursor: canEdit ? 'grab' : 'pointer',
                      }}
                    >
                      {commentInitial}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      lineHeight: 1,
                      color: '#64748B',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid #E2E8F0',
                      borderRadius: 999,
                      padding: '3px 6px',
                      boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
                      userSelect: 'none',
                    }}
                  >
                    {createdAtLabel}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={comment.id}
                onContextMenu={e => {
                  const t = e.target as HTMLElement
                  if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return
                  openBoardShapeContextMenu(e, 'comment', comment.id)
                }}
                style={{
                  position: 'absolute',
                  left: comment.x,
                  top: comment.y,
                  width: BOARD_COMMENT_CARD_WIDTH,
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                  zIndex: commentZ,
                  animation: 'commentOpen 180ms cubic-bezier(0.2,0.8,0.2,1)',
                  fontFamily: 'inherit',
                }}
              >
                {/* ── Header ── */}
                <div
                  onMouseDown={e => onCommentMouseDown(e, comment.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px 10px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: canEdit ? 'grab' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Kommentar</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, color: '#9CA3AF', letterSpacing: 1, cursor: 'default', lineHeight: 1 }}>···</span>
                    <button
                      type="button"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setCommentResolved(comment.id, true) }}
                      disabled={!canEdit}
                      title="Marker som løst"
                      style={{
                        background: 'none', border: 'none', cursor: canEdit ? 'pointer' : 'not-allowed',
                        color: '#6B7280', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 6,
                        opacity: canEdit ? 1 : 0.4,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation()
                        setBoardComments(prev => {
                          const next = prev.filter(c => c.id !== comment.id && c.parentId !== comment.id)
                          persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                          return next
                        })
                        setSelectedCommentIds(prev => prev.filter(id => id !== comment.id))
                      }}
                      title="Luk"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6B7280', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 6,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Main comment ── */}
                <div style={{ padding: '12px 14px 0' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#5B6E9B', color: '#fff',
                      display: 'grid', placeItems: 'center',
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                    }}>
                      {commentInitial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{comment.createdBy}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{createdAtLabel}</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); setCommentMenuOpenId(commentMenuOpenId === comment.id ? null : comment.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, letterSpacing: 1, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                          >···</button>
                          {commentMenuOpenId === comment.id && (
                            <div
                              onMouseDown={e => e.stopPropagation()}
                              style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                                background: '#fff', border: '1px solid #E5E7EB',
                                borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                zIndex: 99, minWidth: 140, overflow: 'hidden',
                              }}
                            >
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); setEditingCommentId(comment.id); setCommentMenuOpenId(null) }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#111827', textAlign: 'left' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Rediger
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setBoardComments(prev => {
                                      const next = prev.filter(c => c.id !== comment.id && c.parentId !== comment.id)
                                      persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                                      return next
                                    })
                                    setSelectedCommentIds(prev => prev.filter(id => id !== comment.id))
                                    setCommentMenuOpenId(null)
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#EF4444', textAlign: 'left', borderTop: '1px solid #F3F4F6' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                  Slet
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {comment.text && editingCommentId !== comment.id ? (
                        <div>
                          <p
                            style={{ margin: 0, fontSize: 13, color: '#1F2937', lineHeight: 1.5, whiteSpace: 'pre-wrap', cursor: 'text' }}
                            onDoubleClick={() => canEdit && setEditingCommentId(comment.id)}
                          >
                            {comment.text.split(/(@\w+)/g).map((part, i) =>
                              part.startsWith('@')
                                ? <span key={i} style={{ color: '#6366F1', fontWeight: 600 }}>{part}</span>
                                : part
                            )}
                          </p>
                          {comment.images && comment.images.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                              {comment.images.map((src, i) => (
                                <img key={i} src={src} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #E5E7EB', objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => window.open(src, '_blank')} />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <CommentTextArea
                          key={comment.id}
                          initialText={comment.text}
                          autoFocus
                          placeholder="Skriv kommentar..."
                          onCommit={nextText => {
                            const next = boardComments.map(item => item.id === comment.id ? { ...item, text: nextText } : item)
                            setBoardComments(next)
                            persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                            setEditingCommentId(null)
                          }}
                          onCancel={() => setEditingCommentId(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Replies ── */}
                {boardComments.filter(c => c.parentId === comment.id && !c.resolved).map(reply => {
                  const rInitial = (reply.createdBy || '?').charAt(0).toUpperCase()
                  const rTime = new Date(reply.createdAt || Date.now()).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={reply.id} style={{ padding: '10px 14px 0' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#5B6E9B', color: '#fff',
                          display: 'grid', placeItems: 'center',
                          fontSize: 13, fontWeight: 600, flexShrink: 0,
                        }}>
                          {rInitial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{reply.createdBy}</span>
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{rTime}</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onMouseDown={e => e.stopPropagation()}
                                onClick={e => { e.stopPropagation(); setCommentMenuOpenId(commentMenuOpenId === reply.id ? null : reply.id) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, letterSpacing: 1, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                              >···</button>
                              {commentMenuOpenId === reply.id && (
                                <div
                                  onMouseDown={e => e.stopPropagation()}
                                  style={{
                                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                                    background: '#fff', border: '1px solid #E5E7EB',
                                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 99, minWidth: 140, overflow: 'hidden',
                                  }}
                                >
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); setEditingCommentId(reply.id); setCommentMenuOpenId(null) }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#111827', textAlign: 'left' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      Rediger
                                    </button>
                                  )}
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        setBoardComments(prev => {
                                          const next = prev.filter(c => c.id !== reply.id)
                                          persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                                          return next
                                        })
                                        setCommentMenuOpenId(null)
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#EF4444', textAlign: 'left', borderTop: '1px solid #F3F4F6' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                      Slet
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {(reply.text || (reply.images && reply.images.length > 0)) && editingCommentId !== reply.id ? (
                            <div>
                              {reply.text && (
                                <p style={{ margin: 0, fontSize: 13, color: '#1F2937', lineHeight: 1.5, whiteSpace: 'pre-wrap', cursor: 'text' }}
                                  onDoubleClick={() => canEdit && setEditingCommentId(reply.id)}>
                                  {reply.text.split(/(@\w+)/g).map((part, i) =>
                                    part.startsWith('@')
                                      ? <span key={i} style={{ color: '#6366F1', fontWeight: 600 }}>{part}</span>
                                      : part
                                  )}
                                </p>
                              )}
                              {reply.images && reply.images.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: reply.text ? 6 : 0 }}>
                                  {reply.images.map((src, i) => (
                                    <img key={i} src={src} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #E5E7EB', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => window.open(src, '_blank')} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <CommentTextArea
                              key={reply.id}
                              initialText={reply.text}
                              autoFocus
                              onCommit={nextText => {
                                const next = boardComments.map(item => item.id === reply.id ? { ...item, text: nextText } : item)
                                setBoardComments(next)
                                persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                                setEditingCommentId(null)
                              }}
                              onCancel={() => setEditingCommentId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* ── Rich Reply Input ── */}
                {canEdit && (
                  <div onMouseDown={e => e.stopPropagation()}>
                    <CommentReplyInput
                      commentId={comment.id}
                      commentX={comment.x}
                      commentY={comment.y}
                      currentUsername={currentUsername}
                      currentUserId={currentUserId}
                      members={members}
                      onSubmit={(cid, text, imgs) => {
                        const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
                        const newReply: BoardComment = {
                          id, x: comment.x, y: comment.y,
                          text,
                          createdAt: Date.now(),
                          createdBy: currentUsername || currentUserId || 'Unknown',
                          parentId: cid,
                          images: imgs.length > 0 ? imgs : undefined,
                        }
                        const next = [...boardComments, newReply]
                        setBoardComments(next)
                        persistFlowchart(flowNodes, flowEdges, stickyNotes, boardSections, next)
                      }}
                    />
                  </div>
                )}
                
              </div>
            )
          })}

          {Object.values(liveCursors)
            .filter(cursor => cursor.visible)
            .map(cursor => {
              const initial = (cursor.username || 'U').trim().charAt(0).toUpperCase()
              return (
                <div
                  key={cursor.userId}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `translate3d(${cursor.x - 1}px, ${cursor.y - 1}px, 0)`,
                    pointerEvents: 'none',
                    zIndex: 20,
                    willChange: 'transform',
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

          {orbitPortalEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const progress = Math.max(0, Math.min(1, age / 1200))
            const scale = 0.4 + progress * 1.5
            const opacity = 1 - progress
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y,
                  width: 92,
                  height: 92,
                  borderRadius: '50%',
                  border: '3px solid rgba(99,102,241,0.92)',
                  boxShadow: '0 0 24px rgba(99,102,241,0.55), inset 0 0 18px rgba(59,130,246,0.45)',
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  pointerEvents: 'none',
                  zIndex: 22,
                }}
              />
            )
          })}

          {highFiveEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const progress = Math.max(0, Math.min(1, age / 1100))
            const riseY = 16 * progress
            const opacity = 1 - progress
            const handOffset = Math.max(0, 22 - progress * 42)
            const clapPop = progress < 0.5 ? progress * 2 : (1 - progress) * 2
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y - riseY,
                  transform: 'translate(-50%, -50%) scale(1)',
                  pointerEvents: 'none',
                  zIndex: 23,
                  opacity,
                  filter: 'drop-shadow(0 5px 14px rgba(15,23,42,0.28))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 22,
                }}
              >
                <span style={{ transform: `translateX(${handOffset}px)` }}>✋</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    color: '#0F172A',
                    background: 'rgba(255,255,255,0.94)',
                    borderRadius: 999,
                    padding: '2px 8px',
                    transform: `scale(${1 + clapPop * 0.4})`,
                    boxShadow: `0 0 ${8 + clapPop * 16}px rgba(250,204,21,0.55)`,
                  }}
                >
                  CLAP!
                </span>
                <span style={{ transform: `translateX(${-handOffset}px)` }}>🤚</span>
              </div>
            )
          })}

          {soloSparkEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const progress = Math.max(0, Math.min(1, age / 1000))
            const opacity = 1 - progress
            const scale = 0.45 + progress * 1.2
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  pointerEvents: 'none',
                  zIndex: 22,
                  fontSize: 22,
                  filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.65))',
                }}
              >
                ✨
              </div>
            )
          })}

          {soloOrbitEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const progress = Math.max(0, Math.min(1, age / 1200))
            const opacity = 1 - progress
            const rot = progress * 270
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y,
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: '2px dashed rgba(14,165,233,0.9)',
                  boxShadow: '0 0 16px rgba(14,165,233,0.45)',
                  transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${0.7 + progress * 0.6})`,
                  opacity,
                  pointerEvents: 'none',
                  zIndex: 22,
                }}
              />
            )
          })}

          {nightCreatureEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const phase = age / 220
            const driftX = Math.sin(phase) * 14
            const driftY = -16 + Math.cos(phase * 1.4) * 8
            const opacity = Math.max(0, Math.min(1, (effect.expiresAt - Date.now()) / NIGHT_CREATURE_DURATION_MS + 0.15))
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x + driftX,
                  top: effect.y + driftY,
                  transform: 'translate(-50%, -50%)',
                  fontSize: 20,
                  filter: 'drop-shadow(0 4px 10px rgba(15,23,42,0.45))',
                  opacity,
                  pointerEvents: 'none',
                  zIndex: 21,
                }}
              >
                {effect.emoji}
              </div>
            )
          })}

          {fridayCelebrationEffects.map(effect => {
            const age = Date.now() - effect.createdAt
            const progress = Math.max(0, Math.min(1, age / FRIDAY_CELEBRATION_MS))
            const opacity = 1 - progress
            return (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                  zIndex: 23,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 12
                  const radius = 16 + progress * 72
                  const x = Math.cos(angle) * radius
                  const y = Math.sin(angle) * radius - progress * 22
                  const color = ['#F59E0B', '#EAB308', '#F97316', '#A855F7'][i % 4]
                  return (
                    <span
                      key={`c-${i}`}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: color,
                        opacity,
                        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                      }}
                    />
                  )
                })}
                {Array.from({ length: 4 }).map((_, i) => {
                  const x = (i - 1.5) * 12
                  const y = -10 - progress * (34 + i * 8)
                  return (
                    <span
                      key={`s-${i}`}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: 18 + i * 4,
                        height: 18 + i * 4,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(148,163,184,0.32), rgba(148,163,184,0))',
                        opacity: opacity * 0.8,
                      }}
                    />
                  )
                })}
              </div>
            )
          })}

          {alignmentGuides.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 997,
              }}
            >
              {alignmentGuides.map((guide, i) => {
                const pad = 40
                if (guide.orientation === 'vertical') {
                  return (
                    <line
                      key={`align-v-${i}-${guide.position}`}
                      x1={guide.position}
                      y1={guide.start - pad}
                      x2={guide.position}
                      y2={guide.end + pad}
                      stroke="#EC4899"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                    />
                  )
                }
                return (
                  <line
                    key={`align-h-${i}-${guide.position}`}
                    x1={guide.start - pad}
                    y1={guide.position}
                    x2={guide.end + pad}
                    y2={guide.position}
                    stroke="#EC4899"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                  />
                )
              })}
            </svg>
          )}

          {marqueeSelection && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(marqueeSelection.startX, marqueeSelection.currentX),
                top: Math.min(marqueeSelection.startY, marqueeSelection.currentY),
                width: Math.max(1, Math.abs(marqueeSelection.currentX - marqueeSelection.startX)),
                height: Math.max(1, Math.abs(marqueeSelection.currentY - marqueeSelection.startY)),
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1.5px solid rgba(37, 99, 235, 0.9)',
                borderRadius: 8,
                pointerEvents: 'none',
                zIndex: 999,
              }}
            />
          )}

          {sectionPlacementDraft && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(sectionPlacementDraft.startX, sectionPlacementDraft.currentX),
                top: Math.min(sectionPlacementDraft.startY, sectionPlacementDraft.currentY),
                width: Math.max(1, Math.abs(sectionPlacementDraft.currentX - sectionPlacementDraft.startX)),
                height: Math.max(1, Math.abs(sectionPlacementDraft.currentY - sectionPlacementDraft.startY)),
                background: 'rgba(162, 89, 255, 0.14)',
                border: '1.5px dashed rgba(162, 89, 255, 0.95)',
                borderRadius: 10,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />
          )}

          {/* ── Tool cards ─────────────────────────────── */}
          {boardTools.map(({ slug, tool }, idx) => {
            if (!tool) return null
            const { Icon, bg, text } = getToolIcon(slug)
            const pos = cardPositions[slug] || defaultPos(slug, idx)
            const isDragging = dragging.current === slug
            const isSelected = selectedCardSlugs.includes(slug)
            const remoteCardSelectors = Object.values(liveCardSelections).filter(entry =>
              entry.selectedCardSlugs.includes(slug)
            )
            const remoteOwner = remoteCardSelectors[0] || null
            const isLocked = lockedCardSlugs.includes(slug)
            const phase = toolPhases[slug] || getDefaultPhaseForTool(pickerFramework, slug)
            const phaseLabel = phase ? frameworkPhases.find(p => p.id === phase)?.label : null
            const isWideBoardPreview = isWideBoardPreviewSlug(slug)
            const cardEl = cardElementRefs.current[slug]
            const cardW = cardEl?.offsetWidth ?? (isWideBoardPreview ? 980 : 680)
            const cardH = cardEl?.offsetHeight ?? (isWideBoardPreview ? 620 : 400)
            const cardZ = isDragging
              ? 1000
              : resolveBoardZIndex(
                  cardZOrder[slug] || 1,
                  getSectionContentZFloor(worldBoundsFromRect(pos.x, pos.y, cardW, cardH))
                )

            return (
              <div
                key={slug}
                ref={el => {
                  cardElementRefs.current[slug] = el
                }}
                onClick={e => {
                  e.stopPropagation()
                  // Don't toggle selection when clicking interactive elements inside the tool
                  const target = e.target as HTMLElement
                  if (target.closest('input, textarea, button, select, a, [contenteditable]')) return
                  if (suppressNextCardClickRef.current) {
                    suppressNextCardClickRef.current = false
                    return
                  }
                  const additive = e.metaKey || e.ctrlKey || e.shiftKey
                  toggleCardSelection(slug, additive)
                  if (!additive) {
                    setSelectedFlowNodeIds([])
                    setSelectedFlowNodeId(null)
                  }
                }}
                onContextMenu={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!canEdit) return
                  const additive = e.metaKey || e.ctrlKey || e.shiftKey
                  setSelectedCardSlugs(prev => mergeBoardIdSelection(prev, slug, additive))
                  setContextMenu({ type: 'card', x: e.clientX, y: e.clientY, slug })
                }}
                onMouseDownCapture={() => {
                  // Bring card to front logic could go here if we dynamically sorted, 
                  // but currently Z-index is based on 'isDragging'.
                }}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: 'max-content',
                  minWidth: isWideBoardPreview ? 980 : 680,
                  minHeight: isWideBoardPreview ? 620 : 400,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  boxShadow: 'none',
                  outline: isSelected
                    ? '2px solid #2563EB'
                    : remoteOwner
                      ? `2px solid ${remoteOwner.color}`
                      : 'none',
                  outlineOffset: 4,
                  resize: 'both',
                  overflow: 'visible',
                  userSelect: isDragging ? 'none' : 'auto',
                  transition: 'outline-color 0.2s',
                  transform: isDragging ? 'translateY(-2px)' : 'none',
                  opacity: isLocked ? 0.88 : 1,
                  zIndex: cardZ,
                }}
              >
                {remoteCardSelectors.length > 0 && !isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -30,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      pointerEvents: 'none',
                      zIndex: 5,
                    }}
                  >
                    {remoteCardSelectors.slice(0, 2).map(selector => (
                      <div
                        key={selector.userId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: selector.color,
                          color: '#FFFFFF',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(2,6,23,0.22)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selector.username || 'Bruger'}
                      </div>
                    ))}
                    {remoteCardSelectors.length > 2 && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 24,
                          height: 20,
                          borderRadius: 999,
                          background: '#0F172A',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '0 6px',
                        }}
                      >
                        +{remoteCardSelectors.length - 2}
                      </div>
                    )}
                  </div>
                )}
                {/* Header: logo, navn, fase — også træk-håndtag når redigering */}
                <div
                  {...(canEdit && !isLocked
                    ? {
                        'data-drag-handle': 'true' as const,
                        onMouseDown: (e: React.MouseEvent) => onCardMouseDown(e, slug, idx),
                      }
                    : {})}
                  style={{
                    padding: '4px 0 10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: canEdit && !isLocked ? 'grab' : 'default',
                  }}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}
                  >
                    <Icon style={{ width: 18, height: 18 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                      {tool.title}
                    </h3>
                    {phaseLabel && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6B7280',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {phaseLabel}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); handleRemoveTool(slug) }}
                      title="Fjern fra projekt"
                      style={{
                        width: 22, height: 22, border: 'none', borderRadius: 7,
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#9CA3AF', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Værktøjets indhold */}
                <div 
                  style={{
                    flex: 1,
                    padding: 0,
                    overflow: 'visible',
                    pointerEvents: isDragging ? 'none' : 'auto',
                    userSelect: 'auto',
                    position: 'relative',
                    cursor:
                      canEdit && !isLocked && isSelected ? 'grab' : 'default',
                  }}
                  onMouseDown={e => {
                    e.stopPropagation()
                    if (!canEdit || isLocked) return
                    if (!isSelected) return
                    if (!boardPointerAllowsToolCardBodyDrag(e.target)) return
                    onCardMouseDown(e, slug, idx)
                  }}
                >
                  {(() => {
                    if (slug === 'brugerrejse') {
                      return <BrugerrejsePreviewCard />
                    }
                    if (slug === 'service-blueprint') {
                      return <ServiceBlueprintPreviewCard />
                    }
                    if (slug === 'survey-template') {
                      return <SurveyPreviewCard />
                    }
                    if (slug === 'card-sorting') {
                      return <CardSortingPreviewCard />
                    }
                    if (slug === 'qr-generator') {
                      return <QrGeneratorPreviewCard />
                    }
                    const ToolComponent = getToolComponent(slug)
                    if (ToolComponent) {
                      return <ToolComponent />
                    }
                    return (
                      <p style={{ margin: '12px 0', fontSize: 13, color: '#6B7280' }}>
                        Modul ikke understøttet i lærred-visning endnu.
                      </p>
                    )
                  })()}
                </div>
              </div>
            )
          })}

          {canEdit &&
            boardSections
              .filter(s => selectedSectionIds.includes(s.id))
              .map(section => (
                <div
                  key={`section-resize-${section.id}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    zIndex: 1100,
                    pointerEvents: 'none',
                  }}
                >
                  {(
                    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as SectionResizeEdge[]
                  ).map(edge => (
                    <div
                      key={edge}
                      data-section-resize={edge}
                      onMouseDown={e => onSectionResizeMouseDown(e, section.id, edge)}
                      style={getSectionResizeHandleStyle(section, edge)}
                    />
                  ))}
                </div>
              ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SIDE PANELS
      ════════════════════════════════════════════════ */}
      {showPanel && (
        <>
          <div
            onClick={() => setShowPanel(null)}
            style={{
              position: 'fixed',
              top: isOffline ? 89 : 56,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15,23,42,0.12)',
              zIndex: 1990,
            }}
          />
          <div style={{
            position: 'fixed', top: isOffline ? 89 : 56, right: 0, bottom: 0, width: 300,
            background: 'white', borderLeft: '1px solid #E5E7EB', zIndex: 2000,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-12px 0 36px rgba(0,0,0,0.14)',
            animation: 'slideIn 0.2s ease',
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: none; opacity: 1 } }
              @keyframes commentOpen {
                0% { opacity: 0; transform: translateY(6px) scale(0.9); filter: blur(0.4px); }
                100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
              }
            `}</style>

          {/* Panel header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {showPanel === 'settings' ? (
                  <Settings size={15} strokeWidth={2.2} aria-hidden />
                ) : showPanel === 'live-chat' ? (
                  <MessageCircle size={15} strokeWidth={2.2} aria-hidden />
                ) : (
                  <MessageSquare size={15} strokeWidth={2.2} aria-hidden />
                )}
                {showPanel === 'settings'
                  ? 'Projektindstillinger'
                  : showPanel === 'live-chat'
                    ? 'Live chat'
                    : 'Kommentarer'}
              </span>
            </h2>
            <button onClick={() => setShowPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: showPanel === 'live-chat' ? 'hidden' : 'auto', padding: showPanel === 'live-chat' ? 0 : 16, display: 'flex', flexDirection: 'column' }}>

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

                <Section label="Board">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1.5px solid #E5E7EB',
                      background: '#fff',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111827' }}>Grid lock</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                        Snap kort og flowchart-noder til grid.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSnapToGrid(v => !v)}
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        background: snapToGrid ? '#111827' : '#E5E7EB',
                        color: snapToGrid ? '#fff' : '#6B7280',
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        minWidth: 58,
                      }}
                    >
                      {snapToGrid ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </Section>

                <Section label="Samarbejde">
                  {isOwner ? (
                    <>
                      {/* Invite link */}
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Del-link</p>
                      {inviteLink ? (
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ flex: 1, fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{inviteLink.url}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: inviteLink.role === 'editor' ? '#DBEAFE' : '#F3F4F6', color: inviteLink.role === 'editor' ? '#1D4ED8' : '#374151', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                              {inviteLink.role === 'editor' ? 'Editor' : 'Viewer'}
                            </span>
                            <button onClick={handleCopyInviteLink} style={{ flex: 1, border: 'none', borderRadius: 7, background: '#111827', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}>
                              {inviteLinkCopied ? '✓ Kopieret' : 'Kopiér link'}
                            </button>
                            <button onClick={handleDeleteInviteLink} disabled={inviteLinkLoading} style={{ border: 'none', borderRadius: 7, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '4px 10px' }}>Slet</button>
                          </div>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <select
                          value={inviteLinkRole}
                          onChange={e => setInviteLinkRole(e.target.value as 'editor' | 'viewer')}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 12, background: 'white' }}
                        >
                          <option value="viewer">Viewer-link</option>
                          <option value="editor">Editor-link</option>
                        </select>
                        <button
                          onClick={() => { void handleGenerateInviteLink() }}
                          disabled={inviteLinkLoading}
                          style={{ padding: '0 14px', borderRadius: 10, border: 'none', background: '#6366F1', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {inviteLink ? 'Nyt link' : 'Generer link'}
                        </button>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Invitér direkte</p>
                      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#9CA3AF' }}>Invitér et nyt medlem</p>
                      <input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="Emails (fx navn@firma.dk, kollega@firma.dk)"
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
                    </>
                  ) : (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9CA3AF' }}>Kun owner kan invitere/fjerne medlemmer.</p>
                  )}
                  <p style={{ margin: '14px 0 6px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Medlemmer ({members.length}) · Online nu ({onlineMembers.length})
                  </p>
                  {members.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Ingen endnu.</p>
                  ) : members.map(m => (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt={m.email || m.username || m.user_id}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (m.username || m.user_id).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.email || m.username || m.user_id}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
                          {m.role}{m.username ? ` · ${m.username}` : ''}
                          {onlineMemberIdSet.has(m.user_id) ? ' · online nu' : ''}
                        </p>
                      </div>
                      {isOwner && m.role !== 'owner' && (
                        <button onClick={() => handleRemoveMember(m.user_id)} style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Fjern</button>
                      )}
                    </div>
                  ))}
                </Section>

                <Section label="Info">
                  <InfoRow label="Rolle" value={project.role || '–'} />
                  <InfoRow label="Sidst opdateret" value={lastUpdated} />
                  <InfoRow label="Antal værktøjer" value={String(toolCount)} />
                </Section>
              </>
            )}
            {showPanel === 'comments' && (
              <div style={{ display: 'grid', gap: 12 }}>
                {(() => {
                  const openComments = boardComments.filter(comment => !comment.resolved)
                  const resolvedComments = boardComments.filter(comment => comment.resolved)
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          Åbne ({openComments.length})
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => addBoardComment()}
                            style={{
                              border: 'none',
                              borderRadius: 9,
                              background: '#EEF2FF',
                              color: '#4338CA',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '6px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            + Ny kommentar
                          </button>
                        )}
                      </div>
                      {openComments.length === 0 ? (
                        <div style={{ padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#64748B' }}>
                          Ingen åbne kommentarer.
                        </div>
                      ) : (
                        openComments.map(comment => {
                          const commentReplies = boardComments.filter(c => c.parentId === comment.id && !c.resolved)
                          return (
                            <PanelCommentCard
                              key={comment.id}
                              comment={comment}
                              replies={commentReplies}
                              canEdit={canEdit}
                              onNavigate={() => {
                                centerViewAt(comment.x + 150, comment.y + 60)
                                setSelectedCommentIds([comment.id])
                                setShowPanel(null)
                              }}
                              onResolve={() => setCommentResolved(comment.id, true)}
                              onReply={(text) => addPanelCommentReply(comment.id, text)}
                            />
                          )
                        })
                      )}
                      <div style={{ paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Løste ({resolvedComments.length})
                        </p>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {resolvedComments.slice(0, 20).map(comment => (
                            <div key={comment.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 10px', background: '#F8FAFC' }}>
                              <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                                {comment.text.trim() || '(Tom kommentar)'}
                              </p>
                              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                  {comment.createdBy}
                                </span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => setCommentResolved(comment.id, false)}
                                    style={{
                                      border: 'none',
                                      borderRadius: 8,
                                      background: '#E2E8F0',
                                      color: '#334155',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Genåbn
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {resolvedComments.length > 20 && (
                            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                              Viser 20 af {resolvedComments.length} løste kommentarer.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
            {showPanel === 'live-chat' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Online members strip */}
                {onlineMembers.length > 0 && (
                  <div style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FAFBFC',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>
                      Online
                    </span>
                    {onlineMembers.map((m) => {
                      const label = m.username || m.email || m.user_id
                      const initial = (label || '?').charAt(0).toUpperCase()
                      const color = getStableCursorColor(m.user_id)
                      return (
                        <div
                          key={m.user_id}
                          title={label}
                          style={{
                            position: 'relative',
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: `2px solid ${color}`,
                            background: color,
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : initial}
                          <span style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#22C55E',
                            border: '1.5px solid #fff',
                          }} />
                        </div>
                      )
                    })}
                  </div>
                )}
                {/* Messages list */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {liveChatMessages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                          Start samtalen her.<br />Beskeder vises live for alle i projektet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    liveChatMessages.map((item) => {
                      const bubbleColor = item.isMine ? '#4F46E5' : (item.color || getStableCursorColor(item.userId))
                      const senderInitial = (item.username || '?').charAt(0).toUpperCase()
                      return (
                      <div
                        key={item.id}
                        style={{
                          alignSelf: item.isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        {/* Sender avatar + name — always shown, mirrored for own messages */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexDirection: item.isMine ? 'row-reverse' : 'row', marginLeft: item.isMine ? 0 : 2, marginRight: item.isMine ? 2 : 0 }}>
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: bubbleColor,
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: `0 0 0 2px #fff`,
                          }}>
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={item.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : senderInitial}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: item.isMine ? '#6366F1' : bubbleColor }}>
                            {item.username || 'Medlem'}
                          </span>
                        </div>
                        {/* Bubble */}
                        <div
                          style={{
                            borderRadius: item.isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            padding: '8px 12px',
                            background: item.isMine ? '#4F46E5' : '#F1F5F9',
                            color: item.isMine ? '#fff' : '#0F172A',
                            fontSize: 13,
                            lineHeight: 1.45,
                            boxShadow: item.isMine ? `0 2px 8px ${bubbleColor}40` : '0 1px 2px rgba(0,0,0,0.06)',
                            borderLeft: !item.isMine ? `3px solid ${bubbleColor}` : undefined,
                          }}
                          onMouseEnter={(e) => {
                            const picker = e.currentTarget.querySelector('[data-emoji-picker]') as HTMLElement | null
                            if (picker) { picker.style.opacity = '1'; picker.style.maxHeight = '32px' }
                          }}
                          onMouseLeave={(e) => {
                            const picker = e.currentTarget.querySelector('[data-emoji-picker]') as HTMLElement | null
                            if (picker) { picker.style.opacity = '0'; picker.style.maxHeight = '0' }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 12, marginBottom: item.text ? 2 : 0 }}>
                            <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 'auto' }}>{new Date(item.createdAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {item.text ? (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.text}</p>
                          ) : null}

                          {/* Attachments */}
                          {item.attachments && item.attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: item.text ? 6 : 0 }}>
                              {item.attachments.map((att, ai) =>
                                att.isImage ? (
                                  <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      style={{
                                        maxWidth: '100%', maxHeight: 180, borderRadius: 8,
                                        display: 'block', objectFit: 'contain', cursor: 'pointer',
                                      }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={ai}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 8,
                                      padding: '6px 10px', borderRadius: 8,
                                      border: `1px solid ${item.isMine ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}`,
                                      background: item.isMine ? 'rgba(255,255,255,0.12)' : '#fff',
                                      textDecoration: 'none', color: item.isMine ? '#fff' : '#334155',
                                    }}
                                  >
                                    <span style={{ fontSize: 16 }}>📎</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {att.name}
                                    </span>
                                    <span style={{ fontSize: 10, opacity: 0.6, whiteSpace: 'nowrap' }}>
                                      {att.size < 1024 * 1024 ? `${Math.round(att.size / 1024)} KB` : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                                    </span>
                                  </a>
                                )
                              )}
                            </div>
                          )}

                          {/* Emoji Reactions */}
                          {item.reactions && item.reactions.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {Object.entries(
                              item.reactions.reduce((acc, reaction) => {
                                if (!acc[reaction.emoji]) {
                                  acc[reaction.emoji] = []
                                }
                                acc[reaction.emoji].push(reaction)
                                return acc
                              }, {} as Record<string, ChatReaction[]>)
                              ).map(([emoji, reactions]) => {
                                const hasMyReaction = reactions.some(r => r.userId === currentUserId)
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => void sendChatReaction(item.id, emoji)}
                                    title={reactions.map(r => r.username).join(', ')}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 2,
                                      padding: '1px 5px', borderRadius: 10,
                                      border: hasMyReaction ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(0,0,0,0.1)',
                                      background: hasMyReaction ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                                      color: 'inherit', fontSize: 11, cursor: 'pointer',
                                    }}
                                  >
                                    <span>{emoji}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600 }}>{reactions.length}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Emoji Picker (hover) */}
                          <div
                            data-emoji-picker
                            style={{
                              display: 'flex', gap: 1, marginTop: 4,
                              opacity: 0, maxHeight: 0, overflow: 'hidden',
                              transition: 'opacity 0.15s, max-height 0.15s',
                            }}
                          >
                            {['👍','❤️','😂','😮','😢','👏','🔥','🎉'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => void sendChatReaction(item.id, emoji)}
                                style={{
                                  padding: '2px 3px', borderRadius: 4, border: 'none',
                                  background: 'transparent', cursor: 'pointer', fontSize: 13, lineHeight: 1,
                                }}
                                title={`Reager med ${emoji}`}
                              >{emoji}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                    })
                  )}
                  <div ref={chatScrollRef} />
                </div>

                {/* Input bar - pinned at bottom */}
                <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 12px', background: '#fff' }}>
                  <form
                    onSubmit={(e) => { e.preventDefault(); void sendLiveChatMessage() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <input
                      value={liveChatInput}
                      onChange={(e) => setLiveChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendLiveChatMessage() } }}
                      placeholder="Skriv en besked..."
                      maxLength={800}
                      disabled={liveChatUploading}
                      style={{
                        flex: 1, minWidth: 0,
                        borderRadius: 20,
                        border: '1.5px solid #E2E8F0',
                        padding: '8px 14px',
                        fontSize: 13,
                        outline: 'none',
                        background: '#F8FAFC',
                        color: '#0F172A',
                      }}
                    />
                    <button
                      type="button"
                      disabled={!canEdit || liveChatUploading}
                      onClick={() => chatFileInputRef.current?.click()}
                      title={canEdit ? 'Vedhæft billede eller fil' : 'Kun redaktører og ejere kan vedhæfte filer'}
                      style={{
                        width: 36, height: 36, flexShrink: 0,
                        border: '1.5px solid #E2E8F0', borderRadius: '50%',
                        background: '#F8FAFC', color: '#64748B',
                        fontSize: 15, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {liveChatUploading ? '⏳' : '📎'}
                    </button>
                    <button
                      type="submit"
                      disabled={!liveChatInput.trim() || liveChatUploading}
                      style={{
                        width: 36, height: 36, flexShrink: 0,
                        border: 'none', borderRadius: '50%',
                        background: liveChatInput.trim() && !liveChatUploading ? '#4F46E5' : '#E2E8F0',
                        color: liveChatInput.trim() && !liveChatUploading ? '#fff' : '#94A3B8',
                        fontSize: 15, cursor: liveChatInput.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                      }}
                      title="Send"
                    >
                      ➤
                    </button>
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                      style={{ display: 'none' }}
                      onChange={(e) => void handleChatFileUpload(e.target.files)}
                    />
                  </form>
                </div>
              </div>
            )}
          </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════
          ADD TOOL MODAL
      ════════════════════════════════════════════════ */}
      {showAddTool && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => {
            setShowAddTool(false)
            setAddToolSearch('')
            setSelectedAddToolCategory('all')
            setShowAllAddToolResults(false)
          }}
        >
          <div
            style={{ width: '100%', maxWidth: 760, maxHeight: '88vh', background: 'white', borderRadius: 22, boxShadow: '0 32px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>+ Tilføj værktøj</h3>
                <button
                  type="button"
                  disabled={!canEdit || modifying || filteredAddTools.length === 0}
                  onClick={() => handleAddAllTools(filteredAddTools.map(tool => tool.slug))}
                  style={{
                    border: '1px solid #D1D5DB',
                    background: !canEdit || modifying || filteredAddTools.length === 0 ? '#F9FAFB' : '#fff',
                    color: !canEdit || modifying || filteredAddTools.length === 0 ? '#9CA3AF' : '#111827',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: !canEdit || modifying || filteredAddTools.length === 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Tilføj alle værktøjer
                </button>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9CA3AF' }}>
                Find hurtigt det rigtige værktøj med søgning og faser fra valgt framework.
              </p>
            </div>

            <div style={{ padding: '12px 16px 0', borderBottom: '1px solid #F9FAFB' }}>
              <div
                style={
                  pickerFramework === 'double-diamond'
                    ? { padding: 0, overflow: 'hidden', marginBottom: 10 }
                    : { border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', padding: 8, overflow: 'hidden', marginBottom: 10 }
                }
              >
                {pickerFramework === 'google-design-sprint' ? (
                  <GoogleDesignSprintDiagram
                    activeSelection={selectedPhaseForDiagram as GoogleDesignSprintPhase}
                    onSelect={selection => {
                      setSelectedAddToolCategory(selection)
                      setShowAllAddToolResults(false)
                    }}
                  />
                ) : pickerFramework === 'design-thinking' ? (
                  <DesignThinkingDiagram
                    activeSelection={selectedPhaseForDiagram as DesignThinkingPhase}
                    onSelect={selection => {
                      setSelectedAddToolCategory(selection)
                      setShowAllAddToolResults(false)
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 320,
                      overflow: 'visible',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        transform: 'scale(0.492)',
                        transformOrigin: 'top center',
                        width: 1200,
                        height: 650,
                        flexShrink: 0,
                      }}
                    >
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
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <PartyPopper size={18} strokeWidth={2.2} aria-hidden />
                  </div>
                  <p style={{ margin: 0 }}>Alle værktøjer er tilføjet!</p>
                </div>
              ) : filteredAddTools.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>Ingen værktøjer matcher din søgning.</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>Prøv et andet søgeord eller vælg filteret "Alle".</p>
                </div>
              ) : frameworkPhases.length === 0 ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    {visibleAddTools.map(tool => (
                      <ToolPickerCard key={tool.slug} tool={tool} onAdd={() => handleAddTool(tool.slug)} />
                    ))}
                  </div>
                  {!showAllAddToolResults && filteredAddTools.length > visibleAddTools.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowAllAddToolResults(true)}
                        style={{
                          border: '1px solid #E5E7EB',
                          background: '#fff',
                          color: '#6B7280',
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Vis flere ({filteredAddTools.length - visibleAddTools.length})
                      </button>
                    </div>
                  )}
                </>
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
      {activeWorkspaceTab === 'board' && contextMenu && canEdit && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 2000,
            minWidth: 228,
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
            padding: 6,
          }}
        >
          {contextMenu.type === 'canvas' ? (
            <>
              <button type="button" onClick={() => { setShowAddTool(true); setContextMenu(null) }} style={S.ctxItem}>Tilføj værktøj…</button>
              <button type="button" onClick={() => { addFlowNode('process', { x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt form: Rektangel</button>
              <button type="button" onClick={() => { addFlowNode('decision', { x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt form: Diamant</button>
              <button type="button" onClick={() => { addFlowNode('terminator', { x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt form: Oval</button>
              <button type="button" onClick={() => { addStickyNote({ x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt sticky note</button>
              <button type="button" onClick={() => { addBoardSection({ x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt sektion</button>
              <button type="button" onClick={() => { addBoardComment({ x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt kommentar</button>
              <button type="button" onClick={() => { addBoardFreeText({ x: contextMenu.worldX, y: contextMenu.worldY }); setContextMenu(null) }} style={S.ctxItem}>Indsæt tekstfelt</button>
              <button
                type="button"
                onClick={() => {
                  pendingImageWorldRef.current = { x: contextMenu.worldX, y: contextMenu.worldY }
                  boardImageFileInputRef.current?.click()
                  setContextMenu(null)
                }}
                style={S.ctxItem}
              >
                Indsæt billede…
              </button>
              <div style={S.ctxDivider} />
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 60, y: 60 }); setContextMenu(null) }} style={S.ctxItem}>Reset zoom (100%)</button>
              <button type="button" onClick={() => { setSnapToGrid(v => !v); setContextMenu(null) }} style={S.ctxItem}>
                {snapToGrid ? 'Slå Grid lock fra' : 'Slå Grid lock til'}
              </button>
              <button type="button" onClick={() => { centerViewAt(contextMenu.worldX, contextMenu.worldY); setContextMenu(null) }} style={S.ctxItem}>Center view her</button>
            </>
          ) : contextMenu.type === 'card' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  window.open(`/vaerktoejer/${contextMenu.slug}`, '_blank', 'noopener,noreferrer')
                  setContextMenu(null)
                }}
                style={S.ctxItem}
              >
                Åbn værktøj i fuld visning
              </button>
              <button type="button" onClick={() => { bringSelectedCardsToFront(); setContextMenu(null) }} style={S.ctxItem}>
                Flyt valgte forrest{selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  offsetSelectedCardsBy(28, 28)
                  setContextMenu(null)
                }}
                style={S.ctxItem}
              >
                Duplikér / flyt valgte (+28){selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <button type="button" onClick={() => { toggleLockSelectedCards(); setContextMenu(null) }} style={S.ctxItem}>
                {selectedCardSlugs.length > 0 && selectedCardSlugs.every(s => lockedCardSlugs.includes(s))
                  ? 'Lås op position for valgte'
                  : 'Lås position for valgte'}
                {selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <div style={S.ctxDivider} />
              <button type="button" onClick={() => { void exportSelectedCards('pdf'); setContextMenu(null) }} style={S.ctxItem}>
                Eksporter valgte som PDF{selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <button type="button" onClick={() => { void exportSelectedCards('jpg'); setContextMenu(null) }} style={S.ctxItem}>
                Eksporter valgte som JPG{selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <button type="button" onClick={() => { void exportSelectedCards('png'); setContextMenu(null) }} style={S.ctxItem}>
                Eksporter valgte som PNG{selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length})` : ''}
              </button>
              <div style={S.ctxDivider} />
              <button
                type="button"
                onClick={() => {
                  void removeToolCardsByIds([...selectedCardSlugs])
                  setContextMenu(null)
                }}
                style={{ ...S.ctxItem, color: '#B91C1C' }}
              >
                Fjern fra projekt
                {selectedCardSlugs.length > 1 ? ` (${selectedCardSlugs.length} værktøjer)` : ''}
              </button>
            </>
          ) : contextMenu.type === 'boardShape' ? (
            <>
              {contextMenu.shapeKind === 'image' && (
                <button
                  type="button"
                  onClick={() => {
                    const src = boardImages.find(i => i.id === contextMenu.id)?.src
                    if (src) window.open(src, '_blank', 'noopener,noreferrer')
                    setContextMenu(null)
                  }}
                  style={S.ctxItem}
                >
                  Åbn billede i ny fane
                </button>
              )}
              {(contextMenu.shapeKind === 'section' || contextMenu.shapeKind === 'image') && (
                <>
                  {contextMenu.shapeKind === 'section' && (
                    <button
                      type="button"
                      onClick={() => {
                        expandSelectedSectionsToFitContents()
                        setContextMenu(null)
                      }}
                      style={S.ctxItem}
                    >
                      Udvid til indhold
                      {selectedSectionIds.length > 1 ? ` (${selectedSectionIds.length})` : ''}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (contextMenu.shapeKind === 'section') bringSelectedSectionsToFront()
                      else bringSelectedBoardImagesToFront()
                      setContextMenu(null)
                    }}
                    style={S.ctxItem}
                  >
                    Flyt valgte forrest
                    {(contextMenu.shapeKind === 'section' ? selectedSectionIds : selectedImageIds).length > 1
                      ? ` (${contextMenu.shapeKind === 'section' ? selectedSectionIds.length : selectedImageIds.length})`
                      : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (contextMenu.shapeKind === 'section') duplicateSelectedSections()
                      else duplicateSelectedBoardImages()
                      setContextMenu(null)
                    }}
                    style={S.ctxItem}
                  >
                    Duplikér / flyt valgte (+28)
                    {(contextMenu.shapeKind === 'section' ? selectedSectionIds : selectedImageIds).length > 1
                      ? ` (${contextMenu.shapeKind === 'section' ? selectedSectionIds.length : selectedImageIds.length})`
                      : ''}
                  </button>
                  <div style={S.ctxDivider} />
                  <button
                    type="button"
                    onClick={() => {
                      void (contextMenu.shapeKind === 'section'
                        ? exportSelectedSectionsAs('pdf')
                        : exportSelectedBoardImagesAs('pdf'))
                      setContextMenu(null)
                    }}
                    style={S.ctxItem}
                  >
                    Eksporter valgte som PDF
                    {(contextMenu.shapeKind === 'section' ? selectedSectionIds : selectedImageIds).length > 1
                      ? ` (${contextMenu.shapeKind === 'section' ? selectedSectionIds.length : selectedImageIds.length})`
                      : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (contextMenu.shapeKind === 'section'
                        ? exportSelectedSectionsAs('jpg')
                        : exportSelectedBoardImagesAs('jpg'))
                      setContextMenu(null)
                    }}
                    style={S.ctxItem}
                  >
                    Eksporter valgte som JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (contextMenu.shapeKind === 'section'
                        ? exportSelectedSectionsAs('png')
                        : exportSelectedBoardImagesAs('png'))
                      setContextMenu(null)
                    }}
                    style={S.ctxItem}
                  >
                    Eksporter valgte som PNG
                  </button>
                  <div style={S.ctxDivider} />
                </>
              )}
              {contextMenu.shapeKind === 'sticky' && (
                <>
                  <button type="button" onClick={() => { bringSelectedStickiesToFront(); setContextMenu(null) }} style={S.ctxItem}>
                    Flyt valgte forrest{selectedStickyNoteIds.length > 1 ? ` (${selectedStickyNoteIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { duplicateSelectedStickies(); setContextMenu(null) }} style={S.ctxItem}>
                    Duplikér / flyt valgte (+28){selectedStickyNoteIds.length > 1 ? ` (${selectedStickyNoteIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                  <button type="button" onClick={() => { void exportSelectedStickiesAs('pdf'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som PDF{selectedStickyNoteIds.length > 1 ? ` (${selectedStickyNoteIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { void exportSelectedStickiesAs('jpg'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som JPG{selectedStickyNoteIds.length > 1 ? ` (${selectedStickyNoteIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { void exportSelectedStickiesAs('png'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som PNG{selectedStickyNoteIds.length > 1 ? ` (${selectedStickyNoteIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                </>
              )}
              {contextMenu.shapeKind === 'flow' && (
                <>
                  <button type="button" onClick={() => { bringSelectedFlowNodesToFront(); setContextMenu(null) }} style={S.ctxItem}>
                    Flyt valgte forrest{selectedFlowNodeIds.length > 1 ? ` (${selectedFlowNodeIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { duplicateSelectedFlowNodes(); setContextMenu(null) }} style={S.ctxItem}>
                    Duplikér / flyt valgte (+28){selectedFlowNodeIds.length > 1 ? ` (${selectedFlowNodeIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                  <button type="button" onClick={() => { void exportSelectedFlowNodesAs('pdf'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som PDF{selectedFlowNodeIds.length > 1 ? ` (${selectedFlowNodeIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { void exportSelectedFlowNodesAs('jpg'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som JPG{selectedFlowNodeIds.length > 1 ? ` (${selectedFlowNodeIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { void exportSelectedFlowNodesAs('png'); setContextMenu(null) }} style={S.ctxItem}>
                    Eksporter valgte som PNG{selectedFlowNodeIds.length > 1 ? ` (${selectedFlowNodeIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                </>
              )}
              {contextMenu.shapeKind === 'freeText' && (
                <>
                  <button type="button" onClick={() => { bringSelectedFreeTextsToFront(); setContextMenu(null) }} style={S.ctxItem}>
                    Flyt valgte forrest{selectedFreeTextIds.length > 1 ? ` (${selectedFreeTextIds.length})` : ''}
                  </button>
                  <button type="button" onClick={() => { duplicateSelectedFreeTexts(); setContextMenu(null) }} style={S.ctxItem}>
                    Duplikér / flyt valgte (+28){selectedFreeTextIds.length > 1 ? ` (${selectedFreeTextIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                </>
              )}
              {contextMenu.shapeKind === 'comment' && (
                <>
                  <button type="button" onClick={() => { duplicateSelectedComments(); setContextMenu(null) }} style={S.ctxItem}>
                    Duplikér / flyt valgte (+28){selectedCommentIds.length > 1 ? ` (${selectedCommentIds.length})` : ''}
                  </button>
                  <div style={S.ctxDivider} />
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.shapeKind === 'flow') {
                    removeFlowNodesByIds([...selectedFlowNodeIds])
                  } else if (contextMenu.shapeKind === 'sticky') {
                    removeStickyNotesByIds([...selectedStickyNoteIds])
                  } else if (contextMenu.shapeKind === 'section') {
                    removeSectionsByIds([...selectedSectionIds])
                  } else if (contextMenu.shapeKind === 'image') {
                    removeBoardImagesByIds([...selectedImageIds])
                  } else if (contextMenu.shapeKind === 'freeText') {
                    removeFreeTextsByIds([...selectedFreeTextIds])
                  } else {
                    removeCommentsByIds([...selectedCommentIds])
                  }
                  setContextMenu(null)
                }}
                style={{ ...S.ctxItem, color: '#B91C1C' }}
              >
                Slet fra board
                {contextMenu.shapeKind === 'flow' && selectedFlowNodeIds.length > 1
                  ? ` (${selectedFlowNodeIds.length})`
                  : contextMenu.shapeKind === 'sticky' && selectedStickyNoteIds.length > 1
                    ? ` (${selectedStickyNoteIds.length})`
                    : contextMenu.shapeKind === 'section' && selectedSectionIds.length > 1
                      ? ` (${selectedSectionIds.length})`
                      : contextMenu.shapeKind === 'image' && selectedImageIds.length > 1
                        ? ` (${selectedImageIds.length})`
                        : contextMenu.shapeKind === 'comment' && selectedCommentIds.length > 1
                          ? ` (${selectedCommentIds.length})`
                          : contextMenu.shapeKind === 'freeText' && selectedFreeTextIds.length > 1
                            ? ` (${selectedFreeTextIds.length})`
                            : ''}
              </button>
            </>
          ) : null}
        </div>
      )}
      </ToolEmbedProvider>
      )}

      {canEdit &&
      richToolbarUi &&
      ((richToolbarUi.kind === 'sticky' && stickyToolbarNote) ||
        (richToolbarUi.kind === 'flow' && flowToolbarNode)) ? (
        <StickyRichToolbar
          visible
          anchor={{
            left: richToolbarUi.rect.left,
            top: richToolbarUi.rect.top,
            width: richToolbarUi.rect.width,
            height: richToolbarUi.rect.height,
          }}
          format={mergeStickyFormat(
            richToolbarUi.kind === 'sticky' ? stickyToolbarNote!.format : flowToolbarNode!.format,
            {}
          )}
          noteColor={
            richToolbarUi.kind === 'sticky'
              ? stickyToolbarNote!.color
              : flowToolbarNode!.fillColor ?? '#FFFFFF'
          }
          colorPalette={
            richToolbarUi.kind === 'sticky' ? STICKY_NOTE_COLORS : FLOWCHART_SHAPE_COLORS
          }
          toolbarAriaLabel={
            richToolbarUi.kind === 'sticky' ? 'Sticky note formatering' : 'Flowchart formatering'
          }
          colorButtonTitle={richToolbarUi.kind === 'sticky' ? 'Sticky-farve' : 'Form-farve'}
          colorButtonAriaLabel={
            richToolbarUi.kind === 'sticky' ? 'Vælg sticky-farve' : 'Vælg form-farve'
          }
          boldActive={richToolbarUi.bold}
          italicActive={richToolbarUi.italic}
          strikeActive={richToolbarUi.strike}
          onSetNoteColor={handleToolbarSetNoteColor}
          onSetFormat={handleToolbarSetFormat}
          onFontSizePx={handleToolbarFontSize}
          onRunCommand={runStickyRichCommand}
        />
      ) : null}

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
          zIndex={showPanel ? 1500 : 9999}
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

function getFlowNodeDimensions(node: FlowNode): {
  width: number
  height: number
  borderRadius: number
  clipPath?: string
} {
  const base = getFlowNodeStyle(node.shape)
  const w =
    typeof node.width === 'number' && Number.isFinite(node.width) && node.width >= FLOW_NODE_MIN_W
      ? node.width
      : base.width
  const h =
    typeof node.height === 'number' && Number.isFinite(node.height) && node.height >= FLOW_NODE_MIN_H
      ? node.height
      : base.height
  return { width: w, height: h, borderRadius: base.borderRadius, clipPath: base.clipPath }
}

function getFlowNodeAnchor(node: FlowNode, side: 'left' | 'top' | 'bottom' | 'right') {
  const dim = getFlowNodeDimensions(node)
  if (side === 'top') {
    return { x: node.x + dim.width / 2, y: node.y }
  }
  if (side === 'bottom') {
    return { x: node.x + dim.width / 2, y: node.y + dim.height }
  }
  return {
    x: side === 'left' ? node.x : node.x + dim.width,
    y: node.y + dim.height / 2,
  }
}

/** Flytter mål-form så den flugter med kilden: lodrette forbindelser deler x-center, vandrette deler y-center. */
function alignFlowTargetToSource(
  from: FlowNode,
  to: FlowNode,
  fromSide: FlowConnectorSide,
  toSide: FlowConnectorSide
): { x: number; y: number } {
  const dFrom = getFlowNodeDimensions(from)
  const dTo = getFlowNodeDimensions(to)
  const cxFrom = from.x + dFrom.width / 2
  const cyFrom = from.y + dFrom.height / 2

  let x = to.x
  let y = to.y

  const isVerticalConnector = (s: FlowConnectorSide) => s === 'top' || s === 'bottom'
  const isHorizontalConnector = (s: FlowConnectorSide) => s === 'left' || s === 'right'

  if (isVerticalConnector(fromSide) && isVerticalConnector(toSide)) {
    x = cxFrom - dTo.width / 2
  } else if (isHorizontalConnector(fromSide) && isHorizontalConnector(toSide)) {
    y = cyFrom - dTo.height / 2
  } else {
    const aFrom = getFlowNodeAnchor(from, fromSide)
    const aTo = getFlowNodeAnchor(to, toSide)
    const dx = aTo.x - aFrom.x
    const dy = aTo.y - aFrom.y
    if (Math.abs(dy) >= Math.abs(dx)) {
      x = cxFrom - dTo.width / 2
    } else {
      y = cyFrom - dTo.height / 2
    }
  }

  return { x, y }
}

function getClosestTargetSide(node: FlowNode, point: { x: number; y: number }): FlowConnectorSide {
  const left = getFlowNodeAnchor(node, 'left')
  const top = getFlowNodeAnchor(node, 'top')
  const right = getFlowNodeAnchor(node, 'right')
  const bottom = getFlowNodeAnchor(node, 'bottom')

  const distances = [
    { side: 'left' as FlowConnectorSide, d: Math.hypot(point.x - left.x, point.y - left.y) },
    { side: 'top' as FlowConnectorSide, d: Math.hypot(point.x - top.x, point.y - top.y) },
    { side: 'right' as FlowConnectorSide, d: Math.hypot(point.x - right.x, point.y - right.y) },
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

  ctxItem: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '8px 10px',
    borderRadius: 8,
    textAlign: 'left',
    fontSize: 13,
    color: '#374151',
    cursor: 'pointer',
    display: 'block',
  } as React.CSSProperties,

  ctxDivider: {
    height: 1,
    background: '#F3F4F6',
    margin: '6px 4px',
  } as React.CSSProperties,
}
