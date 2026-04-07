'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

export const ToolRegistry: Record<string, ComponentType<any>> = {
  'aaker-identity-model': dynamic(() => import('@/app/tools/aaker-identity-model/page')),
  'ab-test': dynamic(() => import('@/app/tools/ab-test/page')),
  'affinity-diagram': dynamic(() => import('@/app/tools/affinity-diagram/page')),
  'brainstorming': dynamic(() => import('@/app/tools/brainstorming/page')),
  'brugerrejse': dynamic(() => import('@/app/tools/brugerrejse/page')),
  'business-model-canvas': dynamic(() => import('@/app/tools/business-model-canvas/page')),
  'card-sorting': dynamic(() => import('@/app/tools/card-sorting/page')),
  'dikw-pyramiden': dynamic(() => import('@/app/tools/dikw-pyramiden/page')),
  'empathy-map': dynamic(() => import('@/app/tools/empathy-map/page')),
  'five-whys': dynamic(() => import('@/app/tools/five-whys/page')),
  'gallup-kompasrose': dynamic(() => import('@/app/tools/gallup-kompasrose/page')),
  'gantt-chart': dynamic(() => import('@/app/tools/gantt-chart/page')),
  'hmw': dynamic(() => import('@/app/tools/hmw/page')),
  'kanban': dynamic(() => import('@/app/tools/kanban/page')),
  'persona-canvas': dynamic(() => import('@/app/tools/persona-canvas/page')),
  'pestel': dynamic(() => import('@/app/tools/pestel/page')),
  'pirate-funnel': dynamic(() => import('@/app/tools/pirate-funnel/page')),
  'porters-five-forces': dynamic(() => import('@/app/tools/porters-five-forces/page')),
  'qr-generator': dynamic(() => import('@/app/tools/qr-generator/page')),
  'scamper': dynamic(() => import('@/app/tools/scamper/page')),
  'smuk-model': dynamic(() => import('@/app/tools/smuk-model/page')),
  'survey-template': dynamic(() => import('@/app/tools/survey-template/page')),
  'swot-generator': dynamic(() => import('@/app/tools/swot-generator/page')),
  'tows-matrix': dynamic(() => import('@/app/tools/tows-matrix/page')),
  'value-proposition-canvas': dynamic(() => import('@/app/tools/value-proposition-canvas/page')),
}

export function getToolComponent(slug: string): ComponentType<any> | null {
  return ToolRegistry[slug] || null
}
