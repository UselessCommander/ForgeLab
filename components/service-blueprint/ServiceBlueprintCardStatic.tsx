'use client'

import {
  CARD_MAX_HEIGHT_PX,
  CARD_MIN_HEIGHT_PX,
  DEFAULT_CARD_TYPE,
  hasDisplayCardBody,
  hasDisplayCardTitle,
  shouldShowCardTypeLabel,
  type BlueprintCardData,
  type CardTypes,
  hexToTailwindClasses,
} from '@/lib/service-blueprint'

export function ServiceBlueprintCardStatic({
  card,
  cardTypes,
}: {
  card: BlueprintCardData
  cardTypes: CardTypes
}) {
  const type =
    cardTypes[card.type] ||
    cardTypes[DEFAULT_CARD_TYPE] || {
      label: 'Default',
      ...hexToTailwindClasses('#64748b'),
    }
  const span = card.colSpan || 1
  const usesCustomColor = type.card.includes('bg-opacity')
  const showTitle = hasDisplayCardTitle(card.title)
  const showBody = hasDisplayCardBody(card.body)
  const showTypeLabel = shouldShowCardTypeLabel(type.label)

  return (
    <div
      data-card-id={card.id}
      className={`relative rounded-2xl border p-3 shadow-sm ${type.card} flex min-h-0 flex-col overflow-hidden pointer-events-none select-none`}
      style={{
        height: '100%',
        minHeight: showBody ? CARD_MIN_HEIGHT_PX : showTitle ? 120 : 96,
        maxHeight: CARD_MAX_HEIGHT_PX,
        backgroundColor: usesCustomColor ? `${type.stroke}15` : undefined,
        borderColor: usesCustomColor ? `${type.stroke}40` : undefined,
      }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-row items-start gap-2">
        <div className="mt-0.5 shrink-0 text-slate-300">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="5" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center self-start">
              <span
                className={`block h-2.5 w-2.5 shrink-0 rounded-full ${type.dot}`}
                style={{
                  backgroundColor: type.stroke,
                  minWidth: 10,
                  minHeight: 10,
                  maxWidth: 10,
                  maxHeight: 10,
                }}
              />
            </span>
            {showTypeLabel && (
              <span className="max-w-[130px] rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-semibold">
                {type.label || 'Kategori'}
              </span>
            )}
            {span > 1 && (
              <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                {span} faser
              </span>
            )}
          </div>
          {showTitle && (
            <p className="w-full text-sm font-extrabold text-inherit">{card.title.trim()}</p>
          )}
          {showBody && (
            <p
              className={`${showTitle ? 'mt-1' : ''} w-full flex-1 whitespace-pre-wrap text-xs leading-relaxed ${type.muted}`}
              style={{ color: usesCustomColor ? '#334155' : undefined }}
            >
              {card.body.trim()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
