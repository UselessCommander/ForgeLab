import { VAERKTOEJER, type Vaerktoej } from '@/lib/vaerktoejer-data'
import { methodSlugLinkedInSprintDay } from '@/lib/gv-design-sprint-framework'
import {
  getMethodCatalogEntry,
  methodMatchesDesignThinkingPhase,
  methodMatchesDiamondPhase,
  type MethodDesignThinkingPhase,
  type MethodDiamondPhase,
} from '@/lib/method-catalog'
import {
  getDefaultPhaseForTool,
  getFrameworkPhases,
  type DesignThinkingPhase,
  type DoubleDiamondPhase,
  type FrameworkId,
  type GoogleDesignSprintPhase,
} from '@/lib/frameworks'

const EXCLUDED_SLUGS = new Set(['qr-generator', 'project-slides'])

export type DashboardFrameworkId = Exclude<FrameworkId, 'none'>

export const DASHBOARD_FRAMEWORK_OPTIONS: Array<{ id: DashboardFrameworkId; label: string }> = [
  { id: 'double-diamond', label: 'Double Diamond' },
  { id: 'design-thinking', label: 'Design Thinking' },
  { id: 'google-design-sprint', label: 'GV Design Sprint' },
]

export type DashboardFrameworkPhaseId =
  | DoubleDiamondPhase
  | DesignThinkingPhase
  | GoogleDesignSprintPhase

/** Up to 5 ForgeLab tools per phase for dashboard navigation. */
export function getToolsForFrameworkPhase(
  framework: DashboardFrameworkId,
  phase: DashboardFrameworkPhaseId,
  limit = 5
): Vaerktoej[] {
  return VAERKTOEJER.filter((tool) => {
    if (EXCLUDED_SLUGS.has(tool.slug)) return false
    const entry = getMethodCatalogEntry(tool.slug)
    if (framework === 'double-diamond') {
      if (entry) {
        return methodMatchesDiamondPhase(entry, phase as MethodDiamondPhase)
      }
      if (tool.slug === 'hmw' && phase === 'develop') return true
      return getDefaultPhaseForTool(framework, tool.slug) === phase
    }
    if (framework === 'design-thinking') {
      if (entry) {
        return methodMatchesDesignThinkingPhase(entry, phase as MethodDesignThinkingPhase)
      }
      return getDefaultPhaseForTool(framework, tool.slug) === phase
    }
    if (framework === 'google-design-sprint') {
      return methodSlugLinkedInSprintDay(tool.slug, phase as import('@/lib/frameworks').GoogleDesignSprintPhase)
    }
    return getDefaultPhaseForTool(framework, tool.slug) === phase
  }).slice(0, limit)
}

export function getDashboardFrameworkPhases(framework: DashboardFrameworkId) {
  return getFrameworkPhases(framework)
}

export function getDefaultDashboardPhase(framework: DashboardFrameworkId): DashboardFrameworkPhaseId {
  const phases = getDashboardFrameworkPhases(framework)
  return phases[0]?.id as DashboardFrameworkPhaseId
}

/** @deprecated Use getToolsForFrameworkPhase */
export function getToolsForDoubleDiamondPhase(phase: DoubleDiamondPhase, limit = 5): Vaerktoej[] {
  return getToolsForFrameworkPhase('double-diamond', phase, limit)
}

export const DOUBLE_DIAMOND_PHASE_ORDER: DoubleDiamondPhase[] = [
  'discover',
  'define',
  'develop',
  'deliver',
]
