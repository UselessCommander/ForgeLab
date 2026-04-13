'use client'

import ToolLayout from '@/components/ToolLayout'

export default function EmpathyMap() {
  return (
    <ToolLayout
      title="Empathy Map"
      description="Forstå kundens perspektiv gennem deres ord, tanker, følelser og handlinger"
      embedTransparent
    >
      <div className="relative mx-auto w-full max-w-[1400px] overflow-visible bg-transparent">
        <img
          src="/diagrams/empathy-map.svg"
          alt="Empathy map template"
          className="h-auto w-full select-none"
          draggable={false}
        />
      </div>
    </ToolLayout>
  )
}
