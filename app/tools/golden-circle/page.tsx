'use client'

import ToolLayout from '@/components/ToolLayout'
import GoldenCircleTool from '@/components/tools/golden-circle/GoldenCircleTool'

export default function GoldenCirclePage() {
  return (
    <ToolLayout
      title="The Golden Circle"
      description="Formuler WHY, HOW og WHAT — fra formål til tilbud."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
      embedTransparent
    >
      <GoldenCircleTool />
    </ToolLayout>
  )
}
