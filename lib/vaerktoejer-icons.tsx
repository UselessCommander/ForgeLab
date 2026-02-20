import {
  LayoutGrid,
  QrCode,
  Grid2X2,
  LayoutTemplate,
  CalendarRange,
  Compass,
  Table2,
  Shield,
  Target,
  Heart,
  Layers,
  Mountain,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'

export const TOOL_ICONS: Record<string, { Icon: LucideIcon; bg: string; text: string }> = {
  'qr-generator': { Icon: QrCode, bg: 'bg-amber-50', text: 'text-amber-600' },
  'swot-generator': { Icon: Grid2X2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'business-model-canvas': { Icon: LayoutTemplate, bg: 'bg-sky-50', text: 'text-sky-600' },
  'gantt-chart': { Icon: CalendarRange, bg: 'bg-violet-50', text: 'text-violet-600' },
  'gallup-kompasrose': { Icon: Compass, bg: 'bg-rose-50', text: 'text-rose-600' },
  'tows-matrix': { Icon: Table2, bg: 'bg-orange-50', text: 'text-orange-600' },
  'porters-five-forces': { Icon: Shield, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'value-proposition-canvas': { Icon: Target, bg: 'bg-teal-50', text: 'text-teal-600' },
  'empathy-map': { Icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600' },
  'card-sorting': { Icon: Layers, bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'maslow-model': { Icon: Mountain, bg: 'bg-amber-50', text: 'text-amber-700' },
  'survey-template': { Icon: ClipboardList, bg: 'bg-lime-50', text: 'text-lime-600' },
}

export function getToolIcon(slug: string) {
  return TOOL_ICONS[slug] ?? { Icon: LayoutGrid, bg: 'bg-violet-50', text: 'text-violet-600' }
}
