'use client'

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import type { MethodAccentTheme } from '@/lib/method-page-ui'
import type { MethodCaseStudy } from '@/lib/method-content'
import MethodBodyText from '@/components/metoder/detail/MethodBodyText'

type MethodCaseStudiesProps = {
  caseStudies: MethodCaseStudy[]
  accent: MethodAccentTheme
}

const OUTER_DETAILS =
  'group rounded-2xl border border-violet-200/50 bg-white/90 shadow-sm overflow-hidden'
const INNER_DETAILS =
  'group rounded-xl border border-gray-200/70 bg-gray-50/50 overflow-hidden'
const SUMMARY_BASE =
  'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden'

function CaseStudyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative my-4 w-full overflow-hidden rounded-xl border border-gray-200/80 bg-white">
      <Image
        src={src}
        alt={alt}
        width={960}
        height={720}
        unoptimized
        className="h-auto w-full object-contain"
      />
    </div>
  )
}

export default function MethodCaseStudies({ caseStudies, accent }: MethodCaseStudiesProps) {
  if (caseStudies.length === 0) return null

  return (
    <div className="mt-6 space-y-3" aria-label="Case-eksempler">
      {caseStudies.map((study) => (
        <details key={study.id} className={OUTER_DETAILS} name={`case-study-${study.id}`}>
          <summary className={`${SUMMARY_BASE} md:px-5 md:py-4 md:text-base`}>
            <span>{study.title}</span>
            <ChevronRight
              className="h-4 w-4 flex-shrink-0 text-violet-500 transition-transform group-open:rotate-90"
              aria-hidden
            />
          </summary>
          <div className="border-t border-violet-100/80 px-4 pb-5 pt-4 md:px-5 md:pb-6">
            <MethodBodyText body={study.intro} />

            {study.overviewImageSrc && (
              <CaseStudyImage
                src={study.overviewImageSrc}
                alt={study.overviewImageAlt ?? `${study.title} — Business Model Canvas`}
              />
            )}

            <div className="mt-5 space-y-2" role="group" aria-label={`${study.title} — de ni byggesten`}>
              {study.blocks.map((block, index) => (
                <details key={block.id} className={INNER_DETAILS}>
                  <summary className={`${SUMMARY_BASE} py-3 text-[13px] md:text-sm`}>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${accent.iconBg} ${accent.iconText}`}
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <span className="truncate">{block.title}</span>
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-90"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-gray-200/60 px-4 pb-4 pt-3 md:px-4">
                    <MethodBodyText body={block.body} />
                    {block.imageSrc && (
                      <CaseStudyImage
                        src={block.imageSrc}
                        alt={block.imageAlt ?? `${study.title} — ${block.title}`}
                      />
                    )}
                  </div>
                </details>
              ))}
            </div>

            {study.summary && (
              <div
                className={`mt-5 rounded-xl border px-4 py-3.5 md:px-5 ${accent.softPanel} border-gray-200/60`}
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Samlet vurdering
                </p>
                <MethodBodyText body={study.summary} />
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
