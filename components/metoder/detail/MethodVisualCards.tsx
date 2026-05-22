import Image from 'next/image'
import type { MethodAccentTheme, MethodVisualCard } from '@/lib/method-page-ui'

type MethodVisualCardsProps = {
  cards: MethodVisualCard[]
  accent: MethodAccentTheme
  title?: string
}

export default function MethodVisualCards({
  cards,
  accent,
  title = 'De ni byggesten',
}: MethodVisualCardsProps) {
  if (cards.length === 0) return null

  const hasImages = cards.some((c) => c.imageSrc)

  return (
    <section
      className={`my-6 rounded-2xl border border-gray-200/60 p-5 md:p-6 ${accent.softPanel}`}
      aria-label={title}
    >
      <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wide text-gray-400">{title}</h3>
      <ul
        className={`grid gap-4 ${
          hasImages
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : cards.length <= 4
              ? 'sm:grid-cols-2'
              : cards.length === 5
                ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                : 'sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <li key={card.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-white/80 bg-white/90 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                {card.imageSrc ? (
                  <div className="relative aspect-[4/3] w-full bg-gray-50">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt ?? card.title}
                      fill
                      unoptimized
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : Icon ? (
                  <div className="p-4 pb-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-4 pt-3">
                  <h4 className="text-sm font-bold text-gray-900">{card.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{card.label}</p>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
