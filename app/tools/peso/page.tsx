'use client'

import ToolLayout from '@/components/ToolLayout'
import PesoTool from '@/components/tools/peso/PesoTool'

export default function PesoToolPage() {
  return (
    <ToolLayout
      title="PESO-model"
      description="Kortlæg Paid, Earned, Shared og Owned media — med overlap og integreret kernefortælling."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
      embedTransparent
    >
      <PesoTool />
    </ToolLayout>
  )
}
