import { AlertTriangle, Lightbulb, Quote } from 'lucide-react'
import type { MethodAccentTheme } from '@/lib/method-page-ui'
import type { MethodContentSectionVariant } from '@/lib/method-content'

type MethodCalloutProps = {
  text: string
  variant?: MethodContentSectionVariant
  accent: MethodAccentTheme
}

const VARIANT_ICON = {
  highlight: Lightbulb,
  example: Lightbulb,
  caution: AlertTriangle,
  default: Quote,
} as const

export default function MethodCallout({ text, variant = 'default', accent }: MethodCalloutProps) {
  const Icon = VARIANT_ICON[variant] ?? Quote
  const style =
    variant === 'highlight'
      ? accent.calloutHighlight
      : variant === 'example'
        ? accent.calloutExample
        : variant === 'caution'
          ? accent.calloutCaution
          : accent.calloutDefault

  return (
    <aside
      className={`mb-5 flex gap-3 rounded-xl border px-4 py-3.5 ${style}`}
      aria-label="Fremhævet pointer"
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-70" aria-hidden />
      <p className="text-sm font-medium leading-relaxed md:text-[15px]">{text}</p>
    </aside>
  )
}
