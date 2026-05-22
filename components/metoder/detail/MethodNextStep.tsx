import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { MethodAccentTheme } from '@/lib/method-page-ui'

type MethodNextStepProps = {
  methodTitle: string
  toolHref: string
  ctaLabel: string
  accent: MethodAccentTheme
}

export default function MethodNextStep({
  methodTitle,
  toolHref,
  ctaLabel,
  accent,
}: MethodNextStepProps) {
  return (
    <section
      id="naeste-skridt"
      className={`scroll-mt-28 rounded-2xl border p-5 md:p-6 ${accent.softPanel} border-gray-200/70`}
    >
      <h2 className="mb-1 text-sm font-extrabold text-gray-900">Næste skridt</h2>
      <p className="mb-4 max-w-lg text-xs leading-relaxed text-gray-600 md:text-sm">
        Brug {methodTitle} i et projekt med det tilhørende analyseværktøj i ForgeLab.
      </p>
      <Link
        href={toolHref}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-900/10 bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  )
}
