import { AlertTriangle, Lightbulb } from 'lucide-react'
import type { MethodAccentTheme } from '@/lib/method-page-ui'
import type { MethodContentSection, MethodContentSectionVariant } from '@/lib/method-content'
import MethodBodyText from '@/components/metoder/detail/MethodBodyText'
import MethodCallout from '@/components/metoder/detail/MethodCallout'
import MethodCaseStudies from '@/components/metoder/detail/MethodCaseStudies'

const SECTION_STYLES: Record<MethodContentSectionVariant, string> = {
  default: 'border-gray-200/80 bg-white shadow-sm',
  highlight: 'border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-white shadow-sm',
  example: 'border-violet-200/60 bg-gradient-to-br from-violet-50/30 to-white shadow-sm',
  caution: 'border-rose-200/60 bg-gradient-to-br from-rose-50/35 to-white shadow-sm',
}

function SectionIcon({ variant }: { variant: MethodContentSectionVariant }) {
  if (variant === 'example') {
    return <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" aria-hidden />
  }
  if (variant === 'caution') {
    return <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" aria-hidden />
  }
  return null
}

type MethodSectionCardProps = {
  section: MethodContentSection
  callout?: string
  accent: MethodAccentTheme
}

export default function MethodSectionCard({ section, callout, accent }: MethodSectionCardProps) {
  const variant = section.variant ?? 'default'

  return (
    <section
      id={section.id}
      className={`scroll-mt-28 rounded-2xl border p-5 md:p-6 ${SECTION_STYLES[variant]}`}
    >
      <div className="mb-3 flex items-start gap-2">
        <SectionIcon variant={variant} />
        <h3 className="text-sm font-extrabold text-gray-900 md:text-base">{section.title}</h3>
      </div>
      {callout && <MethodCallout text={callout} variant={variant} accent={accent} />}
      <MethodBodyText body={section.body} />
      {section.caseStudies && section.caseStudies.length > 0 && (
        <MethodCaseStudies caseStudies={section.caseStudies} accent={accent} />
      )}
    </section>
  )
}
