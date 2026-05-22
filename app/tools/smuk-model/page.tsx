'use client'

import ToolLayout from '@/components/ToolLayout'
import SmukModelContent from '@/components/tools/SmukModelContent'

export default function SmukModelPage() {
  return (
    <ToolLayout
      title="SMUK-model"
      description="Vurder og sammenlign segmenter ud fra Størrelse, Muligheder, Udgifter og Konkurrence. En systematisk tilgang til målgruppevalg."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <SmukModelContent />
    </ToolLayout>
  )
}
