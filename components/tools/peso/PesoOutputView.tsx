'use client'

import { memo } from 'react'
import { PesoReadonlyBoard } from './PesoReadonlyBoard'
import type { PesoModelData } from './peso-data'

type PesoOutputViewProps = {
  data: PesoModelData
}

/** Ren outputvisning — bruges kun via board-preview, ikke som separat route. */
function PesoOutputViewInner({ data }: PesoOutputViewProps) {
  return <PesoReadonlyBoard data={data} />
}

const PesoOutputView = memo(PesoOutputViewInner)
export default PesoOutputView
