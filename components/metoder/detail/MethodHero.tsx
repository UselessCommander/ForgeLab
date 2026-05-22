import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import type { MethodAccentTheme } from '@/lib/method-page-ui'
import MethodIllustration from '@/components/metoder/MethodIllustration'

type MethodHeroProps = {
  title: string
  shortDescription: string
  slug: string
  Icon: LucideIcon
  accent: MethodAccentTheme
  badges: string[]
  heroImageSrc?: string
  heroImageAlt?: string
}

export default function MethodHero({
  title,
  shortDescription,
  slug,
  Icon,
  accent,
  badges,
  heroImageSrc,
  heroImageAlt,
}: MethodHeroProps) {
  return (
    <header className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent.heroGlow} pointer-events-none`}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${accent.heroGrid} 1px, transparent 1px), linear-gradient(90deg, ${accent.heroGrid} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_minmax(260px,340px)] lg:items-center">
        <div className="min-w-0">
          <div className="mb-4 flex items-start gap-4">
            <div
              className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ring-4 ring-white/80 ${accent.iconBg} ${accent.iconText} shadow-sm`}
            >
              <Icon className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl lg:text-[2rem]">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
                {shortDescription}
              </p>
            </div>
          </div>
          {badges.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Metodekategorier">
              {badges.map((badge, i) => (
                <li key={badge}>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      i === 0 ? accent.badge : accent.badgeMuted
                    }`}
                  >
                    {badge}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`relative rounded-2xl ${accent.ring} ring-4 ring-offset-2 ring-offset-white`}>
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-white/0 via-white/40 to-white/80 blur-2xl pointer-events-none" aria-hidden />
          {heroImageSrc ? (
            <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner backdrop-blur-sm md:min-h-[240px]">
              <Image
                src={heroImageSrc}
                alt={heroImageAlt ?? `Illustration af ${title}`}
                width={640}
                height={480}
                unoptimized
                className="h-auto w-full max-w-full object-contain"
                priority
              />
            </div>
          ) : (
            <MethodIllustration slug={slug} title={title} variant="hero" />
          )}
        </div>
      </div>
    </header>
  )
}
