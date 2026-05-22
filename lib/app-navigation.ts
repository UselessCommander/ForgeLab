import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  LayoutTemplate,
  Wrench,
  BarChart3,
  Building2,
  Settings,
} from 'lucide-react'

export type AppNavItem = {
  href: string
  label: string
  description?: string
  icon: LucideIcon
  /** Prefix match for active state (e.g. /dashboard/projects) */
  matchPrefix?: boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Overblik og fortsæt hvor du slap',
    icon: LayoutDashboard,
  },
  {
    href: '/projekter',
    label: 'Projekter',
    description: 'Alle dine projekter',
    icon: FolderKanban,
    matchPrefix: true,
  },
  {
    href: '/metodebibliotek',
    label: 'Metoder',
    description: 'Metodebibliotek',
    icon: BookOpen,
    matchPrefix: true,
  },
  {
    href: '/templates',
    label: 'Templates',
    description: 'Projektstartere',
    icon: LayoutTemplate,
  },
  {
    href: '/vaerktojer',
    label: 'Værktøjer',
    description: 'Uden projekt',
    icon: Wrench,
    matchPrefix: true,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    description: 'Data og indsigt',
    icon: BarChart3,
    matchPrefix: true,
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    description: 'Teams og kunder',
    icon: Building2,
  },
  {
    href: '/indstillinger',
    label: 'Indstillinger',
    description: 'Profil og tema',
    icon: Settings,
    matchPrefix: true,
  },
]

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  if (item.href === '/dashboard') {
    return pathname === '/dashboard'
  }
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}
