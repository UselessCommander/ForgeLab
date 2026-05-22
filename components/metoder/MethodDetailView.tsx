import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import type { MethodCatalogEntry } from '@/lib/method-catalog'
import {
  getMethodCtaLabel,
  getMethodToolHref,
} from '@/lib/method-catalog'
import type { MethodPageContent } from '@/lib/method-content'
import { buildMethodPageUi, getSectionCallout } from '@/lib/method-page-ui'
import MethodHero from '@/components/metoder/detail/MethodHero'
import MethodTableOfContents from '@/components/metoder/detail/MethodTableOfContents'
import MethodSectionCard from '@/components/metoder/detail/MethodSectionCard'
import MethodVisualCards from '@/components/metoder/detail/MethodVisualCards'
import MethodStepper from '@/components/metoder/detail/MethodStepper'
import MethodRelatedMethods from '@/components/metoder/detail/MethodRelatedMethods'
import MethodNextStep from '@/components/metoder/detail/MethodNextStep'
import MethodBodyText from '@/components/metoder/detail/MethodBodyText'
import MethodCallout from '@/components/metoder/detail/MethodCallout'

type MethodDetailViewProps = {
  method: MethodCatalogEntry
  content: MethodPageContent
}

export default function MethodDetailView({ method, content }: MethodDetailViewProps) {
  const { Icon } = getToolIcon(method.slug)
  const ui = buildMethodPageUi(method, content)
  const { accent, config, toc, steps, badges } = ui
  const related = content.relatedMethods ?? []
  const toolCtaLabel = getMethodCtaLabel(method.slug)
  const visualCards = config.visualCards ?? []
  const visualAfterId = config.visualCardsAfterSectionId ?? 'what'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-5">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Brødkrummesti">
        <Link
          href="/metodebibliotek"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Metoder
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-gray-900">{method.title}</span>
      </nav>

      <MethodHero
        title={method.title}
        shortDescription={method.shortDescription}
        slug={method.slug}
        Icon={Icon}
        accent={accent}
        badges={badges}
        heroImageSrc={config.heroImageSrc}
        heroImageAlt={config.heroImageAlt}
      />

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[240px_minmax(0,1fr)]">
        <MethodTableOfContents items={toc} accent={accent} />

        <main className="min-w-0">
          {content.summary && (
            <section
              id="kort-beskrivelse"
              className={`scroll-mt-28 mb-8 rounded-2xl border border-gray-200/70 px-5 py-4 md:px-6 md:py-5 ${accent.softPanel}`}
            >
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-gray-400">
                Kort beskrivelse
              </h2>
              <div className="mt-3">
                <MethodBodyText body={content.summary} />
              </div>
            </section>
          )}

          <MethodStepper steps={steps} accent={accent} />

          {config.quote && (
            <MethodCallout text={config.quote} variant="highlight" accent={accent} />
          )}

          <article className="mb-10 space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-gray-400">
              Om metoden
            </h2>
            <div className="space-y-4">
              {content.sections.map((section) => (
                <div key={section.id}>
                  <MethodSectionCard
                    section={section}
                    callout={getSectionCallout(section, config)}
                    accent={accent}
                  />
                  {visualCards.length > 0 && section.id === visualAfterId && (
                    <MethodVisualCards cards={visualCards} accent={accent} />
                  )}
                </div>
              ))}
            </div>
          </article>

          <MethodRelatedMethods related={related} />

          <MethodNextStep
            methodTitle={method.title}
            toolHref={getMethodToolHref(method.slug)}
            ctaLabel={toolCtaLabel}
            accent={accent}
          />

          <p className="mt-8 text-center">
            <Link
              href="/metodebibliotek"
              className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:underline"
            >
              ← Tilbage til alle metoder
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
