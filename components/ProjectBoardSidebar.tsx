'use client'

/**
 * ProjectBoardSidebar
 * -------------------
 * Venstre sidebar på projektboardet.
 *
 * Viser kun tools/assets der allerede er tilknyttet projektet og som
 * naturligt åbnes på en separat side eller i et separat workspace:
 *
 *   • Tools med dedikeret /tools/<slug>-route (Brugerrejse, Service Blueprint,
 *     Survey, Kortsortering, QR) → klik navigerer in-app til den side.
 *   • Analytics — vises kun hvis projektet har mindst ét analytics-relevant
 *     tool (Survey, Kortsortering eller QR). Klik → /analytics?project=...
 *   • PDF'er — vises kun hvis projektet har mindst én fil tilknyttet.
 *     Klik → åbner Files-tab via callback fra parent.
 *
 * Sidebaren tilføjer INGEN ny tool-logik og ændrer INGEN data-modeller.
 */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, BarChart3, type LucideIcon } from 'lucide-react'
import type { Vaerktoej } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

/** Tool-slugs hvis tool åbner i en dedikeret fuldside-route under /tools/<slug>. */
export const DEDICATED_PAGE_TOOL_SLUGS = new Set<string>([
  'brugerrejse',
  'service-blueprint',
  'survey-template',
  'card-sorting',
  'qr-generator',
])

/** Tools der bidrager til Analytics-dashboardet (projekt-scoped). */
const ANALYTICS_RELEVANT_SLUGS = new Set<string>([
  'survey-template',
  'card-sorting',
  'qr-generator',
])

/** Helper til parent: er der mindst ét item værd at vise i sidebaren?
 *  Bruges til at beslutte om sidebaren overhovedet skal optage layoutplads.
 *  Bemærk: dette tjek inkluderer ikke async tilstande (fx PDF-tæl), men
 *  brugeren tilføjer typisk PDF'er sammen med tools så det er en god første
 *  approksimation. Sidebaren afgør selv internt om den render eller ej. */
export function hasDedicatedPageTools(toolIds: string[] | undefined | null): boolean {
  if (!toolIds) return false
  return toolIds.some((s) => DEDICATED_PAGE_TOOL_SLUGS.has(s))
}

interface ProjectToolEntry {
  slug: string
  tool: Vaerktoej
}

interface Props {
  projectId: string
  projectTools: ProjectToolEntry[]
  topOffset: number
  collapsed: boolean
  onToggleCollapsed: () => void
  /** Callback til at skifte til Files-tab i workspacet (PDF'er bor der). */
  onOpenFilesTab: () => void
}

interface SidebarItem {
  key: string
  label: string
  Icon: LucideIcon
  iconBg: string
  iconText: string
  onClick: () => void
}

export default function ProjectBoardSidebar({
  projectId,
  projectTools,
  topOffset,
  collapsed,
  onToggleCollapsed,
  onOpenFilesTab,
}: Props) {
  const router = useRouter()
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [fileCount, setFileCount] = useState<number | null>(null)

  // ── Hent antal projektfiler (PDF'er) via eksisterende endpoint ──
  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    const load = () => {
      fetch(`/api/projects/${projectId}/files`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((j: { files?: unknown[] }) => {
          if (!cancelled) setFileCount(Array.isArray(j?.files) ? j.files.length : 0)
        })
        .catch(() => {
          if (!cancelled) setFileCount(0)
        })
    }
    load()
    window.addEventListener('forgelab-project-files-changed', load)
    return () => {
      cancelled = true
      window.removeEventListener('forgelab-project-files-changed', load)
    }
  }, [projectId])

  // ── Byg liste af items ──
  const items: SidebarItem[] = []

  // Tools med dedikerede /tools/<slug>-sider
  for (const { slug, tool } of projectTools) {
    if (!DEDICATED_PAGE_TOOL_SLUGS.has(slug)) continue
    const iconDef = getToolIcon(slug)
    items.push({
      key: `tool-${slug}`,
      label: tool.title,
      Icon: iconDef.Icon,
      iconBg: iconDef.bg,
      iconText: iconDef.text,
      onClick: () => {
        router.push(`/tools/${slug}?projectId=${encodeURIComponent(projectId)}`)
      },
    })
  }

  // Analytics — kun hvis projektet har relevante tools
  const hasAnalyticsTool = projectTools.some(({ slug }) => ANALYTICS_RELEVANT_SLUGS.has(slug))
  if (hasAnalyticsTool) {
    items.push({
      key: 'analytics',
      label: 'Analytics',
      Icon: BarChart3,
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-700',
      onClick: () => {
        router.push(`/analytics?project=${encodeURIComponent(projectId)}`)
      },
    })
  }

  // PDF'er — altid synlig i sidebaren som permanent indgang.
  // Tæller vises kun når projektet faktisk har uploadede filer.
  items.push({
    key: 'files',
    label: fileCount && fileCount > 0 ? `Filer · ${fileCount}` : 'Filer',
    Icon: FileText,
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-700',
    onClick: onOpenFilesTab,
  })

  const width = collapsed ? 56 : 240

  return (
    <aside
      data-project-board-sidebar
      style={{
        position: 'fixed',
        top: topOffset,
        left: 0,
        bottom: 0,
        width,
        background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        boxShadow: '4px 0 16px rgba(0,0,0,0.04)',
        zIndex: 530,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 180ms ease',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
      aria-label="Projektets fuldside-tools og assets"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '10px 8px' : '10px 12px',
          borderBottom: '1px solid #F3F4F6',
          minHeight: 44,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            Tool-sider
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Udvid sidebar' : 'Kollaps sidebar'}
          aria-label={collapsed ? 'Udvid sidebar' : 'Kollaps sidebar'}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Liste */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {items.map((item) => {
          const isHovered = hoveredKey === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              title={item.label}
              aria-label={item.label}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '6px' : '6px 8px',
                border: 'none',
                background: isHovered ? '#F9FAFB' : 'transparent',
                borderRadius: 8,
                cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: '#374151',
                fontSize: 12.5,
                fontWeight: 500,
                textAlign: 'left',
                transition: 'background 120ms ease',
              }}
            >
              <span
                className={`${item.iconBg} ${item.iconText}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <item.Icon className="w-4 h-4" />
              </span>
              {!collapsed && (
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
