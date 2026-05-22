'use client'

import { memo, type ComponentType } from 'react'
import { getBoardToolMode } from '@/lib/board-tool-registry'
import { getToolComponent } from '@/components/ToolRegistry'
import BrugerrejsePreviewCard from '@/components/BrugerrejsePreviewCard'
import ServiceBlueprintPreviewCard from '@/components/ServiceBlueprintPreviewCard'
import SurveyPreviewCard from '@/components/SurveyPreviewCard'
import CardSortingPreviewCard from '@/components/CardSortingPreviewCard'
import QrGeneratorPreviewCard from '@/components/QrGeneratorPreviewCard'
import PesoPreviewCard from '@/components/PesoPreviewCard'
import GoldenCirclePreviewCard from '@/components/GoldenCirclePreviewCard'

const FOCUS_ONLY_PREVIEW: Record<string, ComponentType> = {
  brugerrejse: BrugerrejsePreviewCard,
  'service-blueprint': ServiceBlueprintPreviewCard,
  peso: PesoPreviewCard,
  'golden-circle': GoldenCirclePreviewCard,
  'survey-template': SurveyPreviewCard,
  'card-sorting': CardSortingPreviewCard,
  'qr-generator': QrGeneratorPreviewCard,
}

type BoardToolCardContentProps = {
  slug: string
}

function BoardToolCardContentInner({ slug }: BoardToolCardContentProps) {
  const mode = getBoardToolMode(slug)

  if (mode !== 'interactive') {
    const Preview = FOCUS_ONLY_PREVIEW[slug]
    if (Preview) {
      return <Preview />
    }
    return (
      <p style={{ margin: '12px 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.45 }}>
        Forhåndsvisning for dette værktøj er ikke tilgængelig på boardet. Åbn værktøjet via sidepanelet
        eller den dedikerede fane.
      </p>
    )
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
}

const BoardToolCardContent = memo(BoardToolCardContentInner)
export default BoardToolCardContent
