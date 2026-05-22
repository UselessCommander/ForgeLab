'use client'

import { ToolIllustration } from '@/app/vaerktoejer/components/ToolIllustration'

type MethodIllustrationProps = {
  slug: string
  title: string
  variant?: 'default' | 'hero'
}

export default function MethodIllustration({ slug, title, variant = 'default' }: MethodIllustrationProps) {
  const isHero = variant === 'hero'

  return (
    <div
      className={
        isHero
          ? 'relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-6 shadow-inner backdrop-blur-sm md:min-h-[240px]'
          : 'flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 p-6 shadow-sm md:min-h-[220px]'
      }
      aria-label={`Illustration af ${title}`}
    >
      {isHero && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(251,191,36,0.12),transparent_65%)]"
          aria-hidden
        />
      )}
      <div className={`relative w-full ${isHero ? 'max-w-[300px]' : 'max-w-[280px]'}`}>
        <ToolIllustration slug={slug} />
      </div>
    </div>
  )
}
